---
marp: true
paginate: true
transition: fade
auto-advance: 20
---

<!-- slide 1 -->
# PayProof
## OCR Payment Proof Connector
<!-- 20s -->

**Vibe Code Tour — Ch-6 Polish + Deployment**

Bhonepyisone · June 2026

---

<!-- slide 2 -->
# The Problem 🧾

- Myanmar shop owners receive **KBZ Pay screenshots** daily
- They manually retype **amount**, **ref_no**, **date** into their records
- **Slow** — 30–60 seconds per screenshot
- **Error-prone** — fat-finger typos break reconciliation
- **Repetitive** — same fields, hundreds of times a month

---

<!-- slide 3 -->
# What I Built ⚡

1. **Drag & drop** a payment screenshot
2. OCR extracts **four fields**:
   - 💰 Amount
   - 🔢 Reference No.
   - 👤 Sender
   - 📅 Date
3. **3-tier confidence**:
   - ✅ ≥95% auto-accept
   - ⚠ 70–94% review
   - ❌ <70% reject
4. **Expenses pipeline** — scan → expense form with receipt
5. **Gamification** — streaks, daily goals, receipt Pokédex

---

<!-- slide 4 -->
# Polish + Deploy 🔧

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 19 + TS + Vite + Tailwind 4 | Fast DX, modern web |
| Backend | FastAPI + EasyOCR + OpenCV | Strong API + OCR accuracy |
| LLM | LiteLLM proxy | Structured receipt JSON |
| Analytics | GoatCounter | Lightweight privacy-first |
| Hosting | Vercel frontend + Cloud Run backend | Auto-deploy, scalable |

- Deployed live: `https://payproof-production.up.railway.app/`
- Repo: `github.com/bhonepyisone/PayProof`

---

<!-- slide 5 -->
# How I Worked 🛠️

- 📐 **SDD** — wrote `SPEC.md` + `CLAUDE.md` before building
- 🔌 **MCP + Skills** — `fetch`, `filesystem`, OCR setup skill
- 🤖 **Agent** — scoped dev persona, guardrails, pre-commit checks
- 🪝 **Pre-commit** — secret scan + syntax check
- 📦 **GSD Core loop** — small commits, ship often
- ♿ **a11y pass** — undo toasts, empty states, focus management
- 🎨 **Design system** — dark OLED theme, IBM Plex Sans

---

<!-- slide 6 -->
# Done 🎯

- [x] Repo public: `github.com/bhonepyisone/PayProof`
- [x] Live URL working
- [x] Analytics: GoatCounter
- [x] report.md in team repo
- [x] MCP + skill + agent used
- [x] 20+ build commits

---

**Team 18 · PayProof · Vibe Code Tour Cohort 1**
