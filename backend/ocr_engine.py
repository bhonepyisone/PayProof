"""
PayProof — OCR Engine

Wraps PaddleOCR (on-device) with pre-processing, text extraction,
template matching, and confidence scoring.

No cloud service is called at any point.
"""

import logging
from typing import Any, Dict, Optional, Tuple

import cv2
import numpy as np
from paddleocr import PaddleOCR

from templates import match_template

logger = logging.getLogger(__name__)

# ── Singleton PaddleOCR instance ──────────────────────────────────────────
_ocr: Optional[PaddleOCR] = None

# Expected fields for confidence scoring
EXPECTED_FIELDS = ("amount", "ref_no", "sender", "date")


def get_ocr() -> PaddleOCR:
    """
    Lazy-load PaddleOCR singleton.

    The first call downloads the detection and recognition models (~500 MB).
    Subsequent calls return the cached instance immediately.
    """
    global _ocr
    if _ocr is None:
        logger.info("Loading PaddleOCR models (first run downloads ~500 MB)...")
        _ocr = PaddleOCR(lang="en", use_angle_cls=True)
        logger.info("PaddleOCR ready.")
    return _ocr


def preprocess_image(image_path: str) -> np.ndarray:
    """
    Convert image to grayscale, denoise, and apply adaptive thresholding
    to improve OCR accuracy on phone screenshots.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Cannot read image at {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, None, h=10)
    thresh = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2,
    )
    return thresh


def extract_text(image_path: str) -> str:
    """
    Run PaddleOCR on an image and return concatenated text lines.

    Only lines with confidence > 0.3 are kept (filters out noise).
    """
    ocr = get_ocr()
    result = ocr.ocr(image_path)

    lines: list[str] = []
    if result and result[0]:
        for line in result[0]:
            text = line[1][0]       # recognized text
            conf = line[1][1]       # confidence for this line
            if conf > 0.3:
                lines.append(text)

    return "\n".join(lines)


def scan_image(
    image_path: str, template_name: str = "kbz_pay"
) -> Tuple[Dict[str, Optional[str]], float, str]:
    """
    Full OCR pipeline: preprocess → OCR → template match → confidence.

    Returns:
        fields:       Dict of extracted field values (None for missing).
        confidence:   Float 0–100 (% of expected fields found).
        review_status: One of "auto-accepted", "manual-review", "rejected".
    """
    # Run OCR
    text = extract_text(image_path)
    logger.info("OCR output:\n%s", text)

    # Match template
    fields = match_template(text, template_name)

    # Confidence = percentage of expected fields found
    found = sum(1 for f in EXPECTED_FIELDS if fields.get(f) is not None)
    confidence = (found / len(EXPECTED_FIELDS)) * 100.0

    # Review status
    if confidence >= 95:
        review_status = "auto-accepted"
    elif confidence >= 70:
        review_status = "manual-review"
    else:
        review_status = "rejected"

    logger.info(
        "Fields: %s | Confidence: %.1f%% | Status: %s",
        fields, confidence, review_status,
    )

    return fields, confidence, review_status
