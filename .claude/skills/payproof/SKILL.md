# OCR Setup Skill

## Description

Guide to set up the Python environment for PayProof's OCR backend (PaddleOCR + OpenCV). This skill prepares the local development environment so the FastAPI server can extract text from payment screenshots entirely on-device.

---

## Steps

### 1. Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

Isolates project dependencies from system Python. Always activate the venv before installing or running the backend.

### 2. Install PaddlePaddle (CPU version)

```bash
pip install paddlepaddle
```

The CPU-only wheel is lighter, has no CUDA/cuDNN dependency, and is sufficient for MVP throughput (single-image OCR on demand).

### 3. Install PaddleOCR

```bash
pip install paddleocr
```

Provides the `PaddleOCR` Python class. On first `PaddleOCR(lang='en')` call, it downloads the detection and recognition models automatically.

### 4. Install OpenCV and other dependencies

```bash
pip install opencv-python pillow fastapi uvicorn sqlalchemy python-multipart
```

| Package | Purpose |
|---|---|
| `opencv-python` | Image pre-processing (grayscale, threshold, crop) before OCR |
| `pillow` | Image format handling (PNG, JPG, WebP) |
| `fastapi` | REST API framework |
| `uvicorn` | ASGI server to run FastAPI |
| `sqlalchemy` | ORM for SQLite persistence |
| `python-multipart` | Multipart form parsing for file uploads |

### 5. Verify OCR works

Run this Python snippet to confirm the engine initialises and can process an image:

```python
from paddleocr import PaddleOCR
ocr = PaddleOCR(lang='en')
result = ocr.ocr('test-image.png')
print(result)
```

If this prints detected text blocks, the environment is ready.

---

## Notes

- **First run** downloads the PaddleOCR detection and recognition models automatically (~5 minutes, ~500 MB RAM). Subsequent runs use the cached models.
- **CPU-only** is fine for MVP — no GPU, CUDA, or cuDNN required. A single screenshot is processed in ~1–2 seconds on a modern CPU.
- **Model download failure** — PaddleOCR fetches models from a CDN on first use. If it fails, check your internet connection and retry. The models are cached in `~/.paddleocr/` after the first successful download.
- **Troubleshooting** — If `paddlepaddle` installation fails, check Python version (3.8–3.12 supported) and pip version (`pip install --upgrade pip`).
