"""
PayProof OCR API — FastAPI application

POST /api/v1/ocr    Upload a payment screenshot, get extracted fields.
GET  /health        Liveness check.
"""

import logging
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ocr_engine import scan_image

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

    # 3. Run OCR pipeline
    try:
        fields, confidence, review_status = scan_image(str(saved_path))
    except Exception as exc:
        logger.exception("OCR pipeline failed")
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing error: {exc}",
        )

    # 4. Build response
    return {
        "success": True,
        "data": {
            "amount": fields.get("amount"),
            "ref_no": fields.get("ref_no"),
            "sender": fields.get("sender"),
            "date": fields.get("date"),
            "confidence": round(confidence, 1),
            "review_status": review_status,
            "template": "kbz_pay",
        },
    }
