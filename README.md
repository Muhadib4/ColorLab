# ColorLab + Gradient Forge

A browser-based color studio for building palettes, exploring color relationships, and creating production-ready CSS gradients. Everything runs locally in the browser after the application loads: no accounts, API keys, database, or application backend.

## Features

### ColorLab

- Generate palettes with 14 modes: Random, Monochromatic, Analogous, Complementary, Split Complementary, Triadic, Tetradic, Warm, Cool, Pastel, Vibrant, Muted, Dark, and Light.
- Work with 3–8 colors. Lock favorites while regenerating, edit HEX values, reorder, duplicate, or remove colors.
- Copy HEX, RGB, and HSL values; inspect HSV, relative luminance, and approximate color names.
- Explore 11-step shades, tints, and tones.
- Check foreground/background contrast against WCAG AA and AAA thresholds for normal text.
- Send a whole palette or selected colors to Gradient Forge.

### Gradient Forge

- Create linear, radial, and conic gradients with a live preview.
- Edit 2–8 color stops using pointer dragging, touch, percentage inputs, or keyboard controls.
- Adjust angles, directional presets, radial shape, and center position.
- Generate gradients in seven modes and explore 24 curated presets across 17 collections.
- Copy CSS declarations, Tailwind arbitrary background classes, or inline style values.
- Extract gradient colors into a palette.

### Your workspace

- Save, rename, duplicate, load, and delete creations; undo a saved-item deletion from its notification.
- Restore the current palette, gradient, preferences, saved collection, and the latest 30 generated creations from browser storage.
- Undo and redo up to 40 workspace changes during the current session.
- Export palettes as CSS variables, JSON, a Tailwind color configuration, a HEX list, or an SVG swatch image. Export gradients as CSS, JSON, a Tailwind class, or a style value.
- Share a design through a URL containing its validated color and gradient state.
- Use the command menu, dark/light/system themes, and adjustable motion preferences.
- Work in a desktop sidebar layout, adaptive tablet editor, or mobile interface with bottom navigation and modal color details.

## Tech stack

- Next.js App Router with static export
- React and strict TypeScript
- Tailwind CSS 4 and custom component styles
- Lucide React icons
- Native Web Audio API, Clipboard API, and localStorage
- Node.js test runner through `tsx`; ESLint

Typography uses DM Sans, Manrope, and JetBrains Mono through `next/font`. Fonts are downloaded during development/build and served with the application; the deployed editor makes no third-party API requests.

## Installation

Use Node.js **20.9 or newer** and npm.

```sh
npm install
```

No environment variables or external service configuration are required.

## Development

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000). The studio is ready to use with an initial palette and gradient.

## Build and verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The production build writes a self-contained static site to `out/`. Serve that directory with a static HTTP server to preview the production application. `next start` is for server-rendered Next.js deployments and does not serve this static-export configuration.

Automated tests cover color-space conversions, WCAG contrast calculations, palette locks and bounds, gradient modes and presets, CSS output, URL round-trips, malformed shared state, and browser-storage validation/failure handling.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Space` | Generate a palette |
| `G` | Forge a gradient |
| `L` | Lock/unlock the selected color, or the first color when none is selected |
| `C` | Copy the selected color in the preferred format |
| `Ctrl/Cmd + S` | Save the current creation |
| `Ctrl/Cmd + K` | Open the command menu |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Escape` | Close a dialog or color inspector |
| `?` | Open shortcut help and access recent history |

Global shortcuts are suppressed while typing in an input or editing in a dialog. Space retains native activation behavior on focused buttons. In the command menu, use the arrow keys and Enter. Focus a gradient stop and use the arrow keys to move it by 1%, Shift + arrow for 10%, or Home/End to reach either edge.

## Sound and motion

Short interface tones are synthesized with sine oscillators and brief gain envelopes. Sound effects have an on/off switch, a volume slider, and a shared mute control.

Ambient audio is an optional, quiet procedural synth chord made with four slightly detuned oscillators. It starts **off** and requires pressing Play after each page load, even if the previous preference is remembered. No audio assets, streaming services, or copyrighted tracks are used. Preferences and volume levels persist locally; unavailable browser audio does not block the editor.

Full and reduced motion settings are available. The operating system's reduced-motion preference is also respected, and cursor illumination is limited to mouse input.

## Project structure

```text
src/
  app/                    App entry, metadata, typography, global styles
  components/
    studio.tsx            Application shell, navigation, shortcuts, persistence
    colorlab.tsx          Palette editor, color inspector, contrast checker
    gradient-forge.tsx    Gradient editor, stop controls, preset library
    collection.tsx        Saved creations and recent history
    export-dialog.tsx     Export, download, and sharing tools
    command-menu.tsx      Searchable keyboard command menu
    settings.tsx          Theme, audio, motion, and format preferences
    dialog.tsx            Reusable accessible modal
  hooks/
    use-workspace.ts      Workspace state and undo/redo
  lib/
    color.ts              Color conversion, contrast, scales, palette generation
    gradient.ts           Gradient construction and CSS generation
    presets.ts            Local palette and gradient collections
    serialization.ts      State validation, share links, and export formats
    storage.ts            Browser persistence and recovery
    audio.ts              Procedural Web Audio effects and ambience
  types/                  Shared TypeScript types
tests/                    Core logic and storage tests
```

## Deployment

1. Run `npm install` and `npm run build`.
2. Publish the contents of `out/` to a static hosting provider.
3. Configure the host to serve `index.html` at the site root and preserve URL query parameters used for sharing.

For platforms with build settings, use **`npm run build`** as the build command and **`out`** as the output directory. Deploy at a domain root with the supplied configuration. A subdirectory deployment requires configuring Next.js `basePath` before building.

Use HTTPS for normal browser clipboard support. If automatic clipboard access fails, the application provides selectable text for manual copying.

## Data and practical limits

Saved work belongs to the current browser and site origin. It does not synchronize between devices, and clearing site data removes it. Export important creations or keep their share links. The editor remains usable if storage is blocked or full and displays a storage status message.

Share links contain the design itself, so anyone with the link can open those colors and gradient settings. They do not include the saved collection or preferences. Color names are approximate, and the contrast checker reports normal-text thresholds rather than performing a complete accessibility audit of a page.

The application needs its static files to load; an offline service worker is not included. Once loaded, color generation, editing, exports, and audio run without network services.
