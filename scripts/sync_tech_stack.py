#!/usr/bin/env python3
"""
Auto-sync the Tech Stack slide in slides.md with actual dependencies.

Reads:
  - backend/requirements.txt
  - frontend/package.json
  - backend/ocr_engine.py (to detect OCR engine)
  - backend/app.py (to detect LLM parser)

Writes:
  - slides.md (replaces the Tech Stack section)

Usage:
  python3 scripts/sync_tech_stack.py          # dry-run (prints diff)
  python3 scripts/sync_tech_stack.py --apply   # writes to slides.md
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLIDES = ROOT / "slides.md"
REQ = ROOT / "backend" / "requirements.txt"
PKG = ROOT / "frontend" / "package.json"
OCR = ROOT / "backend" / "ocr_engine.py"
APP = ROOT / "backend" / "app.py"


def detect_ocr_engine() -> str:
    """Detect which OCR engine is used from ocr_engine.py."""
    text = OCR.read_text()
    if "import easyocr" in text or "from easyocr" in text:
        return "EasyOCR"
    if "import paddleocr" in text or "from paddleocr" in text:
        return "PaddleOCR"
    if "import tesseract" in text or "import pytesseract" in text:
        return "Tesseract"
    return "OCR"


def detect_llm_parser() -> str:
    """Detect if an LLM parser is used from app.py."""
    text = APP.read_text()
    if "llm_parser" in text or "parse_with_proxy" in text:
        return True
    return False


def get_backend_libs() -> list[str]:
    """Extract notable backend libraries from requirements.txt."""
    if not REQ.exists():
        return []
    libs = []
    skip = {"python-dotenv"}  # utility, not worth listing
    for line in REQ.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        name = re.split(r"[>=<~!]", line)[0].strip()
        if name in skip:
            continue
        # Map pip names to display names
        display = {
            "fastapi": "FastAPI",
            "uvicorn": "Uvicorn",
            "easyocr": "EasyOCR",
            "paddlepaddle": "PaddlePaddle",
            "paddleocr": "PaddleOCR",
            "opencv-python": "OpenCV",
            "pillow": "Pillow",
            "python-multipart": "python-multipart",
            "openai": "OpenAI SDK",
            "pydantic": "Pydantic",
            "aiofiles": "aiofiles",
            "sqlalchemy": "SQLAlchemy",
        }
        libs.append(display.get(name, name))
    return libs


def get_frontend_libs() -> list[str]:
    """Extract notable frontend libraries from package.json."""
    if not PKG.exists():
        return []
    pkg = json.loads(PKG.read_text())
    deps = pkg.get("dependencies", {})
    display = {
        "react": "React 19",
        "react-dom": "React DOM",
        "react-router-dom": "React Router",
        "react-dropzone": "React Dropzone",
        "tailwindcss": "Tailwind CSS 4",
        "@tailwindcss/vite": "Tailwind Vite",
    }
    result = []
    for name in deps:
        if name in display:
            result.append(display[name])
    return result


def build_tech_stack_section() -> str:
    """Build the Tech Stack slide content from actual dependencies."""
    ocr = detect_ocr_engine()
    has_llm = detect_llm_parser()
    backend_libs = get_backend_libs()
    frontend_libs = get_frontend_libs()

    # Build frontend line
    frontend_items = [l for l in frontend_libs if l not in ("React DOM", "Tailwind Vite")]
    frontend_line = " · ".join(frontend_items)

    # Build backend line
    backend_items = [l for l in backend_libs if l in ("FastAPI", ocr, "OpenCV")]
    backend_line = "Python " + " · ".join(backend_items)

    # Build pipeline flow
    pipeline = f"Receipt → {ocr} → raw text → "
    if has_llm:
        pipeline += "Regex + LLM Parser → structured JSON"
    else:
        pipeline += "Regex extraction → structured JSON"

    lines = [
        "# Tech Stack 🔧",
        "",
        "| Layer | Technology |",
        "|---|---|",
        f"| **Frontend** | {frontend_line} |",
        f"| **Backend** | {backend_line} |",
    ]

    if has_llm:
        lines.append("| **LLM Parser** | LiteLLM proxy → structured JSON extraction |")

    lines += [
        "",
        "### Pipeline Flow",
        "```",
        pipeline,
        "```",
        "",
        "- **One API endpoint:** `POST /api/v1/ocr`",
        "- **Multi-format:** KBZ Pay, Wave Money, AYA Pay, bank screenshots",
    ]

    return "\n".join(lines)


def replace_tech_stack(content: str, new_section: str) -> str:
    """Replace the Tech Stack section in slides.md."""
    # Match from "# Tech Stack" to the next "---"
    pattern = r"<!-- slide 4 -->.*?# Tech Stack.*?(?=---)"
    replacement = f"<!-- slide 4 -->\n{new_section}\n\n---\n"

    result = re.sub(pattern, replacement, content, flags=re.DOTALL)
    return result


def main():
    apply = "--apply" in sys.argv

    new_section = build_tech_stack_section()
    slides_content = SLIDES.read_text()
    updated = replace_tech_stack(slides_content, new_section)

    if updated == slides_content:
        print("✅ Tech stack slide is already in sync.")
        return

    if apply:
        SLIDES.write_text(updated)
        print("✅ Tech stack slide updated.")
    else:
        print("📋 Proposed Tech Stack slide (dry-run):")
        print("=" * 60)
        print(new_section)
        print("=" * 60)
        print("\nRun with --apply to write changes.")


if __name__ == "__main__":
    main()
