---
name: Cyber-Kinetic HUD
colors:
  surface: '#0d1322'
  surface-dim: '#0d1322'
  surface-bright: '#33394a'
  surface-container-lowest: '#080e1d'
  surface-container-low: '#151b2b'
  surface-container: '#191f2f'
  surface-container-high: '#242a3a'
  surface-container-highest: '#2f3445'
  on-surface: '#dde2f8'
  on-surface-variant: '#c3c6d7'
  inverse-surface: '#dde2f8'
  inverse-on-surface: '#2a3040'
  outline: '#8d90a0'
  outline-variant: '#434655'
  surface-tint: '#b4c5ff'
  primary: '#b4c5ff'
  on-primary: '#002a78'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#0053db'
  secondary: '#86ecff'
  on-secondary: '#00363e'
  secondary-container: '#00d4ee'
  on-secondary-container: '#005763'
  tertiary: '#d0bcff'
  on-tertiary: '#3c0091'
  tertiary-container: '#7d4ce7'
  on-tertiary-container: '#f6edff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#9fefff'
  secondary-fixed-dim: '#18daf4'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004e59'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#0d1322'
  on-background: '#dde2f8'
  surface-variant: '#2f3445'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 3.5rem
    fontWeight: '700'
    lineHeight: 4rem
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  telemetry-lg:
    fontFamily: JetBrains Mono
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: 0.02em
  telemetry-md:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.125rem
    letterSpacing: 0.01em
  telemetry-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
    letterSpacing: 0.04em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system embodies a high-performance, real-time spatial computing aesthetic tailored for engineers, spatial designers, and computer vision specialists. The visual language bridges mission-critical telemetry with futuristic cyber-tactility. It avoids ornamental clutter in favor of crisp diagnostic clarity, high visual signal-to-noise ratios, and responsive feedback reminiscent of advanced avionics and heads-up displays (HUDs).

The core stylistic direction fuses dark-mode minimalism with targeted glassmorphism and luminous cyber-accents. Interfaces are structured through deep space canvases, translucent panels, and hairline borders accented by focused cyan and electric blue glows. Every visual element communicates low latency, mathematical precision, and fluid spatial awareness.

## Colors
The palette is built upon deep void-like foundations with high-luminance active states to deliver optical depth and precise telemetry readability:

- **Background Canvas (`#0B1120`)**: Dense, light-absorbing dark charcoal anchoring the interface without complete black clipping.
- **Surface & Cards (`#16233B`)**: Translucent navy surface providing clear separation from the background canvas while sustaining back-glow effects.
- **Primary / Brand (`#2563EB`)**: High-energy electric blue used for authoritative interactive states, primary action anchors, and dominant bounding envelopes.
- **Accent Glow (`#06D6F0`)**: Coherent neon cyan applied to hand skeleton landmarks, live tracking vectors, focal confidence readouts, and active border highlights.
- **Secondary Accent (`#8B5CF6`)**: Deep violet aura reserved for secondary AI inferences, model state transitions, and neural network status overlays.
- **Diagnostic States**: Emerald Green (`#10B981`) indicates optimal tracking confidence and active streaming; Amber (`#F59E0B`) marks occlusion or dropped frame warnings; Crimson (`#EF4444`) handles critical tracking loss or pipeline failure.
- **Text Layers**: High-contrast white (`#FFFFFF`) for primary data and readings; Slate (`#94A3B8`) for contextual subtitles; Deep Muted Slate (`#64748B`) for static structural labels.

## Typography
The system enforces a dual-typeface hierarchy:

1. **Geometric Humanist Body & Headlines (`Plus Jakarta Sans`)**: Delivers warm, balanced legibility across large screen dashboards and configuration panels without the sterility of generic system sans-serifs.
2. **Precision Telemetry (`JetBrains Mono`)**: Strict tabular alignment for dynamic runtime data (FPS counters, latency calculations, Cartesian (x, y, z) coordinates, and confidence coefficients). Digits remain optically stable without layout jitter during variable stream changes.

Caps labels strictly leverage `label-caps` with wide tracking for clear spatial indexing on video feeds and HUD cards.

## Layout & Spacing
The layout architecture utilizes an adaptable 12-column responsive fluid grid structured for dense information architecture alongside real-time video viewports:

