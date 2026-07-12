# SOJ Home Hero Algorithm Sculpture Design

## Goal

Replace only the homepage Hero with a high-fidelity brand experience that feels deliberate at rest and in motion. The visual language combines Apple-like material clarity, Linear-like information restraint, and a single Stripe-like continuous energy form while preserving SOJ's existing graphite, acid green, cool blue, and high-contrast white palette.

The design must make SOJ immediately recognizable, provide direct access to Problems and Contests, and transition naturally into the existing homepage content without changing any other page.

## Scope

### Included

- Replace `features/home/home-hero.tsx` with a client-side animated Hero.
- Add Hero-specific visual and animation units under `features/home/`.
- Add GSAP dependencies required for scoped React animation.
- Update the homepage call site so the Hero no longer receives contest, problem, submission, or scoreboard data.
- Remove the now-unused scoreboard request and row mapping while preserving the contest, problem, and submission requests consumed by sections below the Hero.
- Add focused automated coverage for Hero semantics, reduced motion behavior, and existing homepage smoke expectations.
- Verify desktop and mobile layout plus multiple animation frames in a real browser.

### Excluded

- No changes to navigation.
- No changes to Active Contests, Live Signal Panel, Recommended Problems, Recent Judge Feed, or their data loading.
- No changes to Problems, Contests, Submissions, Authoring, authentication, or backend APIs.
- No countdown, scoreboard, ranking, live judge feed, particle field, cursor trail, long scroll pin, or multi-section narrative.

## Visual Thesis

A single bright algorithmic object emerges from a graphite environment: the letters SOJ remain readable as one sculptural body, while an acid-green execution path passes through its internal structure and selectively opens layered surfaces. Cool blue appears only as a restrained depth edge. Code exists inside the object as material detail rather than floating decoration.

## First-Viewport Composition

- Keep the existing top navigation and `PageShell` width behavior.
- At viewport heights of 800 pixels or more, the desktop Hero uses `max(620px, calc(100dvh - 164px))`. The 164-pixel reserve accounts for the 68-pixel navigation, 32-pixel `PageShell` top padding, the following 40-pixel grid gap, and approximately 24 pixels of the next section. At shorter heights, CTA visibility and a readable sculpture take priority over exposing the next section.
- The algorithm sculpture occupies roughly 55-65 percent of the Hero's visual area and sits centrally with a slight right bias on desktop.
- The stable information area sits in the lower-left calm zone and contains no more than four text groups:
  - small `SIGNAL ONLINE JUDGE` brand label;
  - semantic `h1` containing `SOJ`;
  - one concise supporting sentence;
  - primary Problems and secondary Contests actions.
- The visual is unframed. It must not sit inside a card, dashboard panel, browser frame, or decorative container.
- The Hero bottom edge uses space and a restrained rule/indicator to lead into the existing Active Contests section.

## Color And Material System

Use the existing project tokens as the source of truth:

- graphite background: `--soj-bg` and `--soj-bg-raised`;
- primary body: `--soj-text`, with controlled silver-grey shading;
- execution path and primary action: `--soj-accent`;
- depth edge only: `--soj-info`;
- secondary copy: `--soj-text-muted`;
- structural rules: `--soj-line`.

The sculpture must remain clearly separated from the background in every captured frame. Dark-on-dark metal is prohibited. Green and blue cannot be used as equally dominant competing accents: green communicates execution and blue only clarifies depth.

## Visual Units

### `HomeHero`

Owns semantic content, CTA links, responsive layout, reduced-motion selection, and the animation lifecycle. It exposes no data-driven props because the Hero is a brand entry point rather than a live dashboard.

### `AlgorithmSculpture`

Renders the visual body as layered HTML/SVG primitives with stable aspect-ratio constraints. It owns:

- readable SOJ letter forms;
- a small number of foreground, body, and rear-depth layers;
- internal structural channels and clipped code texture;
- one continuous execution path;
- lighting and edge accents.

The unit must remain visually complete without JavaScript animation. Its DOM is decorative and hidden from assistive technology because the semantic `h1` already names SOJ.

