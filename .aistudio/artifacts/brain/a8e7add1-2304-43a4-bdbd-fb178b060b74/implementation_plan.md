# Full Four-Border Festival Frame & Garland Graphics

Expand the festival décor system so that all four borders of the page (top, bottom, left, and right) feature matching animated festive light strings, garlands, and corner ornaments that scroll naturally with the page content.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following requirements have been confirmed based on user feedback:
> - **All Four Screen Edges**: The festival graphics will frame the entire page across all four borders:
>   - **Top Border**: Full-width festival light garland / header border.
>   - **Left Border**: Vertical matching fairy light string and garland down the left edge.
>   - **Right Border**: Vertical matching fairy light string and garland down the right edge.
>   - **Bottom Border**: Full-width festival light string and garland along the page bottom.
>   - **4 Corner Accents**: Ornate decorative corner junctions (flickering clay diyas for Diwali, holly wreaths for Christmas, crescents for Eid).
> - **Matching Visual Themes**:
>   - **Diwali**: Continuous golden fairy lights with pulsing amber and saffron bulbs, plus corner earthen diyas with animated flickering flames.
>   - **Christmas**: Evergreen pine needle garland with blinking multi-color holiday bulbs (ruby, emerald, warm gold, sky blue) and corner holly wreaths.
>   - **Eid**: Emerald and golden arabesque lace with illuminated star accents and corner crescent moons.
>   - **Holi**: Multi-color rainbow gradient ribbons and festive color bursts on all four sides.
>   - **New Year**: Royal blue and champagne gold glittering starry ribbon borders on all four sides.
>   - **Independence Day**: Continuous saffron, white, and green tricolor border framing the page.
> - **Natural Page Scrolling**: The border frame is mounted to the page container (`absolute inset-0 pointer-events-none`), framing the entire scrollable document and moving naturally with page scroll without obstructing buttons, inputs, or calendar slots.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the clinic application into an immersive, beautifully framed holiday experience where festive lighting garlands surround the entire workspace on all four sides, seamlessly paired with the existing logo Santa cap / flickering diya ornaments.
- **Target Audience**: All patients, doctors, and staff visiting or managing the clinic during festive seasons.
- **Key Value**: Delivers a rich celebration atmosphere while maintaining 100% zero-obstruction access to clinical workflows, appointments, patient reviews, and vouchers.

---

## 2. User Experience & Visual Design

### The 4-Border Festival Frame Architecture
1. **Top Border**:
   - Integrated with the header navigation bar and top garland banner, featuring animated fairy lights and garland.
2. **Left & Right Vertical Borders**:
   - Slender ($12\text{px}$–$16\text{px}$) decorative vertical borders running along the left and right margins of the page.
   - Repeating vertical fairy lights with alternating bulb glow phases and subtle garland ivy/pine textures.
3. **Bottom Border**:
   - Matching horizontal border running across the bottom of the page, sitting naturally below the footer and content.
4. **Four Corner Ornaments**:
   - **Diwali**: Glowing brass diyas with animated flickering flames at the junctions.
   - **Christmas**: Festive holly leaf clusters with red berries and snowflakes.
   - **Eid**: Golden crescent moons with 8-pointed star sparkles.
   - **Holi**: Vibrant color splashes.
   - **New Year**: Starburst sparkles.
5. **Pointer-Events Protection**:
   - Marked with `pointer-events-none` so clicking, selecting text, or tapping buttons near the screen edges is never intercepted or delayed.

---

## 3. Key Technical Decisions & Trade-Offs

- **Decision 1: Frame Placement in Root Layout (`App.tsx`) vs. Individual Views**:
  - *Chosen Approach*: Mount `FestivalPageFrame` inside the root `<div className="min-h-screen relative ...">` in `App.tsx`.
  - *Why*: Ensures consistent border framing across all views (Portfolio, Appointments, Patient Reviews, Billing, Settings) with zero code duplication.
- **Decision 2: Natural Page Scrolling vs. Fixed Screen Frame**:
  - *Chosen Approach*: As confirmed by user choice, use `absolute inset-0 pointer-events-none` on the scrollable container so the border frame moves naturally with the page content.
  - *Why*: Prevents covering floating action buttons (such as the AI Chatbot or mobile menus) on small viewports and provides an authentic framed page feel.
- **Decision 3: Responsive Thickness & Screen Adaptation**:
  - *Chosen Approach*: Adaptive sizing ($12\text{px}$ on desktop, $6\text{px}$ on mobile) so small mobile screens maintain maximum readable space while retaining full decorative beauty.

---

## 4. Technical Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App.tsx Main Container                          │
│                                                                        │
│   ╔════════════════════════════════════════════════════════════════╗   │
│   ║  [Top Festival Border / Garland]                              ║   │
│   ║                                                               ║   │
│   ║ [L]                                                       [R] ║   │
│   ║ [e]    Header Bar (Logo + Santa Cap / Diya)               [i] ║   │
│   ║ [f]    Main Page Content (Services, Facilities, Reviews)   [g] ║   │
│   ║ [t]    Appointments, Vouchers, Financial Dashboard        [h] ║   │
│   ║ [ ]                                                       [t] ║   │
│   ║ [B]                                                       [B] ║   │
│   ║ [o]                                                       [o] ║   │
│   ║ [r]                                                       [r] ║   │
│   ║ [d]                                                       [d] ║   │
│   ║ [e]                                                       [e] ║   │
│   ║ [r]                                                       [r] ║   │
│   ║                                                               ║   │
│   ║  [Bottom Festival Border / Diya String / Garland]             ║   │
│   ╚════════════════════════════════════════════════════════════════╝   │
└────────────────────────────────────────────────────────────────────────┘
```

### Components to Update
1. **`src/components/FestivalHeaderDecor.tsx`**:
   - Add `FestivalPageFrame`: Renders the top, bottom, left, and right borders with the active festival theme, plus decorative corner accents.
2. **`src/App.tsx`**:
   - Mount `<FestivalPageFrame />` inside the root layout wrapper so it surrounds all pages.
3. **`src/components/FestivalDecorModal.tsx`**:
   - Reflect the full 4-border frame in the preview and options.

---

## 5. Implementation Steps

1. Add `FestivalPageFrame` and vertical/bottom SVG light strings and garlands in `src/components/FestivalHeaderDecor.tsx`.
2. Mount `FestivalPageFrame` in `src/App.tsx`.
3. Update `src/components/FestivalDecorModal.tsx` preview card.
4. Co-execute `compile_applet` and `lint_applet` to verify zero errors and clean build.
