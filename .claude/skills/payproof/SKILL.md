# OCR Setup Skill

## Description

Guide to set up the Python environment for PayProof's OCR backend (EasyOCR + OpenCV). This skill prepares the local development environment so the FastAPI server can extract text from payment screenshots entirely on-device.

---

## Steps

### 1. Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

Isolates project dependencies from system Python. Always activate the venv before installing or running the backend.

### 2. Install dependencies

```bash
pip install -r backend/requirements.txt
```

This installs all required packages:

| Package | Purpose |
|---|---|
| `easyocr` | OCR text extraction from images |
| `opencv-python` | Image pre-processing (grayscale, denoise) before OCR |
| `pillow` | Image format handling (PNG, JPG, WebP) |
| `fastapi` | REST API framework |
| `uvicorn` | ASGI server to run FastAPI |
| `python-multipart` | Multipart form parsing for file uploads |
| `openai` | LLM parser via LiteLLM proxy for structured extraction |
| `pydantic` | Data validation and schemas |
| `python-dotenv` | Load .env files |
| `aiofiles` | Async file operations |

### 3. Verify OCR works

Run this Python snippet to confirm the engine initialises and can process an image:

```python
import easyocr
reader = easyocr.Reader(['en'], gpu=False)
result = reader.readtext('test-image.png')
for bbox, text, confidence in result:
    print(f"{text} ({confidence:.2f})")
```

If this prints detected text blocks with confidence scores, the environment is ready.

---

## Notes

- **First run** downloads the EasyOCR detection and recognition models automatically (~2 minutes, ~200 MB RAM). Subsequent runs use the cached models.
- **CPU-only** is fine for MVP — no GPU required. A single screenshot is processed in ~1–2 seconds on a modern CPU.
- **Model download failure** — EasyOCR fetches models from a CDN on first use. If it fails, check your internet connection and retry. The models are cached in `~/.EasyOCR/` after the first successful download.
- **Troubleshooting** — If installation fails, check Python version (3.8–3.12 supported) and pip version (`pip install --upgrade pip`).
