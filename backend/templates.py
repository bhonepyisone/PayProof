"""
PayProof — KBZ Pay Regex Extraction Templates

Each payment provider gets one dictionary entry under TEMPLATES.
A template maps field names to compiled regex patterns.

Usage:
    from templates import match_template
    fields = match_template(text, "kbz_pay")
    # → {"amount": "15000", "ref_no": "2024061912345678", "sender": "Ma Aye Aye", "date": "2024-06-19"}
"""

import re
from typing import Dict, Optional

TEMPLATES: Dict[str, Dict[str, str]] = {
    "kbz_pay": {
        "amount": r"ကျပ်\s*([\d,]+(?:\.\d{1,2})?)",
        "ref_no": r"(?:Transaction|Ref|ငွေလွှဲ)\s*[#:]*\s*([A-Za-z0-9-]+)",
        "sender": r"(?:from|မှ|Sender|မှပို့)\s*[:\s]*(.+)",
        "date": r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
    },
}


def match_template(text: str, template_name: str = "kbz_pay") -> Dict[str, Optional[str]]:
    """
    Run every regex in a named template against the OCR'd text.

    Args:
        text: Raw OCR output (potentially multi-line).
        template_name: Key into TEMPLATES (default "kbz_pay").

    Returns:
        Dict mapping each field to its first regex match, or None if not found.
    """
    patterns = TEMPLATES.get(template_name)
    if patterns is None:
        raise ValueError(f"Unknown template: {template_name}")

    fields: Dict[str, Optional[str]] = {}
    for field, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            # Grab the first capture group; if there isn't one, use the full match
            fields[field] = match.group(1).strip() if match.lastindex else match.group(0).strip()
        else:
            fields[field] = None

    return fields
