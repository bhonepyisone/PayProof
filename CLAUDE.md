# CLAUDE.md

> Project memory file for Claude Code • PayProof — OCR Payment Proof Connector

---

## Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| **Backend** | Python 3.11+ · FastAPI · EasyOCR · OpenCV · OpenAI SDK |
| **LLM Parser** | LiteLLM proxy → structured JSON extraction |

---

## Setup

After cloning the repo, configure git to use the project's pre-commit hooks:

```bash
git config core.hooksPath .githooks
```

This runs `.githooks/pre-commit` on every commit, which checks for:
- Staged `.env` files (blocked — secrets must never be committed)
- Python syntax errors in staged `.py` files (blocked — don't commit broken code)
- Tech stack sync reminder when dependencies change
- Reminder to update `ch-3/bhonepyisone/report.md`

---

## Project Structure

```
payproof/
├── SPEC.md                  # SDD 6-part spec (read this first)
├── CLAUDE.md                # This file
├── .mcp.json                # MCP tools configuration
├── .githooks/
│   └── pre-commit           # Pre-commit hook (secret check + syntax)
├── .gitignore
├── .env.example
├── .claude/
│   ├── skills/
│   │   └── payproof/
│   │       └── SKILL.md
│   └── agents/
│       └── payproof-dev.md
├── backend/                 # Python FastAPI server (deployed to Cloud Run)
│   ├── app.py               # FastAPI entry point (API only, no static serving)
│   ├── Dockerfile           # Backend-only Dockerfile for Cloud Run
│   ├── ocr_engine.py        # EasyOCR wrapper + confidence scoring
│   ├── llm_parser.py        # LLM-based structured extraction via LiteLLM
│   ├── templates.py         # Regex templates per payment provider
│   └── requirements.txt     # Python dependencies
├── frontend/                # React + Vite app (deployed to Vercel)
│   ├── Dockerfile           # Dev Dockerfile for local docker-compose
│   ├── vercel.json          # Vercel deployment config
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── DropZone.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   └── ConfidenceBadge.tsx
│   │   └── lib/
│   │       └── api.ts       # Uses VITE_API_URL for backend endpoint
│   ├── index.html
│   └── package.json
├── docker-compose.yml       # Local dev: backend + frontend
├── cloudrun.yaml            # GCP Cloud Run deployment config
├── Dockerfile               # All-in-one (deprecated — use docker-compose)
├── slides.md                # Marp 6 slides × 20s auto-advance
├── pechakucha-6x20.md       # PechaKucha template (from team repo)
├── scripts/
│   └── sync_tech_stack.py   # Auto-sync tech stack slide from dependencies
└── _TEMPLATE.md             # Report template (from team repo)
```

---

## Conventions

### Backend
- Python (FastAPI), async endpoints (`async def`)
- EasyOCR for all OCR inference — no cloud calls
- Regex extraction templates live in `templates.py`, one per provider
- SQLite via SQLAlchemy for persistence
- Port **8765** (local) / **8080** (Cloud Run)
- Backend is API-only — no static file serving. Frontend is deployed separately to Vercel.

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

### Responsive Design
- Mobile-first responsive design using Tailwind breakpoints (sm:, md:, lg:)
- Touch targets minimum 44×44px on mobile
- Body text minimum 16px on mobile to prevent iOS zoom
- Use responsive prefixes for padding, margins, font sizes, and layout
- Test on 320px width minimum
- The upload drop zone must work on touch devices
- Cards and containers should use `max-w-*` utilities to constrain width on large screens

---

## Rules for AI

1. **OCR Engine** — Use EasyOCR as the primary OCR engine. Do NOT use, suggest, or import third-party OCR services (Google Vision, AWS Textract, Azure OCR, Tesseract Cloud, etc.). Payment data stays on-device.

2. **Secrets** — Store API keys and secrets in `.env`. Never commit `.env` to git. Reference them via `os.getenv()` or python-dotenv.

3. **Port** — Run the backend on port **8765** (local) or **8080** (Cloud Run). Frontend dev server on its default (5173) with proxy to 8765.

4. **Templates** — Keep all payment-provider regex extraction templates in `backend/templates.py`. One template = one provider. No inline regex in `ocr_engine.py` or `app.py`.

5. **MVP scope** — KBZ Pay template only. One well-tested template before generalizing. Do not add Wave Pay, AYA Pay, or CB Pay templates unless explicitly asked.

6. **SPEC first** — Always read `SPEC.md` before making changes. The spec is the source of truth for scope, anti-goals, and definition of done.

7. **Confidence tiers** — ≥95% auto-accept (green), 70–94% manual review (amber), <70% reject (red). These thresholds are in `SPEC.md` — do not change them without updating the spec first.

8. **Commit narrative** — Make small, frequent commits. Each commit message should be a clear, imperative sentence that contributes to the build story. Use `Co-Authored-By: Claude <noreply@anthropic.com>` trailer.
