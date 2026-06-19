# CLAUDE.md

> Project memory file for Claude Code • PayProof — OCR Payment Proof Connector

---

## Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| **Backend** | Python 3.11+ · FastAPI · PaddleOCR · OpenCV |
| **Database** | SQLite + SQLAlchemy |

---

## Project Structure

```
payproof/
├── SPEC.md                  # SDD 6-part spec (read this first)
├── CLAUDE.md                # This file
├── .mcp.json                # MCP tools configuration
├── .gitignore
├── .env.example
├── .claude/
│   ├── skills/
│   │   └── payproof/
│   │       └── SKILL.md
│   └── agents/
│       └── payproof-dev.md
├── backend/                 # Python FastAPI server
│   ├── app.py               # FastAPI entry point
│   ├── ocr_engine.py        # PaddleOCR wrapper + confidence scoring
│   ├── templates.py         # Regex templates per payment provider
│   ├── models.py            # SQLAlchemy models
│   └── requirements.txt     # Python dependencies
├── frontend/                # React + Vite app
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── DropZone.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   └── ConfidenceBadge.tsx
│   │   └── lib/
│   │       └── api.ts
│   ├── index.html
│   └── package.json
├── slides.md                # Marp 6 slides × 20s auto-advance
├── pechakucha-6x20.md       # PechaKucha template (from team repo)
└── _TEMPLATE.md             # Report template (from team repo)
```

---

## Conventions

### Backend
- Python (FastAPI), async endpoints (`async def`)
- PaddleOCR for all OCR inference — no cloud calls
- Regex extraction templates live in `templates.py`, one per provider
- SQLite via SQLAlchemy for persistence
- Port **8765**

### Frontend
- React functional components with hooks; no class components
- TypeScript throughout — no `any` without good reason
- Tailwind CSS utility classes only — no custom CSS files
- Vite for dev server and builds

### Commits
- Small, frequent commits — one logical step = one commit
- Imperative present-tense messages: `Add KBZ Pay regex template`, `Wire up drop zone to API`
- Each commit should tell part of the build story

### General
- API keys and secrets in `.env` — never committed
- Read `SPEC.md` first before making any change
- Keep the single-provider constraint: KBZ Pay only for MVP

---

## Rules for AI

1. **OCR Engine** — Use PaddleOCR as the primary OCR engine. Do NOT use, suggest, or import third-party OCR services (Google Vision, AWS Textract, Azure OCR, Tesseract Cloud, etc.). Payment data stays on-device.

2. **Secrets** — Store API keys and secrets in `.env`. Never commit `.env` to git. Reference them via `os.getenv()` or python-dotenv.

3. **Port** — Run the backend on port **8765**. Frontend dev server on its default (5173) with proxy to 8765.

4. **Templates** — Keep all payment-provider regex extraction templates in `backend/templates.py`. One template = one provider. No inline regex in `ocr_engine.py` or `app.py`.

5. **MVP scope** — KBZ Pay template only. One well-tested template before generalizing. Do not add Wave Pay, AYA Pay, or CB Pay templates unless explicitly asked.

6. **SPEC first** — Always read `SPEC.md` before making changes. The spec is the source of truth for scope, anti-goals, and definition of done.

7. **Confidence tiers** — ≥95% auto-accept (green), 70–94% manual review (amber), <70% reject (red). These thresholds are in `SPEC.md` — do not change them without updating the spec first.

8. **Commit narrative** — Make small, frequent commits. Each commit message should be a clear, imperative sentence that contributes to the build story. Use `Co-Authored-By: Claude <noreply@anthropic.com>` trailer.
