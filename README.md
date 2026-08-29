# Attention Weaver

Build a working mobile-first prototype called NOTEWORTHY V1.0.

Read the entirety of this instruction before building. This is not a generic productivity dashboard. The core concept is: ATTENTION HAS SHAPE. The user should understand what matters most in ~3 seconds through position, relative size, depth, color, imagery, and visual prominence.

PRIMARY PRIORITY / BUILD ORDER
1) spatial geometry
2) correct relative facet sizing
3) visual hierarchy
4) exact 100% Weight engine
5) clean front faces
6) 540-degree selection interaction
7) Information face
8) basic Settings/Customize state
9) persistence
10) gradients and restrained polish
Do not decorate a structurally incorrect layout.

CRITICAL DISPLAY CONSTRAINT
Everything must fit on a single 9:16 portrait mobile screen with NO page scroll. The field itself can animate/zoom when entering a facet, but the default field must be fully visible at once.

1. PORTRAIT-FIRST SPATIAL FIELD
Create 5 rows/bands containing 17 total facets:
ROW 1 Upper Utility Bar: one long, thin horizontal facet spanning width above the main field, immediately above Row 2.
ROW 2 Upper Band: five facets. Center is largest in row, two adjacent are medium, two outer are smallest.
ROW 3 Center Band: one large dominant center facet, the largest and unmistakable focal region. Two smaller facets stacked vertically immediately to its left, and two smaller facets stacked vertically immediately to its right. Do NOT interpret this as five equal horizontal cards. Do NOT pile/overlap the side facets. The left/right vertical pairs must be distinct, spatially separated physical facets surrounding the center.
ROW 4 Lower Band: five facets with same hierarchy as Row 2, center largest, adjacent medium, outer smallest.
ROW 5 Lower Utility Bar: one long thin facet beneath Row 4.
The two utility bars are outside the normal 15-facet attention Weight calculation.

2. DEFAULT WEIGHT MODEL
The 15 primary facets share EXACTLY 100.0% relative attention and therefore relative size. Initialize:
- dominant center: 16%
- four facets surrounding center: 9% each
- upper-center and lower-center: 7% each
- four intermediate upper/lower facets: 5% each
- four far peripheral upper/lower facets: 3.5% each
Do not display percentages on normal front faces.

3. WEIGHT MUST CHANGE SIZE
Relative size is semantic. 16% must look dramatically more prominent than 3.5%; 9% clearly outweighs 5%; 5% clearly outweighs 3.5%. Do not make all cards roughly equal. Changing Weight must visibly resize/rebalance the field.

4. EXACT 100% ATTENTION ENGINE
Each active facet has a Weight slider in its deeper edit view.
- Increasing one facet proportionally removes Weight from other eligible unlocked facets simultaneously.
- Decreasing one redistributes released Weight among eligible unlocked facets.
- Locked facets do not participate.
- Preserve exactly 100.0% using precision-safe deterministic math. Decimals to 0.1 are acceptable.
- Never drift to 99.99 or 100.01.
- Soft-stop when no additional Weight can legally be redistributed.
Implement this as a real working engine, not a mock.

5. CONSTRUCTION SCAFFOLDING INVISIBLE
Never show internal position codes such as C, TC, BC, TL, TR, TFL, etc. on normal facet fronts. Never show numerical Weight there. On reverse/edit view, spatial position may be shown using full natural-language names such as Center, Top Center, Upper Left of Center, Lower Right of Center, Bottom Far Left.

6. FRONT FACE
Keep fronts visually clean. Each may contain: large project/title, short tagline, meaningful icon/image/graphic, concise status/description, compact timing indicators. No full task lists or developer metadata. Use generic editable demo content such as Primary Focus, Research, Planning, Creative Work, Administration, Learning, Communication, Documentation, Maintenance, Future Projects, Ideas, Follow-Up, Home, Health, Finance.

7. VISUAL LANGUAGE
Polished, dark, deeply dimensional, highly realistic futuristic interface. Use near-black deep-space background with occasional subtle nebula glimpses between facets; dark translucent holographic surfaces; very thin luminous perimeter treatment; sophisticated neon/electric complementary gradients; realistic shadows/reflections; layered transparency; restrained ethereal glow; legible futuristic typography; convincing 3D parallax/depth.
Colors should be stronger on thin perimeter edges, accents, imagery, highlights than across entire panel interiors. Gradients should be ultra-slow shifting combinations of 2+ complementary colors.
Avoid giant flat color blocks, thick neon borders, generic rainbow styling, equal rectangular cards, excessive glassmorphism, giant blur effects, generic SaaS appearance.

8. GRADIENTS
Each facet supports separate Body Gradient and Perimeter Gradient, each with two independently adjustable endpoints. Changing one system must not overwrite the other. Controls should retain the last applied colors rather than resetting.
Initial field should use a coherent but distinct spectral progression: rich fluorescent/neon/hot/electric/galactic red, orange, yellow, green, turquoise, blue, indigo, violet, plus dark treatments. Do not collapse neighbors into one generic hue.

9. BASIC MOTION
Motion must be restrained and adjustable, capable of communicating urgency/importance/value. Include adjustable ambient float, subtle parallax, edge shimmer, perimeter effects, breathing emphasis on center, smooth Weight resizing, depth changes, tap response. Avoid bouncing, frantic particles, excessive pulsing, rapid flashing, arcade motion.

