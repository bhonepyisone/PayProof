"""
PayProof LLM Parser — multi-format receipt extraction via LiteLLM proxy.

Takes raw OCR text from ANY payment app (KBZ Pay, Wave Money, AYA Pay,
bank screenshots, shop receipts) and returns structured JSON.
"""

import json
import logging
import os
from typing import Optional

from openai import AsyncOpenAI
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ParsedReceipt(BaseModel):
    """Structured receipt data extracted by the LLM."""

    amount: Optional[float] = None
    ref_no: Optional[str] = None
    sender: Optional[str] = None
    date: Optional[str] = None
    app_name: Optional[str] = None
    confidence: float = 0.0


SYSTEM_PROMPT = """You are a payment receipt parser for Myanmar payment apps.
Given raw OCR text from a payment screenshot, extract:

- amount: the payment amount as a number (float)
- ref_no: the reference/transaction number
- sender: who sent the money
- date: the transaction date (in DD/MM/YYYY or YYYY-MM-DD format)
- app_name: which payment app (KBZ Pay, Wave Money, AYA Pay, CB Pay, etc.)

Rules:
1. Return ONLY valid JSON with those 5 fields plus "confidence"
2. If a field is missing from the text, set it to null
3. Set confidence to 1.0 if all 5 fields found, 0.7 if 3-4 found, 0.3 if fewer
4. Amount must be a float (no currency symbols)
5. The OCR text may have typos — do your best to infer the correct values"""


async def parse_with_proxy(raw_text: str) -> ParsedReceipt:
    """
    Send raw OCR text to the LiteLLM proxy for structured extraction.

    Returns a ParsedReceipt with extracted fields and confidence score.
    On any failure (timeout, auth, parse error), returns a zero-confidence
    ParsedReceipt so the caller can fall back to regex templates.
    """
    api_key = os.getenv("LLM_API_KEY")
    if not api_key:
        logger.warning("LLM_API_KEY not set — skipping LLM parser")
        return ParsedReceipt(confidence=0.0)

    base_url = os.getenv("LLM_BASE_URL", "https://proxy.vibecode.tours")
    model = os.getenv("LLM_MODEL", "claude-sonnet-4")

    client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Extract receipt data from this OCR text:\n\n{raw_text}",
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
            max_tokens=300,
        )
        content = response.choices[0].message.content
        data = json.loads(content)
        parsed = ParsedReceipt(**data)
        logger.info(
            "LLM parsed: app=%s, amount=%s, confidence=%.1f",
            parsed.app_name,
            parsed.amount,
            parsed.confidence,
        )
        return parsed

    except Exception as e:
        logger.error("LLM parser error: %s", e)
        return ParsedReceipt(confidence=0.0)
