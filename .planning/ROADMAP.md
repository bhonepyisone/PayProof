# PayProof UI/UX — Roadmap

**Mode:** mvp (vertical slices)
**Granularity:** fine (one requirement per phase)

---

### Phase 1: Design System Generation
**Goal:** Generate comprehensive design system using ui-ux-pro-max
**Requirements:** UI-01
**Success Criteria**:
1. Design system generated with colors, typography, style recommendations
2. Design system persisted to `.planning/design-system/MASTER.md`
3. Anti-patterns documented

---

### Phase 2: Accessibility Audit & Fixes
**Goal:** Fix critical accessibility issues
**Requirements:** UI-02
**Success Criteria**:
1. Color contrast meets 4.5:1 ratio for all text
2. Focus states visible on all interactive elements
3. aria-labels added to icon-only buttons
4. Form inputs have associated labels

---

### Phase 3: Touch Target Sizes
**Goal:** Ensure minimum 44x44px touch targets on mobile
**Requirements:** UI-03
**Success Criteria**:
1. All buttons meet 44x44px minimum
2. All clickable cards meet 44x44px minimum
3. Navigation items meet touch target requirements

---

### Phase 4: Hover & Interaction States
**Goal:** Add cursor-pointer and smooth transitions to interactive elements
**Requirements:** UI-04
**Success Criteria**:
1. All clickable elements have `cursor-pointer`
2. Hover states provide clear visual feedback
3. Transitions use 150-300ms duration

---

### Phase 5: Light/Dark Mode Contrast
**Goal:** Ensure sufficient contrast in both modes
**Requirements:** UI-05
**Success Criteria**:
1. Light mode text has sufficient contrast (4.5:1 minimum)
2. Glass/transparent elements visible in light mode
3. Borders visible in both modes

---

### Phase 6: Spacing & Layout Consistency
**Goal:** Fix floating elements and content padding
**Requirements:** UI-06
**Success Criteria**:
1. Floating navbar has proper spacing from edges
2. No content hidden behind fixed navbars
3. Consistent max-width containers

---

### Phase 7: SVG Icon Replacement
**Goal:** Replace emoji icons with proper SVG icons
**Requirements:** UI-07
**Success Criteria**:
1. No emojis used as UI icons
2. All icons from consistent icon set (Lucide/Heroicons)
3. Consistent icon sizing (24x24 viewBox)

---

### Phase 8: Animation Polish
**Goal:** Add smooth, performant animations
**Requirements:** UI-08
**Success Criteria**:
1. Micro-interactions use 150-300ms duration
2. Animations use transform/opacity (not width/height)
3. prefers-reduced-motion respected

---

### Phase 9: Loading States
**Goal:** Add skeleton screens and loading indicators
**Requirements:** UI-09
**Success Criteria**:
1. Skeleton screens for async content
2. Loading spinners for OCR processing
3. No content jumping during load

---

### Phase 10: Responsive Polish
**Goal:** Perfect responsive behavior at all breakpoints
**Requirements:** UI-10
**Success Criteria**:
1. Works at 375px (small mobile)
2. Works at 768px (tablet)
3. Works at 1024px (desktop)
4. Works at 1440px (large desktop)
5. No horizontal scroll on mobile

---

## Summary

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 1 | Design System | Generate design system | UI-01 |
| 2 | Accessibility | Fix a11y issues | UI-02 |
| 3 | Touch Targets | 44x44px minimum | UI-03 |
| 4 | Interactions | Hover/cursor states | UI-04 |
| 5 | Contrast | Light/dark mode | UI-05 |
| 6 | Layout | Spacing consistency | UI-06 |
| 7 | Icons | SVG replacement | UI-07 |
| 8 | Animations | Smooth transitions | UI-08 |
| 9 | Loading | Skeleton screens | UI-09 |
| 10 | Responsive | All breakpoints | UI-10 |

**Total: 10 phases | 10 requirements | All v1 requirements covered ✓**

---
*Created: 2026-06-26*