10. SIGNATURE FACET SELECTION
Tapping a facet must feel like entering the same physical object, NOT opening a generic modal.
1) Smoothly rotate selected facet exactly 540 degrees = 360 + 180, with slow start, fast middle, slow finish, WHILE simultaneously zooming dramatically forward to front-and-center.
2) Very fast perimeter flash/sparkle on selection.
3) Surrounding facets recede slightly and blur while remaining peripherally visible.
4) End of motion displays backside Information face.
5) Pressing Customize flips the SAME facet 180 degrees more into an intangible third physical state.

11. INFORMATION FACE
Support:
- editable title
- editable tagline
- editable overview/description
- editable tasks/subtasks with add/delete/cross-out/edit
- editable notes
- Weight % slider
- Weight lock
- editable full-word spatial position title
- auto-updating last-accessed date/time
- editable due date/time
- 2-3 editable date/time reminders
- completion checkboxes for tasks and entire facet
- Settings button for general interface behavior
- Customize button for selected-facet attributes
- obvious return-to-field X control in upper corner
Numerical Weight may appear beside slider here.

12. CUSTOMIZE STATE
Customize must transition/flip the same facet into a third physical state rather than navigate to unrelated settings. Include controls for image/icon, body gradient endpoints, perimeter gradient endpoints, glow intensity, perimeter effect, motion intensity, plus creative intensity/motion/color/direction parameters for urgency/fun. Keep the Information-to-Customize animation modular; do not permanently hard-code an exact angle beyond current 180-degree concept.

13. REUSABLE EFFECT ARCHITECTURE
Geometry/Weight correctness has priority over effects.
Implement a representative set first, with reusable variable controls.
FIELD EFFECTS, in approximate priority:
- Cybernetic holographic grid scans
- Particle constellation drift with micro-nodes and faint connective vectors
- Sub-surface energy conduits
- Dynamic audio-reactive-style spectrogram background (can use app activity rather than microphone for prototype)
- Bioluminescent nebula drift
- Breathing glow
- Gradient color change
- Pulse
- Flame flicker
- Ember flicker
- Particles/granules
- Lighthouse
- Police lights
- Watergate flashlights in the dark
- UFO landing
- Alien abduction
- 'It's the Future, Bitch'
- Holiday lights show
- Strobe
- Smooth color changing/rotation

PERIMETER EFFECTS, in approximate priority:
- Prismatic edge-bleed pulse
- Corner node laser flash
- Sequential marquee chase
- Glitch edge flicker
- Aura expansion/elevation glow
- Data-stream perimeter / runes of light
- Resonant frequency shockwave
- Dynamic shoulder flare glint
- Anodized energy burn
- Breathing glow
- Chasing light
- Pulse
- Double-gradient chase
- Electrical current
- Flame perimeter
- Particles/granules
- Particulate dispersion
- 'It's the Future, Bitch'
- Holiday lights show
- Futuristic perimeter lasers
- Chasing lasers
- Ion beams
- Tracer gunfight
- Strobe
- Smooth color rotation
Give each implemented effect a clever concise 1-3 word UI name. Include shared perimeter/effect variables.

14. PERSISTENCE
Persist important changes across refreshes using the simplest reliable local mechanism, preferably localStorage for this prototype. Preserve edited titles, taglines, descriptions, tasks, notes, Weight values, Weight locks, gradient selections, basic visual settings, due/reminder info. Do not add unnecessary backend complexity, auth, billing, or database unless absolutely required.

15. ACCESSIBILITY
Include Reduced Motion. In Reduced Motion, preserve selection meaning without repeated 540-degree spinning. Maintain contrast, legibility, tap targets, focus states, accessible labels. Do not flatten the spatial concept.

16. DO NOT BUILD YET
Do not prioritize alternate skins, orbital systems, collaboration, authentication, billing, external integrations, autonomous agents, advanced sharing, cloud architecture, analytics dashboards, social features, or marketing pages.

17. VALIDATION BEFORE STOPPING
Actually test the rendered app before declaring complete. Verify:
- all 17 facets exist
- 15 main facets preserve intended hierarchy
- center visually dominates
- four surrounding facets are distinct/separated
- no pile/overlap accident
- upper/lower bands preserve hierarchy
- no percentages or abbreviated spatial codes on front faces
- default Weight totals exactly 100.0%
- changing Weight redistributes automatically
- locked facets remain fixed
- total never drifts
- size visibly responds to Weight
- selection brings facet toward center
- 540-degree reveal works
- Customize adds another physical flip
- Information face editable
- state survives refresh
- spatial portrait layout remains intact
- default field fits one 9:16 portrait screen with no scroll

MOST IMPORTANT FINAL TEST
Does this make attention feel physical? Can a user glance at the full interface for ~3 seconds and understand what matters most without reading every item? If not, refine hierarchy before adding more effects.

Desired result: a living visual map of attention. Not another productivity dashboard.

IMPORTANT REFERENCE NOTE
The visual reference image is intended as the primary guide for spatial composition/proportions/depth. If no image is attached in this Lovable session, follow the written geometry above exactly and keep the layout code modular so the proportions can be tuned against the reference in the next pass without rewriting the engine.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2f81d401-22f4-4dd4-8954-86bd5ed42364).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
