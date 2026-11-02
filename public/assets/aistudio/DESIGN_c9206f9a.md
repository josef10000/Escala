---
name: Obsidian Shift
colors:
  surface: '#121318'
  surface-dim: '#121318'
  surface-bright: '#38393f'
  surface-container-lowest: '#0d0e13'
  surface-container-low: '#1a1b21'
  surface-container: '#1e1f25'
  surface-container-high: '#292a2f'
  surface-container-highest: '#34343a'
  on-surface: '#e3e1e9'
  on-surface-variant: '#bacac9'
  inverse-surface: '#e3e1e9'
  inverse-on-surface: '#2f3036'
  outline: '#859493'
  outline-variant: '#3b4949'
  surface-tint: '#26dcdd'
  primary: '#48efef'
  on-primary: '#003737'
  primary-container: '#00d2d3'
  on-primary-container: '#005556'
  inverse-primary: '#006a6a'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#ffd09b'
  on-tertiary: '#472a00'
  tertiary-container: '#ffab32'
  on-tertiary-container: '#6c4300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#56f9f9'
  primary-fixed-dim: '#26dcdd'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f50'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#121318'
  on-background: '#e3e1e9'
  surface-variant: '#34343a'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-md:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  label-mono:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an ultra-premium, focused, dark-mode-first environment tailored for high-stakes operational planning, medical rosters, and shift governance. Drawing inspiration from modern engineering surfaces (Linear, Raycast) and desktop-grade fluidity (macOS Human Interface Guidelines), the visual tone eliminates cognitive fatigue and visual noise.

Rather than relying on saturated teal backgrounds and heavy, glow-dominant interfaces, the aesthetic balances deep slate and graphite foundational surfaces with crisp typography, translucent glass overlays, and surgical pops of functional color.

### Core Philosophy & Brand Persona
- **Quiet Authority:** Interfaces stay out of the way; content, shift schedules, and operational signals stand forward with deliberate hierarchy.
- **Human-Centric Precision:** Complex multi-person shift tables feel breathable, predictable, and scannable without sacrificing data density.
- **Restraint & Craft:** Glassmorphism is used strategically for navigation bars, modals, and hovering action docks. Borders are translucent hairlines (`rgba(255, 255, 255, 0.08)`), replacing muddy, solid dividers.

## Colors

The color palette is engineered for prolonged operational focus, high data density, and clear status recognition at a glance.

### Surface System
- **Canvas Base:** `#090A0F` — deep obsidian canvas with zero chromatic aberration.
- **Surface Elevation 1 (Card/Container):** `#12141A` — graphite container surface.
- **Surface Elevation 2 (Elevated/Hover):** `#1A1D24` — interactive elements and active card states.
- **Surface Subtle Border:** `rgba(255, 255, 255, 0.08)` — hairline micro-borders for cards, tables, and popovers.

### Functional Status Tokens
- **Trabalha / On-Duty Active (Primary):** `#00D2D3` / `#0EA5E9`. Used for active shift slots, live statuses, and focal CTAs. Paired with 12% opacity tints for background badges (`rgba(0, 210, 211, 0.12)`).
- **Home Office & Special Tasks (Secondary):** `#8B5CF6` / `#6366F1`. Muted violet-indigo for remote work, specialized tasks, and leadership indicators.
- **Descanso / Folga (Neutral Rest):** `#27272A` fill with `#A1A1AA` text. Subdued, non-distracting rest cells that allow working shifts to stand out effortlessly.
- **Hoje / Current Day & Pending (Tertiary):** `#F59E0B`. Warm amber accent for calendar highlight rings, current date anchors, and pending approvals.

## Typography

The typography system relies on a unified, high-precision grotesque sans-serif with tabular numeric figures (`tnum`). It prioritizes legibility in compact matrix environments like 12x36 roster grids and dense clinical shifts.

- **Headlines & Section Anchors:** Weights range from `font-semibold` (600) to `font-bold` (700) with slight negative tracking (`-0.02em`) to provide an authoritative, crafted silhouette.
- **Data & Tables:** Set at `body-md` (13px) and `body-sm` (12px) using neutral light tones (`#EDEDED` for primary content, `#A1A1AA` for descriptions).
- **Micro-labels & Shift Badges:** Compact uppercase tracking (`+0.04em`) at 11px ensures unambiguous distinction between "T" (Trabalha), "D" (Descanso), and "HO" (Home Office).