- **Desktop (>= 1280px)**: 12 columns with 1.5rem gutters and 2rem outer canvas margins. The workspace defaults to a 60/40 or 70/30 split between primary camera vision pipeline and lateral diagnostic feeds.
- **Tablet (768px - 1279px)**: 8 columns with 1rem gutters and 1.5rem margins. Vision displays stack directly above analytical feeds with persistent floating HUD controls.
- **Mobile (< 768px)**: 4 columns with 1rem gutters and 1rem margins. Full-bleed interactive viewport with slide-over telemetry trays and gesture debug drawers.

Internal components maintain an absolute 4px/8px modular rhythm using `space-xs` through `space-xl` for padding and element spacing, preserving optical alignment across high-frequency visual updates.

## Elevation & Depth
Depth is constructed through layered translucent planes, tinted backdrops, and directed optical glows rather than traditional daylight drop shadows:

- **Layer 0 (Canvas Base)**: Solid `#0B1120`.
- **Layer 1 (Subordinate Surfaces & Panels)**: `#16233B` with 70% opacity, backed by `backdrop-filter: blur(16px)` and an inner 1px border of `rgba(255, 255, 255, 0.06)`.
- **Layer 2 (Interactive Floating HUD & Viewport Overlays)**: `#16233B` with 85% opacity, `backdrop-filter: blur(24px)`, and hairline borders of `rgba(6, 214, 240, 0.2)`.
- **Layer 3 (Active Gestural Focus & Reticles)**: Cyan ambient glows utilizing dual shadows: `0 0 16px rgba(6, 214, 240, 0.35)` and `0 0 32px rgba(37, 99, 235, 0.25)`.
- **Vision Pipeline Viewport**: Unfiltered camera feed flanked by dynamic skeletal meshes rendered directly via SVG/Canvas with glow filters calibrated to model confidence.

## Shapes
A roundedness tier of `2` provides modern ergonomic curvature (0.5rem base, 1rem for cards, and 1.5rem for expansive viewports) while avoiding visual softness. 

- **Vision Containers & Viewports**: Clipped with `rounded-xl` (1.5rem) to frame raw camera input into an engineered display fixture.
- **Telemetry Panels & Data Modules**: Defined by `rounded-lg` (1rem) for balanced content containment.
- **HUD Reticles, Target Trackers, and Pill Badges**: Fully rounded/pill borders (`rounded-full`) to represent dynamic spatial nodes and interactive physical touchpoints.

## Components

### Buttons & Interactive Triggers
- **Primary Actions**: Backgrounds employ the directional gradient `linear-gradient(135deg, #2563EB 0%, #06D6F0 100%)` with high-contrast `#FFFFFF` text, subtle 1px border (`rgba(255,255,255,0.2)`), and an idle glow transition. On hover, increase cyan saturation with `box-shadow: 0 0 20px rgba(6, 214, 240, 0.4)`.
- **Secondary / Utility**: Translucent `#16233B` fill, 1px border in `rgba(148, 163, 184, 0.2)`, transitioning to `border-[#06D6F0]` with muted cyan text upon focus.

### HUD-Style Telemetry Chips
- Rendered in inline flex configurations using `JetBrains Mono` at `telemetry-sm`.
- Contained within `rgba(22, 35, 59, 0.8)` hulls with hairline `0.5px` borders tinted to the respective metric status (Green `#10B981` for sub-10ms latency, Cyan `#06D6F0` for 60+ FPS, Amber `#F59E0B` for degraded confidence).

### Camera Viewport & Landmark Overlays
- Framed in deep glass with a persistent status bar overlay along the upper coordinate boundary.
- Skeletal joints rendered as 4px neon cyan (`#06D6F0`) anchor points with 1.5px electric blue (`#2563EB`) inter-bone vectors. Active pinch/grasp nodes trigger concentric pulse animations using secondary violet accents (`#8B5CF6`).

### Low-Latency Metric Gauges & Confidence Bars
- Linear meters featuring segmented ticks or ultra-smooth CSS-interpolated SVG arcs.
- Progress fills utilize neon cyan-to-emerald linear gradients against an inactive track background of `rgba(255, 255, 255, 0.05)`.

### Form Controls & Input Fields
- Dark input wells (`rgba(11, 17, 32, 0.8)`) with recessed borders (`rgba(148, 163, 184, 0.15)`).
- On focus: 1px continuous cyan glow ring with zero external shadow bleed to maintain surgical clean lines.