---
name: Retro-Tactile Enterprise
colors:
  surface: '#f6faff'
  surface-dim: '#d3dbe3'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4fd'
  surface-container: '#e7eff7'
  surface-container-high: '#e1e9f1'
  surface-container-highest: '#dce3eb'
  on-surface: '#151d22'
  on-surface-variant: '#414942'
  inverse-surface: '#2a3137'
  inverse-on-surface: '#eaf2fa'
  outline: '#717971'
  outline-variant: '#c0c9bf'
  surface-tint: '#376847'
  primary: '#346645'
  on-primary: '#ffffff'
  primary-container: '#4d7f5c'
  on-primary-container: '#f6fff4'
  inverse-primary: '#9dd3aa'
  secondary: '#994621'
  on-secondary: '#ffffff'
  secondary-container: '#ff9569'
  on-secondary-container: '#762c08'
  tertiary: '#7b5500'
  on-tertiary: '#ffffff'
  tertiary-container: '#9b6c00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b8efc5'
  primary-fixed-dim: '#9dd3aa'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#1d5031'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#ffb598'
  on-secondary-fixed: '#370e00'
  on-secondary-fixed-variant: '#7a2f0b'
  tertiary-fixed: '#ffdeac'
  tertiary-fixed-dim: '#fbbb49'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#604100'
  background: '#f6faff'
  on-background: '#151d22'
  surface-variant: '#dce3eb'
typography:
  display-lg:
    fontFamily: Space Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Space Mono
    fontSize: 18px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1'
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin: 24px
---

## Brand & Style
The design system for this HRMS product bridges the gap between high-utility enterprise software and the comforting nostalgia of 16-bit cozy gaming. The brand personality is dependable yet approachable, transforming cold administrative tasks into a tactile, engaging experience.

The design style is a hybrid of **Brutalism** and **Tactile Retro**. It utilizes heavy, crisp borders and hard pixel-offset shadows to create a sense of physical presence. The interface should feel like a high-fidelity "desk top" where every card and button has weight and "clicky" potential. Layouts are strictly organized, favoring information density and high scannability over excessive white space.

## Colors
The palette is rooted in a "Warm Oatmeal" base, providing a softer, more organic reading experience than pure white. 

- **Primary (Matcha):** Used for main actions, active navigation states, and primary HR markers.
- **Secondary (Terracotta):** Used for highlight actions or secondary interactive elements to provide a warm contrast.
- **Tertiary (Mustard):** Reserved for alerts, pending states, or attention-grabbing instructional tips.
- **Borders & Shadows:** All interactive and container elements must utilize the Deep Licorice (#191B1D) or Dark Pewter for borders to maintain the "pixel art" definition. Hard shadows are never blurred; they are solid color offsets.

## Typography
The typography strategy prioritizes "Digital Craft." 

**Space Mono** is used for headlines to provide a mechanical, retro-tech feel that remains legible at larger sizes. **JetBrains Mono** is the workhorse for all data tables, body copy, and forms; its increased x-height and clear character distinction ensure that complex HR data (employee IDs, salaries, dates) are error-proof for the user.

For status badges and very small labels, use all-caps with increased letter spacing to mimic the appearance of 8-bit bitmap fonts without sacrificing modern accessibility standards.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Navigation is strictly contained in a fixed-width sidebar (240px), while the main content area utilizes a 12-column grid.

Spacing must adhere to a **4px baseline grid** to reinforce the "pixel" aesthetic. Every element's height, padding, and margin should be a multiple of 4. 

- **Gutters:** Standard 16px (4 units) between cards.
- **Margins:** 24px (6 units) global padding for main view containers.
- **Grouping:** Use tight 8px (2 units) spacing for related form inputs and 16px (4 units) for distinct sections within a card.

## Elevation & Depth
In this design system, depth is achieved through **Hard Offsets** rather than light-source blurs. 

- **Level 0 (Background):** Warm Oatmeal (#F4EFEA).
- **Level 1 (Cards/Containers):** Warm Rice Paper (#FAF7F2) with a 2px solid border (#2D3134) and a 3px x 3px solid shadow (#1E2022).
- **Level 2 (Interactive/Hover):** When hovering over a card or button, the shadow expands to 5px x 5px, and the element shifts -2px on both X and Y axes to simulate "lifting."
- **Level 3 (Pressed/Active):** The shadow is removed (0px), and the element shifts +3px down and right to simulate being physically depressed into the page.

## Shapes
The shape language is strictly **Sharp (0px)**. 

To maintain the pixel-art aesthetic, rounded corners are avoided entirely. All containers, buttons, input fields, and checkboxes must have 90-degree angles. This reinforces the "blocky" retro-computing feel and ensures that the solid 1px and 2px borders remain crisp on all displays without sub-pixel anti-aliasing artifacts.

## Components

### Buttons
Buttons are beveled via CSS box-shadows. 
- **Primary:** Matcha Green background, 2px Deep Licorice border. On click, the button "sinks" (remove shadow, translate 2px).
- **Secondary:** Rice Paper background, 2px border. Use for less critical actions.

### Data Tables
Tables are the heart of the HRMS.
- Header cells use Mustard Honey (#E6A938) background with bold JetBrains Mono text.
- Row heights are generous (48px) to accommodate the chunky font.
- Use 1px vertical and horizontal grid lines in Muted Pewter to create a "spreadsheet" feel.

### Cards
All cards must have the 2px Deep Licorice border. 
- Headers within cards should have a solid 1px bottom border to separate the title from the content.
- Cards used for "Leave Balance" or "Employee Profile" should use the Rice Paper background to pop against the Oatmeal page background.

### Input Fields
Inputs are rectangular with a 1px border. 
- On focus, the border thickens to 2px Primary Matcha Green.
- Use the same hard-offset shadow as buttons (2px) to make the inputs feel like physical slots.

### Chips & Badges
Badges (Status: Approved, Pending) are blocky rectangles. 
- Use the semantic colors as background fills with Deep Licorice text.
- Keep text all-caps for a "stamped" look.

### Micro-Icons
Icons must be "Pixel-Perfect." Use a 24px or 32px grid where every "pixel" in the icon is actually a 2x2 or 3x3 screen pixel block to maintain the retro aesthetic. Avoid thin lines or gradients.