## Layout & Spacing

Layout adheres to an 8pt system refined with 4pt subdivisions for tight grid tables.

### Grid & Canvas Structure
- **Desktop (>= 1280px):** 12-column dynamic fluid grid with a sticky sidebar/topbar. Roster tables utilize fixed frozen columns for collaborator identification (`240px`) and fluid horizontal scrolling for days 1–31.
- **Tablet (768px – 1279px):** Content compresses down to 8 columns with 16px margins; monthly views switch to switchable weekly or collapsed agenda formats.
- **Mobile (< 768px):** Single-column stack with dynamic agenda views, bottom sheets for shift modifications, and swipeable day rails.

### Spacing Density Principles
- Operational tables leverage `space-xs` (4px) to `space-sm` (8px) internal cell gaps to preserve maximum visible viewport horizon.
- Control toolbars, filters, and user summaries use `space-lg` (20px) outer padding to establish rhythm and prevent visual clutter.

## Elevation & Depth

Visual hierarchy uses subtle luminous borders and dark tonal planes rather than harsh dropshadows.

### Layer Stacking Model
- **Level 0 (Canvas):** Pure `#090A0F` base.
- **Level 1 (Panels & Tables):** `#12141A` with a micro-border `1px solid rgba(255, 255, 255, 0.08)`.
- **Level 2 (Cards & Active Hover):** `#1A1D24` surface with a diffuse ambient shadow: `0 4px 20px -2px rgba(0, 0, 0, 0.6)`.
- **Level 3 (Modals, Popovers & Floating Bars):** Translucent `#12141A/85` backed by `backdrop-filter: blur(16px)`, crowned with an inner highlight stroke `inset 0 1px 0 rgba(255, 255, 255, 0.12)`.

### State Feedback
- **Active Current Day Column:** Highlighted with a luminous ambient top-border and warm amber hairline indicator (`#F59E0B`).

## Shapes

The geometry reflects native macOS and iOS standards: soft, continuous organic squircle radii that convey precision without appearing bubbly.

- **Micro Elements & Pills:** 6px – 8px (`rounded-md`) for shift chips ("T", "D", "HO") and table filter switches.
- **Inputs & Standard Buttons:** 8px – 10px (`rounded-lg`) balancing ergonomics and compact utility.
- **Cards, Calendars & Modals:** 12px – 16px (`rounded-xl`) with smooth corner curvature.

## Components

### Buttons & Interactive Controls
- **Primary Action (e.g., 'Compartilhar Escala'):** Background in `#00D2D3`, text in `#090A0F` (pure dark contrast), `font-semibold`. Hover: subtle brightness boost (`#1AE6E7`) and soft cyan glow `0 0 24px -4px rgba(0, 210, 211, 0.35)`.
- **Secondary / Ghost:** Translucent fill `rgba(255, 255, 255, 0.05)`, border `1px solid rgba(255, 255, 255, 0.1)`, text `#F4F4F5`. Hover: `rgba(255, 255, 255, 0.1)`.

### Shift Chips & Status Badges
- **Trabalha (T):** Background `rgba(0, 210, 211, 0.15)`, text `#00D2D3`, hairline border `1px solid rgba(0, 210, 211, 0.3)`. Compact square or soft pill shape.
- **Descanso (D):** Background `rgba(255, 255, 255, 0.04)`, text `#71717A`, border `1px solid rgba(255, 255, 255, 0.05)`. Blends back so working days pop out immediately.
- **Home Office (HO):** Background `rgba(139, 92, 246, 0.15)`, text `#A78BFA`, border `1px solid rgba(139, 92, 246, 0.3)`.

### Calendar Matrix & Grid Tables
- **Grid Dividers:** Hairline borders `border-white/5`.
- **Fixed Header Columns:** Sticky positioning with `backdrop-blur-md` and `#12141A/90` background to retain orientation during deep horizontal scrolls.
- **Hover Row Interaction:** Row background subtly shifts to `#1A1D24/60` across all 31 days with instant transition.

### Input Fields & Search Bars
- Background `#12141A`, border `1px solid rgba(255, 255, 255, 0.1)`, placeholder `#52525B`. Focus state transitions the border to `#00D2D3` with an outer ring `ring-2 ring-cyan-500/20`.