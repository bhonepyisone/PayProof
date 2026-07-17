# PayProof — UI/UX Improvement Sprint

## What This Is

PayProof is an on-device OCR tool that reads KBZ Pay payment screenshots and extracts payment details (amount, ref_no, sender, date). The frontend is a React + TypeScript + Tailwind CSS SPA with gamification features (streaks, achievements, receipt collection). This sprint focuses on improving the UI/UX quality using the ui-ux-pro-max design intelligence system.

## Core Value

**Fast, accurate OCR extraction with a delightful mobile-first UI.** The app must feel snappy and professional on mobile devices where users actually scan receipts.

## Business Context

- **Customer**: Small shop owners in Myanmar who receive KBZ Pay payments
- **Success metric**: Time from screenshot drop to confirmed extraction < 10 seconds
- **Strategy notes**: Mobile-first, offline-capable, privacy-first

## Requirements

### Validated

- ✓ OCR extraction with confidence scoring — existing
- ✓ KBZ Pay template matching — existing
- ✓ Sidebar navigation (desktop) — existing
- ✓ Bottom tab navigation (mobile) — existing
- ✓ Gamification: streaks, daily goals, receipt pokedex — existing
- ✓ Expenses tracking page — existing
- ✓ Achievements page — existing

### Active

- [ ] **UI-01**: Generate design system using ui-ux-pro-max (colors, typography, style)
- [ ] **UI-02**: Audit and fix accessibility issues (contrast, focus states, aria labels)
- [ ] **UI-03**: Fix touch target sizes (minimum 44x44px on mobile)
- [ ] **UI-04**: Improve hover/interaction states (cursor-pointer, transitions)
- [ ] **UI-05**: Fix light/dark mode contrast issues
- [ ] **UI-06**: Consistent spacing and layout (floating navbar, content padding)
- [ ] **UI-07**: Replace emoji icons with SVG icons (Heroicons/Lucide)
- [ ] **UI-08**: Smooth animations (150-300ms duration, transform-based)
- [ ] **UI-09**: Loading states and skeleton screens
- [ ] **UI-10**: Responsive polish (375px, 768px, 1024px, 1440px)

### Out of Scope

- Camera mode — deferred to post-MVP
- PWA/offline caching — deferred to post-MVP
- New payment providers (Wave Pay, AYA Pay) — KBZ Pay only for now
- Backend changes — this is frontend-only sprint

## Context

- **Tech stack**: React 19, TypeScript, Vite, Tailwind CSS 4
- **Current state**: Working app with 3 pages (OcrScanner, Expenses, Achievements)
- **Components**: Sidebar, BottomNav, DailyGoal, ReceiptPokedex, StreakBadge
- **Design tool**: ui-ux-pro-max skill for design intelligence
- **Known issues**: Potential contrast problems, emoji usage, missing cursor-pointer on cards

## Constraints

- **Frontend only**: No backend changes in this sprint
- **Tailwind CSS**: All styling via utility classes, no custom CSS
- **Mobile-first**: Primary users are on mobile devices
- **Existing structure**: Preserve current component architecture

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use ui-ux-pro-max for design system | Consistent, research-backed design choices | — Pending |
| Fine granularity (8-12 phases) | Small, safe changes that don't break existing functionality | — Pending |
| Skip research phase | ui-ux-pro-max provides design intelligence | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Update Context with current state

---
*Last updated: 2026-06-26 after initialization*