The server-rendered DOM and base CSS always represent the complete final composition. Hydration progressively enhances that state: a layout effect may establish entrance transforms and immediately play the timeline, but no server-rendered element starts hidden or structurally incomplete. If JavaScript is delayed or fails, the final static Hero remains usable. A brief final-to-entrance restart during late hydration is preferable to a blank or permanently partial Hero.

### `useHomeHeroMotion`

Owns the GSAP context and timeline. It receives a scoped root element and animation target references, registers no global selectors, and reverts all animation state on unmount.

Motion targets have explicit property ownership:

- the stage wrapper owns scroll-exit `translateY`, scale, and overall opacity;
- the parallax wrapper owns pointer-driven `rotateX`, `rotateY`, and small x/y translation;
- the assembly wrapper owns entrance-only depth translation and scale;
- individual structural layers own entrance-only local translation and rotation;
- the path owns stroke progress and pulse opacity;
- the highlight owns its own CSS custom property or background position;
- copy groups own entrance opacity and y translation.

Entrance completes before idle motion begins. Starting scroll exit kills or pauses idle pulse and pointer quick-set updates, then animates the stage wrapper while allowing exactly one separately owned path closing pulse to run in parallel. No other inner-layer animation runs during exit. Returning to the Hero may resume idle motion after the exit tween is reversed or completed. Reduced-motion setup creates none of these timelines.

## Motion System

All movement follows one causal idea: the execution path activates and reveals the algorithm structure.

### Entrance, approximately 2.2 seconds

1. The sculpture is already visible in a coherent fallback state; the page never starts blank.
2. Silver structural layers settle from shallow depth, small rotation, opacity, and scale into alignment. Filter blur is not used.
3. The acid-green path travels continuously from S through O to J.
4. Only the areas reached by the path open their cut surfaces and reveal internal code texture plus restrained blue depth light.
5. Copy and actions resolve after the visual hierarchy is established.

The motion uses a single coordinated GSAP timeline. It must not resemble independent fade-ins, random staggered fragments, glitch displacement, or continuous scan lines.

### Idle

- A low-amplitude material highlight moves slowly across the sculpture.
- The execution path emits one restrained pulse approximately every six seconds.
- Fine-pointer devices may drive no more than 6 pixels of parallax and 0.6 degrees of rotation through quick-set transform updates.
- No persistent particle simulation or cursor trail.

### Scroll Exit

- Do not pin the Hero.
- During the first part of downward scrolling, the sculpture scales down slightly and moves upward while its opacity remains readable.
- The next existing homepage section enters normally.
- The execution path completes one closing pulse before leaving the viewport.

### Reduced Motion

For `prefers-reduced-motion: reduce`:

- show the final composed state immediately;
- disable entrance sequencing, idle pulse, pointer parallax, and scroll-linked movement;
- retain all content and CTA functionality.

The root exposes `data-motion-state="static|entering|idle|exiting|reduced"` so behavior can be observed without inferring state from wall-clock delays.

## Responsive Behavior

### Desktop

- Maintain an asymmetric composition with content in the lower-left and the sculpture centered/right.
- Keep the sculpture inside a stable aspect-ratio region so labels, masks, and lighting cannot shift layout.
- Ensure actions remain visible without scrolling at 1440x900 and 1280x800.
- The viewport formula defines `min-height`, not fixed height. Content may increase the rendered height when required to prevent clipping.

### Tablet

- Reduce sculpture depth and internal detail before reducing legibility.
- Keep the copy in a calm lower region rather than overlapping the brightest part of the sculpture.

### Mobile

- Stack the sculpture above the content within the first viewport where practical.
- Center the readable SOJ body and reduce decorative structural layers.
- Disable pointer parallax and simplify the execution path.
- Prevent any letter, CTA label, or supporting text from clipping at 390x844 and 360x800.
- At 390x844 and 360x800, use `max(620px, calc(100svh - 164px))` as the starting height rule. CTA visibility and an unclipped SOJ body take priority; the next-section hint is optional when those requirements consume the available height.

