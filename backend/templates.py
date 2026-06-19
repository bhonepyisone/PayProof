"""
PayProof — KBZ Pay Regex Extraction Templates

Each payment provider gets one dictionary entry under TEMPLATES.
A template maps field names to compiled regex patterns.

Usage:
    from templates import match_template
    fields = match_template(text, "kbz_pay")
    # → {"amount": "500,000.00", "ref_no": "01004151090915102889",
    #     "sender": "UKYAW KYAW NAING", "date": "14/05/2026"}
"""

import re
from typing import Dict, Optional

TEMPLATES: Dict[str, Dict[str, str]] = {
    "kbz_pay": {
        # KBZ receipts show amounts like "-500,000.00 Ks" or "-500,000.00\nKs"
        "amount": r"(-?[\d,]+(?:\.\d{1,2})?)\s*Ks",

        # KBZ transaction refs are 10-30 digit standalone lines
        # (e.g. "01004151090915102889" on its own line)
        "ref_no": r"^(\d{10,30})$",

        # Sender name: 2-5 all-caps words appearing right before the masked
        # account line "(******3777)" in KBZ receipts
        "sender": r"([A-Z]{3,}(?:\s+[A-Z]{3,}){1,4})\s*\n\s*\(\*",

        # Date in dd/mm/yyyy or dd-mm-yyyy format
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
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL | re.MULTILINE)
        if match:
            # Grab the first capture group; if there isn't one, use the full match
            fields[field] = match.group(1).strip() if match.lastindex else match.group(0).strip()
        else:
            fields[field] = None

    return fields
