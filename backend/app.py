"""
PayProof OCR API — FastAPI application

POST /api/v1/ocr    Upload a payment screenshot, get extracted fields.
GET  /health        Liveness check.
GET  /{*path}       Serve frontend (production only).
"""

import asyncio
import logging
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.llm_parser import parse_with_proxy
from backend.ocr_engine import scan_image

# ── Config ────────────────────────────────────────────────────────────────
load_dotenv()
PORT = int(os.getenv("PORT", "8765"))

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {"image/png", "image/jpg", "image/jpeg", "image/webp"}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────
app = FastAPI(title="PayProof OCR API", version="0.1.0")

# CORS: allow localhost for dev, and any Railway domain in production
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/v1/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    # 1. Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Allowed: {', '.join(sorted(ALLOWED_TYPES))}",
        )

    # 2. Save uploaded file
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "png"
    saved_name = f"{uuid.uuid4().hex}.{ext}"
    saved_path = UPLOADS_DIR / saved_name

    contents = await file.read()
    saved_path.write_bytes(contents)
    logger.info("Saved upload → %s (%d bytes)", saved_path, len(contents))

    # 3. Run OCR pipeline (regex-based extraction)
    try:
        result = scan_image(str(saved_path))
    except Exception as exc:
        logger.exception("OCR pipeline failed")
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing error: {exc}",
        )

    raw_text = result.get("raw_text", "")
    regex_fields = result["fields"]
    regex_confidence = result["confidence"]

    # 4. Run LLM parser (async, with 10s timeout)
    llm_result = None
    try:
        llm_result = await asyncio.wait_for(
            parse_with_proxy(raw_text), timeout=10.0
        )
    except asyncio.TimeoutError:
        logger.warning("LLM parser timed out (10s) — falling back to regex")
    except Exception as exc:
        logger.warning("LLM parser failed: %s — falling back to regex", exc)

    # 5. Merge results: prefer LLM if confidence > 0, else fall back to regex
    if llm_result and llm_result.confidence > 0:
        fields = {
            "amount": llm_result.amount,
            "ref_no": llm_result.ref_no,
            "sender": llm_result.sender,
            "date": llm_result.date,
        }
        # LLM confidence is 0-1 scale; convert to 0-100 for consistency
        confidence = llm_result.confidence * 100
        detected_app = llm_result.app_name or "unknown"
        llm_confidence = llm_result.confidence
        template = "llm"
        logger.info("Using LLM extraction (app=%s, confidence=%.1f)", detected_app, llm_confidence)
    else:
        fields = regex_fields
        confidence = regex_confidence
        detected_app = "KBZ Pay"  # regex template default
        llm_confidence = 0.0
        template = "kbz_pay"
        logger.info("Using regex extraction (confidence=%.1f)", confidence)

    # 6. Compute review status from confidence
    if confidence >= 95:
        review_status = "auto-accepted"
    elif confidence >= 70:
        review_status = "manual-review"
    else:
        review_status = "rejected"

    # 7. Build response
    return {
        "success": True,
        "data": {
            "amount": fields.get("amount"),
            "ref_no": fields.get("ref_no"),
            "sender": fields.get("sender"),
            "date": fields.get("date"),
            "confidence": round(confidence, 1),
            "review_status": review_status,
            "raw_text": raw_text,
            "template": template,
            "detected_app": detected_app,
            "llm_confidence": llm_confidence,
        },
    }


# ── Static file serving (production) ──────────────────────────────────────
# Serve the built React frontend in production
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Mount static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(request: Request, full_path: str):
        """Serve frontend files — fall back to index.html for client-side routing."""
        # Try to serve the exact file first
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        # Fall back to index.html for React Router
        return FileResponse(FRONTEND_DIST / "index.html")
