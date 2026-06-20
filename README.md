# PayProof

**OCR Payment Proof Connector + Expenses Tracker**

A privacy-first tool that reads payment screenshots from ANY Myanmar payment app (KBZ Pay, Wave Money, AYA Pay, bank screenshots) and extracts payment details automatically. Includes an expenses tracker with receipt attachment support.

---

## Features

- 🔍 **OCR Scanner** — Upload payment screenshots, extract amount, ref no, sender, date
- 🧠 **Multi-Format Parsing** — LLM-powered extraction for any payment app
- 🔗 **OCR → Expenses Pipeline** — one click sends scanned data (amount, description, receipt) into the expense form, pre-filled and ready to save
- 📋 **Expenses Tracker** — Log expenses, attach receipts (upload or camera), sort by date or amount
- 🏷️ **Dynamic Categories** — add, rename, delete categories (defaults: Personal / Business / Other); filter pills + per-category stats
- 🎮 **Gamification** — scan streaks, daily goals, receipt Pokédex (collect payment apps)
- 🎨 **Dark Theme** — Google AI Studio-inspired Material 3 design
- 📱 **Responsive** — Mobile, tablet, desktop
- 🔒 **Privacy-first** — OCR on-device, LLM proxy for structured extraction

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| **Backend** | Python FastAPI + EasyOCR + OpenCV |
| **Database** | SQLite + SQLAlchemy (backend), localStorage (frontend) |

---

## Quick Start

```bash
# 1. Get an API key from Vibe Code Tour proxy
#    Add to .env: LLM_API_KEY=your_key_here

# 2. Backend
cd backend && source .venv/bin/activate && uvicorn app:app --port 8765

# 3. Frontend (another terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173

### Supported Payment Apps

| App | Status |
|-----|--------|
| KBZ Pay | ✅ Regex template + LLM |
| Wave Money | ✅ LLM extraction |
| AYA Pay | ✅ LLM extraction |
| CB Pay | ✅ LLM extraction |
| Bank screenshots | ✅ LLM extraction |
| Shop receipts | ✅ LLM extraction |

---

## Project Structure

```
payproof/
├── SPEC.md                  # SDD 6-part spec
├── CLAUDE.md                # Project memory for Claude Code
├── .mcp.json                # MCP tools config
├── .claude/                 # Skills + Agents
├── backend/                 # FastAPI + EasyOCR + LLM Parser
├── frontend/                # React + Vite app
│   └── src/
│       ├── pages/           # OcrScanner, Expenses
│       ├── components/      # DropZone, ResultCard, etc.
│       └── hooks/           # useGameState (gamification)
├── docs/                    # Screenshots
└── slides.md                # Marp 6×20 presentation
```

---

## Screenshots

| OCR Scanner | Expenses Tracker | Sidebar Navigation |
|:-----------:|:----------------:|:------------------:|
| ![OCR Scanner](docs/screenshot-scanner.png) | ![Expenses](docs/screenshot-expenses.png) | ![Sidebar](docs/screenshot-sidebar.png) |

| Dynamic Categories | OCR → Expenses | Gamification |
|:------------------:|:--------------:|:------------:|
| ![Categories](docs/screenshot-categories.png) | ![OCR to Expenses](docs/screenshot-ocr-expense.png) | ![Gamification](docs/screenshot-gamification.png) |

---

## License

MIT
