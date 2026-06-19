# SPEC.md — PayProof

> Universal OCR Payment Proof Connector  
> Spec-Driven Development (SDD) • v0.1.0

---

## 1. The Gist

An open-source, on-device OCR tool that reads payment confirmation screenshots (starting with KBZ Pay) and extracts payment details — amount, ref_no, sender, date — so any ERP or POS can link them to orders, with zero cloud dependency.

---

## 2. The Story

Ma Aye Aye runs a small electronics shop in Yangon. Customers pay via KBZ Pay and send her a screenshot of the confirmation screen on Viber or Messenger. Every day she squints at her phone, types the amount, reference number, sender name, and date into her ERP — one by one. When business is busy, she miskeys a 5 for a 6, a reference number gets lost, and she spends Friday afternoon reconciling mismatched payments.

PayProof gives Ma Aye Aye a single-page web app. She drags a screenshot onto the page. In under a second, the app reads the image on her own machine, pulls out the four fields, and shows them with a confidence score. She glances at the result, confirms it's correct, and copies it into her ERP. No typing. No cloud upload. No privacy risk for her customers' payment data. One template today — KBZ Pay — with more templates to follow as the community contributes them.

---

## 3. The "Why"

| Reason | Detail |
|---|---|
| **Reduce manual errors** | OCR eliminates fat-finger typos on amount and ref_no — the fields that break reconciliation |
| **Save time** | Drag-and-drop → instant extraction vs. 30-60 seconds of manual typing per screenshot |
| **Privacy-first** | PaddleOCR runs entirely on-device; payment screenshots never leave the machine |
| **Offline capable** | No internet required — works in shops with spotty connectivity, common across Myanmar |
| **Open-source** | Community can contribute templates for Wave Pay, AYA Pay, CB Pay, and beyond |
| **Myanmar-focused** | Built for local payment apps and local workflows first; not a generic tool adapted after the fact |

---

## 4. The "Why Not" (Anti-Goals) 🛑

These are explicitly deferred or excluded from the MVP. Each may be revisited post-v1.0.

### MVP Scope Boundaries

| Anti-Goal | Rationale |
|---|---|
| **No camera mode** | Upload-only for MVP; live camera capture adds device-compat complexity |
| **No webhooks** | No push notifications to ERPs; users copy/paste or poll the API |
| **No batch processing** | One image per request; bulk upload adds queue management overhead |
| **No PWA** | Plain React SPA served locally; PWA offline caching and install prompts are post-MVP |
| **KBZ Pay template only** | One template done well before generalizing; Wave Pay / AYA Pay come next |
| **SQLite only** | No PostgreSQL, MySQL, or cloud DB; single-file SQLite via SQLAlchemy keeps deployment trivial |

### Architecture Constraints (Non-Negotiable)

| Constraint | Rationale |
|---|---|
| **No third-party OCR services** | Google Vision, AWS Textract, Azure OCR, Tesseract Cloud — all prohibited. PaddleOCR (on-device) only. Payment data stays local. |
| **No cloud dependency** | The app must function fully offline. No license servers, no telemetry, no phoning home. |

---

## 5. Technical Spec

### 5.1 Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| **Backend** | Python 3.11+ · FastAPI · PaddleOCR · OpenCV |
| **Database** | SQLite + SQLAlchemy (single-file, zero-config) |
| **OCR Engine** | PaddleOCR (on-device; no network call for inference) |

### 5.2 API

```
POST /api/v1/ocr
Content-Type: multipart/form-data

  file: <image.png|jpg|webp>

Response 200:
{
  "success": true,
  "data": {
    "amount":       "15000",
    "ref_no":       "2024061912345678",
    "sender":       "Ma Aye Aye",
    "date":         "2024-06-19",
    "confidence":    0.97,
    "raw_text":     "...",
    "template":     "kbz_pay"
  }
}
```

### 5.3 Confidence Tiers

| Tier | Range | Behavior |
|---|---|---|
| **Auto-accept** | ≥ 95% | Green badge; fields shown without warning |
| **Manual review** | 70–94% | Amber badge; user must visually confirm before using |
| **Reject** | < 70% | Red badge; fields shown but flagged as unreliable |

### 5.4 Project Structure (Target)

```
payproof/
├── SPEC.md
├── README.md
├── CLAUDE.md
├── .mcp.json
├── .gitignore
├── .env.example
├── frontend/          # React 19 + Vite + Tailwind 4
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── DropZone.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   └── ConfidenceBadge.tsx
│   │   └── lib/
│   │       └── api.ts
│   └── ...
├── backend/           # FastAPI + PaddleOCR
│   ├── main.py
│   ├── ocr/
│   │   ├── engine.py
│   │   └── templates/
│   │       └── kbz_pay.py
│   ├── models.py
│   └── ...
├── .claude/
│   ├── skills/
│   │   └── payproof/
│   │       └── SKILL.md
│   └── agents/
│       └── payproof-dev.md
├── slides/            # Marp presentation
│   └── pitch.md
└── ch-3/
    └── bhonepyisone/
        └── report.md
```

---

## 6. Definition of Done

The MVP ships when every checkbox is ticked.

### Repository & Tooling
- [ ] Public GitHub repo with README, CLAUDE.md, .mcp.json
- [ ] `.claude/skills/payproof/SKILL.md` exists
- [ ] `.claude/agents/payproof-dev.md` exists
- [ ] Git pre-commit hook (lint + format) configured
- [ ] `.gitignore` covers `node_modules/`, `__pycache__/`, `.env`, `*.db`, `venv/`
- [ ] `.env.example` documents all required environment variables
- [ ] Small, frequent commits telling the build story

### Backend
- [ ] FastAPI server starts and serves `POST /api/v1/ocr`
- [ ] OCR engine (PaddleOCR) extracts `amount`, `ref_no`, `sender`, `date` from KBZ Pay screenshots
- [ ] Confidence scoring with the three-tier classification (auto-accept / manual-review / reject)
- [ ] Results persisted to SQLite via SQLAlchemy

### Frontend
- [ ] React app starts and renders drag-and-drop upload zone
- [ ] Uploaded image is sent to the backend and results are displayed
- [ ] Confidence badge renders green / amber / red per tier

### Presentation & Documentation
- [ ] Marp slides (6 slides, 20s auto-advance) pitching the project
- [ ] `report.md` at `ch-3/bhonepyisone/report.md` (team repository)