Responsive boundaries are shared across Tailwind layout and `gsap.matchMedia()` behavior: mobile is below 768 pixels, tablet is 768-1023 pixels, and desktop is 1024 pixels and above. Fine-pointer behavior additionally requires `(hover: hover) and (pointer: fine)`. Resize across a boundary must revert the previous GSAP context before creating the next one.

## Accessibility

- Preserve a single visible semantic `h1` named `SOJ` for existing smoke tests and screen readers.
- Render decorative sculpture elements with `aria-hidden="true"`.
- Use real links or link-backed buttons for Problems and Contests.
- Preserve visible focus styles from global tokens.
- Maintain WCAG AA contrast for supporting copy and controls.
- Do not communicate meaning through animation or color alone.

## Performance

- Animate transforms, opacity, SVG stroke progress, and compositor-friendly CSS custom properties. Do not animate `filter: blur()`.
- Avoid layout reads inside animation loops.
- Install and use `gsap` plus `@gsap/react`. Register `useGSAP` and the bundled `ScrollTrigger` plugin only in the client Hero module; no additional animation package is required.
- Use `gsap.matchMedia()` for breakpoint and reduced-motion behavior.
- Apply `will-change` only to actively animated layers and remove it after entrance where possible.
- Keep the number of independently animated layers deliberately small.
- Do not add Three.js, a canvas particle engine, or large bitmap/video assets for this Hero.

## Integration

- `app/page.tsx` continues fetching contests, problems, and submissions because the sections below the Hero still consume them.
- Remove `getContestScoreboard`, its await, `scoreboardRows`, and the related import because no remaining homepage unit consumes them.
- `HomeHero` becomes prop-free; only its call site changes.
- Existing homepage section order and data behavior remain unchanged.
- GSAP is loaded only in the client Hero path.
- Existing page-level error behavior remains unchanged for contest, problem, and submission failures; the Hero does not introduce a separate Suspense or error boundary.

## Verification

### Automated

- Unit/component test confirms the Hero renders one `SOJ` heading and Problems/Contests actions.
- Add a deterministic `matchMedia` stub to the Vitest setup and assert that reduced-motion mode presents the final state with `data-motion-state="reduced"`, no residual entrance transform on a representative layer, and a fully resolved path stroke.
- Existing homepage E2E smoke tests continue to pass.
- Run typecheck, lint, style lint, unit tests, and production build.

### Browser Visual QA

In non-production builds, expose a narrowly scoped `window.__SOJ_HOME_HERO__` controller with `seek(seconds)`, `finish()`, `freeze()`, `resume()`, and `state` so Playwright can capture exact timeline positions without wall-clock timing. `seek()` and `finish()` first freeze the entrance timeline, idle timeline, highlight movement, path pulse, pointer updates, and ScrollTrigger updates; apply the requested entrance position; then resolve only after two `requestAnimationFrame` callbacks so computed styles have committed. `resume()` restores only the motion sources valid for the current state. Cleanup kills every timeline, quick-set callback, listener, and ScrollTrigger instance and deletes the controller. The controller is not created in production builds.

Capture and inspect:

- desktop at 1440x900 and 1280x800;
- mobile at 390x844 and 360x800;
- entrance frames at exact 0 ms, 500 ms, 1200 ms, and final state using the non-production controller;
- reduced-motion final state.
- idle pulse before/after frames, bounded pointer parallax, scroll exit and return, breakpoint resize cleanup, and Hero unmount cleanup.

Browser assertions verify CTA visibility and that the following homepage section top is inside the viewport when the viewport-height rule requires a next-section hint.

The implementation is not ready if any capture shows a blank visual, dark-on-dark sculpture, clipped letters, overlapping copy, hidden CTA, excessive empty area, or an incoherent intermediate animation frame.

## Acceptance Criteria

- Only the homepage Hero changes visually.
- SOJ is readable immediately and remains the dominant first-viewport signal.
- The palette visibly matches the existing SOJ brand.
- The composition has one dominant visual object and one motion logic.
- The Hero remains compelling in a static screenshot.
- Desktop and mobile captures show no layout or contrast failures.
- Reduced motion is complete and functional.
- Existing homepage content and navigation behave unchanged.
