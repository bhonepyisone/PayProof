"""
PayProof OCR Engine — uses EasyOCR for text extraction.
EasyOCR is Apache 2.0 licensed and works on Python 3.12+.
"""

import logging
import re
from pathlib import Path

import cv2
import easyocr

from templates import match_template

logger = logging.getLogger(__name__)

# Lazy-load EasyOCR reader (singleton)
_reader = None


def get_reader():
    global _reader
    if _reader is None:
        logger.info("Loading EasyOCR reader (first run downloads model)...")
        _reader = easyocr.Reader(['en'], gpu=False)
        logger.info("EasyOCR reader loaded.")
    return _reader


def preprocess_image(image_path):
    """Pre-process image for better OCR accuracy using OpenCV."""
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Cannot read image: {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=30)
    return denoised


def extract_text(image_path):
    """Run EasyOCR on an image and return concatenated text."""
    reader = get_reader()
    results = reader.readtext(str(image_path))

    lines = []
    for bbox, text, confidence in results:
        if confidence > 0.3:
            lines.append(text)

    return "\n".join(lines)


def scan_image(image_path, template_name="kbz_pay"):
    """
    Full scan pipeline:
    1. OCR the image
    2. Extract fields via regex template
    3. Calculate confidence score
    """
    raw_text = extract_text(image_path)
    logger.info(f"Raw OCR text: {raw_text[:200]}...")

    fields = match_template(raw_text, template_name)

    expected = ["amount", "ref_no", "sender", "date"]
    found = sum(1 for f in expected if fields.get(f))
    confidence = round((found / len(expected)) * 100) if expected else 0

    return {
        "fields": fields,
        "confidence": confidence,
        "raw_text": raw_text,
    }
