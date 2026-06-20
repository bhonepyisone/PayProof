<!-- ch-3 personal-project report. -->
# ch-3 Personal Project — Report

github_username: bhonepyisone
personal_repo_url: https://github.com/bhonepyisone/PayProof
project_summary: OCR payment proof connector + expenses tracker for Myanmar payment apps
slides_url: slides.md

## Methodology

Built PayProof iteratively using a spec-driven approach — wrote a 6-part SDD (`SPEC.md`) before any code, then committed in small, logical steps. Each commit tells part of the build story: from OCR engine setup, to regex templates, to the React frontend, to the expenses tracker, to gamification. Used Claude Code with MCP tools (fetch, filesystem), a custom skill for OCR environment setup, and a scoped agent persona. The final round focused on UI/UX polish: undo toasts, empty states, mobile bottom navigation, custom form controls, and accessible popovers.

## Evidence — Claude Code usage

### MCP
- path: .mcp.json
- what: `fetch` for API docs and external resources, `filesystem` for structured file operations during development

### Skill
- path: .claude/skills/payproof/SKILL.md
- what: OCR environment setup instructions — ensures PaddleOCR/EasyOCR dependencies are correctly installed and configured

### Agent
- path: .claude/agents/payproof-dev.md
- what: Scoped development persona with guardrails for KBZ Pay MVP scope, confidence tier rules, and commit conventions
