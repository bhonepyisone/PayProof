---
marp: true
paginate: true
transition: fade
# PechaKucha: 6 slides, 20s auto-advance. Do not change the count.
auto-advance: 20
backgroundColor: #fffbeb
color: #1f2937
---

<!-- slide 1 -->
# PayProof
## OCR Payment Proof Connector
<!-- 20s -->

**Vibe Code Tour — Ch-3 Personal Project**

Bhonepyisone · June 2026

---

<!-- slide 2 -->
# The Problem 🧾

- Myanmar shop owners receive **KBZ Pay screenshots** from customers daily

- Must manually type **amount**, **ref_no**, **date** into their ERP

- **Slow** — 30–60 seconds per screenshot

- **Error-prone** — fat-finger typos break payment reconciliation

- **Repetitive** — same four fields, hundreds of times a month

---

<!-- slide 3 -->
# What PayProof Does ⚡

1. **Drag & drop** a payment screenshot
2. OCR engine extracts **four fields**:
   - 💰 Amount
   - 🔢 Reference No.
   - 👤 Sender
   - 📅 Date
3. **Confidence score** with three tiers:
   - ✅ ≥95% → Auto-accepted
   - ⚠ 70–94% → Manual review
   - ❌ <70% → Rejected

---

<!-- slide 4 -->
# Tech Stack 🔧

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS 4 |
| **Backend** | Python FastAPI · PaddleOCR · OpenCV |
| **Database** | SQLite · SQLAlchemy |
| **Privacy** | 🛡️ All on-device — zero cloud dependency |

- **One API endpoint:** `POST /api/v1/ocr`
- **One template:** KBZ Pay (MVP scope)
- **One database file:** `payproof.db`

---

<!-- slide 5 -->
# Build Process 🏗️

- 📐 **SDD** — wrote 6-part `SPEC.md` before any code
- 🔌 **MCP** — `fetch` + `filesystem` for docs and file ops
- 📦 **Skill** — `SKILL.md` for OCR environment setup
- 🤖 **Agent** — `payproof-dev.md` persona with scope guardrails
- 🪝 **Pre-commit hook** — secret detection + Python syntax check
- 📝 **11+ small commits** — each telling part of the build story

---

<!-- slide 6 -->
# Next Steps & Links 🚀

### Post-MVP roadmap
- 📱 More payment templates: AYA Pay · Wave Pay · CB Pay
- 📸 Camera capture mode
- 🔔 Webhook integration for ERP auto-link
- 📊 Batch processing for high-volume shops

### Links
- 🔗 **GitHub:** `github.com/bhonepyisone/PayProof`
- 📄 **Report:** `ch-3/bhonepyisone/report.md`
- 📋 **DoD:** See `SPEC.md` for the full checklist
