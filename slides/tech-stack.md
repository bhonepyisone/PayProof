---
marp: true
paginate: true
transition: fade
auto-advance: 20
backgroundColor: #121317
color: #e8eaed
---

<!-- slide 1 -->
# PayProof — Tech Stack 🔧

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS 4 |
| **Backend** | Python 3.11+ · FastAPI · EasyOCR · OpenCV |
| **Database** | SQLite + SQLAlchemy (on-device) |
| **LLM Parser** | LiteLLM proxy → structured JSON extraction |
| **Tools** | Claude Code · MCP (fetch + filesystem) · Pre-commit hooks |

**Pipeline:** `Screenshot → EasyOCR → raw text → Regex + LLM → structured JSON`

---

<!-- slide 2 -->
# Skills 📦

### payproof — OCR Setup Skill

- **Path:** `.claude/skills/payproof/SKILL.md`
- **What:** Installs Python venv, EasyOCR, OpenCV, FastAPI and all backend deps
- **How to fire:** "set up the OCR environment"

### ui-ux-pro-max — Design Intelligence

- **Path:** `.claude/skills/ui-ux-pro-max/SKILL.md`
- **What:** Generated PayProof's design system — Dark Mode OLED, IBM Plex Sans, fintech palette
- **How to fire:** "improve design" / "apply UI UX"
- **Features:** 67 styles, 96 palettes, 57 fonts, UX domain search

---

<!-- slide 3 -->
# Agents 🤖

### payproof-dev — Developer Persona

- **Path:** `.claude/agents/payproof-dev.md`
- **What:** Scoped dev persona with guardrails

| Guardrail | Detail |
|---|---|
| **Scope** | KBZ Pay MVP only — no Wave, AYA, CB |
| **Confidence** | ≥95% auto · 70–94% review · <70% reject |
| **Commits** | One feature = one commit · Co-Authored-By trailer |
| **Anti-goals** | No camera, no webhooks, no batch, no PWA |
| **Secrets** | Never commit .env — pre-commit hook blocks it |

---

<!-- slide 4 -->
# Methodology 📐

### Spec-Driven Development (SDD)

1. Wrote 6-part `SPEC.md` **before any code**
2. Gist → Story → Why → Anti-Goals → Tech Spec → DoD
3. Every commit maps to a DoD checkbox

### GSD (Get Stuff Done)

1. 10-phase UI/UX improvement sprint
2. One requirement per phase — small, focused, committable
3. Prevented context overload via structured task execution

### Build Loop

```
Discuss → Plan → Execute → Verify → Ship
  (5-15 min per cycle, one commit each)
```

---

<!-- slide 5 -->
# Trigger & Commands ⚡

### Skill — OCR Setup

- **Trigger:** New machine setup or fresh clone
- **Command:** `claude -p .claude/skills/payproof/SKILL.md`

### Skill — UI/UX Design

- **Trigger:** "redesign the app" / "apply UI UX"
- **Command:** `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech dark mode" --design-system -p "PayProof"`

### Agent — PayProof Dev

- **Trigger:** Building any feature
- **Command:** `claude -p .claude/agents/payproof-dev.md`

### Pre-commit Hook

- **Trigger:** Every `git commit`
- **Command:** Auto-runs secret scan + Python syntax check

---

<!-- slide 6 -->
# AI Tools & Links 🚀

### Tools Used

| Tool | What it did |
|---|---|
| **Claude Code** | Primary pair programmer — all features |
| **MCP fetch** | Pulled API docs and external resources |
| **MCP filesystem** | Structured file operations during dev |
| **ui-ux-pro-max** | Design system + UX research |
| **GSD** | 10-phase sprint orchestration |
| **Pre-commit** | Secret detection + syntax linting |

### Links

- 🔗 **GitHub:** `github.com/bhonepyisone/PayProof`
- 📋 **Spec:** `SPEC.md`
- 📊 **Report:** `ch-5/bhonepyisone/report.md`
