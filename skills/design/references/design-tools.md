# Design step: prototype tools, UI styles, rendering and comparison

Reference list for the design step. The step asks the user which prototype tool and which UI style to use. Each confirmed screen is saved as a PNG on the main branch, and prototype sources stay on a scratch branch that is never merged.

Research date: 2026-11-17.

Markers:
- **V**: checked against official docs or the vendor's own page during this research.
- **S**: from secondary sources (blogs, MCP directories, aggregators) only.
- **K**: from prior knowledge, not re-checked this time. Verify before you rely on it.

Column key for the tool tables:
- **Agent edits**: how an agent creates and edits the design. *Files* means it writes text files. *API* or *MCP* means it calls a remote service.
- **Auto PNG**: whether the design can be rendered to an image without a person doing it.
- **Git**: whether the source can be versioned in git as readable text.
- **Offline**: whether it works with no network and no account.

## 1. Prototype approaches

### 1.1 Code-based (files in the repository)

| Approach | Agent edits | Auto PNG | Git | Client types | License / cost | Offline | Notes | Sources |
|---|---|---|---|---|---|---|---|---|
| Hand-written HTML/CSS (optionally Tailwind or a component library from a CDN or npm), one file per screen | Files | Yes: Playwright `page.screenshot()` at fixed viewports (V) | Yes | Web; mobile web; desktop apps built on web tech (Electron, Tauri); a rough stand-in for native apps | Free; Playwright Apache-2.0 (K) | Yes, once the library is vendored locally | Lowest friction and fully deterministic. Using the same component library the product will use keeps the prototype close to the build. | https://playwright.dev/docs/screenshots |
| Framework dev server (React, Vue or Angular) with mock data, clickable | Files | Yes: Playwright against `localhost` | Yes | Web; projects whose stack is already chosen in /architect | Free | Yes | Real components and real routing, but scaffolding is heavier, and the code can drift into production code. Keep it on the scratch branch. | https://playwright.dev/docs/test-webserver |
| Storybook stories (one story per screen state) | Files (CSF3) | Yes: test runner or Playwright on the story iframe; Chromatic is the paid cloud option | Yes | Web component libraries; design systems | Storybook MIT (K) | Yes | The official `@storybook/addon-mcp` (Storybook 10.3, March 2026) gives agents tools to preview stories, run story tests and write CSF3 (V). Secondary sources say it supports React only for now (S). | https://storybook.js.org/docs/ai/mcp/overview |
| shadcn/ui registry, used inside HTML or React prototypes | Files, plus the official shadcn MCP | Yes, through the page it is used in | Yes | Web (React) | MIT (K) | Yes, after install | Official MCP: `npx shadcn@latest mcp`. It browses, searches and installs registry items (V). | https://ui.shadcn.com/docs/mcp |

### 1.2 Mobile, desktop and terminal

| Approach | Agent edits | Auto PNG | Git | Client types | License / cost | Offline | Sources |
|---|---|---|---|---|---|---|---|
| HTML at phone viewports (Playwright `devices`: iPhone or Pixel sizes, DPR, touch) in a CSS device frame | Files | Yes | Yes | Mobile, low-fidelity | Free; CSS frame libraries such as devices.css are MIT (K) | Yes | https://playwright.dev/docs/emulation |
| Flutter screens: golden tests (`matchesGoldenFile`, alchemist), or `flutter build web` plus Playwright | Files (Dart) | Yes: goldens render headless; fonts must be loaded explicitly, otherwise test text renders as boxes (K) | Yes | Mobile (Android, iOS), desktop, web | BSD-3 (K) | Yes | https://docs.flutter.dev/testing/overview (K) |
| React Native or Expo rendered through React Native Web, captured with Playwright | Files | Yes, with web rendering approximating native | Yes | Mobile (RN projects) | MIT (K) | Yes | https://necolas.github.io/react-native-web/ (K) |
| Jetpack Compose: Compose Preview Screenshot Testing (alpha; merged into AGP test suites from AGP 9.5), Roborazzi or Paparazzi, all on the JVM with no emulator | Files (Kotlin `@Preview`) | Yes | Yes | Android | Apache-2.0 | Yes | https://developer.android.com/studio/preview/compose-screenshot-testing (V), https://developer.android.com/studio/preview/compose-screenshot-testing-with-testsuites (V), https://github.com/takahirom/roborazzi (S) |
| SwiftUI previews with swift-snapshot-testing | Files (Swift) | Yes, but only on a macOS runner | Yes | iOS, macOS | MIT (K) | Yes | https://github.com/pointfreeco/swift-snapshot-testing (K) |
| Avalonia headless (`UseSkia()`, `CaptureRenderedFrame()`) | Files (XAML, C#) | Yes, cross-platform, no display needed | Yes | Desktop (Windows, macOS, Linux) | MIT (K) | Yes | https://docs.avaloniaui.net/docs/concepts/headless/ (V) |
| WinUI 3, WPF, Qt, GTK | Files | Hard: these need a real desktop session. An HTML mock styled after Fluent, the GNOME HIG or Qt is the practical route. | Yes | Desktop | Varies | Yes | (K) |
| TUI: Textual (`pytest-textual-snapshot` writes SVG), charmbracelet VHS (`.tape` with `Screenshot x.png`), freeze, Ratatui with `insta`, Bubble Tea `teatest`, Ink | Files | Yes: SVG or PNG; VHS also writes `.txt` frames | Yes | Terminal and CLI apps | MIT (K) | Yes | https://pypi.org/project/pytest-textual-snapshot/ (S), https://github.com/charmbracelet/vhs (S) |
| Plain-text CLI mock: a Markdown or `.txt` transcript of commands and output | Files | Not needed; text is the artifact, or render with VHS or freeze | Yes | CLI, libraries | Free | Yes | (K) |

### 1.3 Diagrams and wireframes as files

| Tool | Agent edits | Auto PNG | Git | Use | License / cost | Offline | Sources |
|---|---|---|---|---|---|---|---|
| Mermaid (`mmdc` CLI) | Files | Yes (PNG, SVG) | Yes | Screen flows, state machines, sequences | MIT (K) | Yes | https://github.com/mermaid-js/mermaid-cli (K) |
| PlantUML (includes Salt wireframes) | Files | Yes, with Java, or with Graphviz for some diagrams | Yes | Flows; Salt gives crude form wireframes | GPL by default, with other license builds available (K) | Yes | https://plantuml.com/salt (K) |
| D2 | Files | Yes (SVG, PNG) | Yes | Flows, architecture | MPL-2.0 (K) | Yes | https://d2lang.com (K) |
| Excalidraw (`.excalidraw` JSON) | Files; only community MCPs exist, no official one found (S) | Via community export tools or MCPs (S) | Yes, though the JSON diffs are noisy | Hand-drawn low-fidelity wireframes | MIT (K) | Yes | https://github.com/johnymontana/excalidraw-export-mcp (S), https://github.com/yctimlin/mcp_excalidraw (S) |
| tldraw (`.tldr` JSON) | Files or SDK | Yes, through the SDK in a browser | Yes | Whiteboard wireframes | SDK: no license needed in development; production needs a trial, hobby (watermarked) or commercial license (V) | Yes in development | https://tldraw.dev/legal/tldraw-license (V), https://tldraw.dev/faq (V) |

### 1.4 Design platforms

| Tool | Agent edits | Auto PNG | Git | Client types | License / cost | Offline | Sources |
|---|---|---|---|---|---|---|---|
| **Figma** (REST API, Dev Mode, official MCP) | **Read and write.** The REST API reads files and renders nodes to images (it cannot create nodes) (K). The remote MCP (`mcp.figma.com/mcp`) has write-to-canvas: `use_figma` runs Plugin API JavaScript to create frames, components, variants, variables and auto layout (V). There is also code-to-canvas, which turns live web UI into design. Write access is in beta, free during the beta and later usage-based, and needs a Full seat to write outside drafts on a Professional, Education, Organization or Enterprise plan (V). Claude Code is a listed client (V). Forum reports show the write tool is sometimes missing for some clients (S). | Yes: REST `GET /v1/images` (K), MCP screenshots (S) | No: binary cloud file. Commit the exported PNGs plus the file URL and version. | Web, mobile, desktop | Proprietary; paid seat for write access | No | https://developers.figma.com/docs/figma-mcp-server/ (V), https://developers.figma.com/docs/figma-mcp-server/write-to-canvas (V) |
| **Penpot** | Read and write. Official MCP (`npx @penpot/mcp@stable` locally, or remote with a key) with the tools `execute_code` (Plugin API JavaScript), `high_level_overview`, `penpot_api_info`, `export_shape` and `import_image` (V). Needs an active browser tab with the MCP plugin connected (V). Community reports describe about 30 s timeouts on large `execute_code` calls (S). Before 2.15.0 there was an unauthenticated REPL security issue, CVE-2026-45805 (S). | Yes: `export_shape` (limited on the remote server) (V) | Partly: files export as `.penpot`; not diff-friendly | Web, mobile, desktop | Open source (MPL-2.0, K); free SaaS or self-hosted | Yes when self-hosted | https://help.penpot.app/mcp/ (V), https://community.penpot.app/t/mcp-api-issue-list/10700 (S) |
| **Modao (墨刀)** | Official `modao-proto-mcp`: `gen_description`, `gen_html` (Modao's own AI turns a description into HTML; costs credits) and `import_html` (saves into the user's Modao space). Needs an API token (S). It cannot import arbitrary agent-written HTML as the main path; `htmlString` exists only as a fallback (S). | Not through MCP; the returned HTML can be screenshotted by Playwright | The HTML returned can be committed; the Modao project is cloud-only | Web, mobile (Chinese teams) | Proprietary; credits, with top-up at modao.cc/ai (S) | No | https://glama.ai/mcp/servers/modao-dev/modao-proto-mcp (S) |
| **MasterGo** | Official `@mastergo/magic-mcp` is **read-oriented**: `getDsl`, `getD2c`, `getComponentLink`, `getMeta` and similar. No write tool was found (S). Needs Team edition or higher, and files in Team Projects (S). | Not documented | No | Web, mobile | Proprietary | No | https://github.com/mastergo-design/mastergo-magic-mcp (S) |
| **Pixso** | Official local MCP (inside the desktop client, `127.0.0.1:3667/mcp`) and remote MCP (OAuth or personal token). Its docs list read, edit, design-to-code, code-to-design and screenshot checks; the remote server has fewer features (V). | Screenshot checks (local) (V) | No | Web, mobile | Proprietary | Local client only | https://pixso.net/developer/en/mcp/introduction.html (V) |
| **JsDesign (即时设计)** | No official MCP found. A community bridge, `@jiujiang/jishi-mcp-server`, uses a plugin and a WebSocket and claims to read, export and run JavaScript (S). | The community bridge claims PNG and SVG export (S) | No | Web, mobile | Proprietary | No | https://www.pkgstats.com/pkg:@jiujiang/jishi-mcp-server (S) |

### 1.5 AI UI generators

| Tool | Agent access | Auto PNG | Git | License / cost | Notes | Sources |
|---|---|---|---|---|---|---|
| **Google Stitch** (Galileo AI was acquired by Google in May 2025 and relaunched as Stitch) | Official remote MCP at `https://stitch.googleapis.com/mcp` with an `X-Goog-Api-Key` header; the agent can generate and edit screens and read them (S). Docs: stitch.withgoogle.com/docs/mcp/setup (page not opened). | Community MCPs export HTML plus screenshots (S) | Exported HTML and `DESIGN.md` tokens only | Free during beta (S) | Its output style is its own and is hard to keep aligned with a chosen design system | https://www.mindstudio.ai/blog/google-stitch-mcp-coding-agents/ (S), https://uxmagic.ai/blog/galileo-ai-is-now-google-stitch (S) |
| **v0 (Vercel)** | Platform API (projects, chats, deployments); a GA headless API was reported in August 2026 (S) | Via deployed preview plus Playwright | Generated React, shadcn and Tailwind code can be committed | Credits and tokens; API access on higher tiers (S). Check v0.app/pricing. | Output is React with shadcn | https://v0.app/docs (K), https://uibakery.io/blog/vercel-v0-pricing-explained-what-you-get-and-how-it-compares (S) |
| **Uizard** (acquired by Miro, 2024) | Listed API of unclear scope; no MCP found (S) | No | No | Freemium (S) | Not agent-friendly | https://siliconcanals.com/uizard-acquired-by-miro/ (S) |
| **Visily** | Sources conflict on a public API; an MCP on the Pro plan is reported (S) | Unknown | No | Freemium (S) | Unverified | https://www.forasoft.com/blog/article/ai-wireframe-tools-comparison (S) |
| Others: Banani, Magic Patterns (both advertise MCP servers) | Vendor claims (S) | Unknown | Code export | Paid | Unverified | https://www.banani.co/blog/uizard-alternatives (S) |

### 1.6 Fit with this design step

The step needs four things: the agent edits the source, the source renders to PNG without a person, the source can be versioned on the scratch branch, and the user confirms one screen at a time.

- **Meets all four:** hand-written HTML/CSS with Playwright, framework or Storybook prototypes, native screenshot tests (Compose, Flutter, Avalonia, Textual, VHS), and Mermaid or D2 for flows.
- **Agent can write, but the source lives in a cloud tool:** Figma (needs a paid Full seat; write access is in beta), Penpot (open source; needs an open browser tab), and Pixso. Offer these as opt-in, for teams that already work in them. Commit the PNGs plus the file link and version.
- **Read or generate only:** MasterGo (read), Modao (it generates with its own AI; it is not driven by the agent's design), and Stitch or v0 (their own generators). Useful as an inspiration step or for handoff to a team that uses them. Weak as the source of record.

## 2. UI style options

| Style / library | Platforms | Implementations | License | Notes | Sources |
|---|---|---|---|---|---|
| Material 3 | Android, Flutter, web | Compose Material 3, Flutter `material`, Angular Material, MUI (React; mostly Material 2 with partial Material 3), Vuetify 3, `@material/web` | Apache-2.0, BSD-3 or MIT | `@material/web` has been in **maintenance mode** since June 2024 (V) | https://m3.material.io (K), https://github.com/material-components/material-web/discussions/5642 (S) |
| Fluent 2 | Windows, web, cross-platform Microsoft products | Fluent UI React v9, Fluent UI Web Components, WinUI 3, the WPF Fluent theme, the Avalonia Fluent theme | MIT (K) | Natural fit for Windows desktop and Microsoft 365 add-ins | https://fluent2.microsoft.design (K) |
| Apple HIG | iOS, iPadOS, macOS, watchOS, visionOS | SwiftUI and UIKit native; Apple Design Resources (Figma and Sketch kits) | Guidelines are free; the UI kits and SF fonts are licensed only for mockups of Apple-platform apps (K) | On the web, only an imitation, using `system-ui` fonts | https://developer.apple.com/design/human-interface-guidelines (K) |
| Ant Design | Web (React); also Vue and Angular ports and Ant Design Mobile | antd, ant-design-vue, ng-zorro-antd | MIT (K) | Dense enterprise and admin screens; popular in China | https://ant.design (K) |
| IBM Carbon | Web | React, Web Components, Angular | Apache-2.0 (K) | Enterprise and data-heavy screens; strong accessibility | https://carbondesignsystem.com (K) |
| Atlassian Design System | Web (React) | `@atlaskit/*` | Packages are labeled Apache-2.0, but the ADS and design-guidelines license may restrict use outside the Atlassian ecosystem (S) | Offer only for Atlassian apps | https://atlassian.design/license (S) |
| Shopify Polaris | Shopify admin apps | Polaris Web Components (since October 2025); **Polaris React is deprecated** (V) | Custom MIT-based license; icons under the Polaris guidelines license (S) | Offer only for Shopify apps | https://github.com/Shopify/polaris (S) |
| GOV.UK Design System | Web, UK public services | `govuk-frontend` (Nunjucks, HTML) | MIT code; the crown and GDS Transport font are restricted to GOV.UK (K) | Offer only for UK government services; an accessibility reference otherwise | https://design-system.service.gov.uk (K) |
| shadcn/ui | Web (React; community ports for Vue, Svelte, RN) | Copy-in components on Radix and Tailwind; official MCP (V) | MIT (K) | Neutral, easy to retheme; good default for new React projects | https://ui.shadcn.com (V) |
| Radix (Primitives, Themes) | Web (React) | `@radix-ui/*` | MIT (K) | Unstyled, accessible primitives; Themes adds a styled layer | https://www.radix-ui.com (K) |
| Chakra UI v3 | Web (React) | `@chakra-ui/react` | MIT (K) | | https://chakra-ui.com (K) |
| Mantine | Web (React) | `@mantine/*` | MIT (K) | Rich set of components and hooks | https://mantine.dev (K) |
| PrimeReact, PrimeNG, PrimeVue | Web (React, Angular, Vue) | | MIT; premium templates and blocks are paid (K) | One look across three frameworks | https://primeng.org (K) |
| Angular Material | Web (Angular) | `@angular/material` | MIT (K) | Material 3 tokens | https://material.angular.dev (K) |
| Element Plus | Web (Vue 3) | | MIT (K) | Admin screens; popular in China | https://element-plus.org (K) |
| Vuetify 3 | Web (Vue 3) | | MIT (K) | Material style | https://vuetifyjs.com (K) |
| Bootstrap 5 | Web (any) | CSS and JS | MIT (K) | Familiar and plain; works in hand-written HTML with no build | https://getbootstrap.com (K) |
| DaisyUI | Web (Tailwind) | Tailwind plugin | MIT (K) | Theme switching through CSS variables; works in hand-written HTML | https://daisyui.com (K) |
| TDesign, Arco Design, Naive UI, Vant | Web; Vant and TDesign Mobile for mobile web and mini-programs | Vue and React | MIT (K) | Chinese ecosystem alternatives | https://tdesign.tencent.com (K) |
| React Native Paper, Tamagui, gluestack | Mobile (React Native) | | MIT (K) | Paper follows Material 3 | https://callstack.github.io/react-native-paper (K) |
| Flutter Material and Cupertino | Mobile, desktop, web | Built into Flutter | BSD-3 (K) | | https://docs.flutter.dev/ui/widgets (K) |
| Native desktop: WinUI 3 (Fluent), AppKit or SwiftUI (HIG), GTK 4 with libadwaita (GNOME HIG), Qt (Qt Quick Controls), Avalonia (Fluent or Simple theme) | Desktop | | WinUI MIT; GTK LGPL; Qt LGPL, GPL or commercial; Avalonia MIT (K) | | (K) |
| TUI styles: Textual themes, Rich, Lip Gloss, Ratatui | Terminal | | MIT (K) | Offer color theme, box style and density as options | https://textual.textualize.io (K) |
| Custom or brand | Any | Design tokens (colors, type, spacing, radius) layered on a neutral base such as shadcn or Radix | | Ask for brand colors, fonts and a logo | |

## 3. Rendering and comparison

### 3.1 Rendering prototypes to PNG reliably

| Topic | Practice | Sources |
|---|---|---|
| Engine | Playwright (Chromium, Firefox, WebKit) is preferred over Puppeteer (Chromium-first). Both are Apache-2.0 (K). Playwright's `devices` registry gives phone and tablet viewports, DPR and touch. | https://playwright.dev/docs/emulation (K) |
| Consistency | Rendering differs by OS, browser version, settings and hardware. Generate and compare in the same environment (V). Use the official image `mcr.microsoft.com/playwright:vX.Y.Z-<distro>`, pinned to the project's Playwright version (S). | https://playwright.dev/docs/test-snapshots (V), https://playwright.dev/docs/docker (K) |
| Fonts | The official image mainly has Latin fonts. Install `fonts-noto-cjk` (and emoji fonts) for Chinese, Japanese and Korean, otherwise text renders as boxes (S). Prefer web fonts that ship with the prototype (`@font-face` from local files) over system fonts. | https://dev.to/zoetaka38/why-your-playwright-screenshots-show-for-japanese-chinese-korean-text-and-the-3-line-15pj (S) |
| Determinism | Wait for `document.fonts.ready` and network idle. Disable animations (`animations: 'disabled'`), hide carets, and move the mouse away from hover targets (V). Freeze the clock and random data. Use fixed mock data. Use `stylePath` or masks to hide volatile parts (V). | https://playwright.dev/docs/test-snapshots (V) |
| Sizes | Typical set: desktop 1440×900 (and 1280×800); tablet 834×1194; phone 390×844 at DPR 3 (iPhone class) and 412×915 (Pixel class) (K). Take full-page shots for long forms. Capture each state (empty, loading, error, filled) as its own image. | |
| File naming | One PNG per screen, state and viewport, for example `.docs/design/screens/<screen>/<state>-<viewport>.png`. Store PNG or lossless WebP (V). | https://playwright.dev/docs/test-snapshots (V) |

### 3.2 Comparing confirmed screens with implemented screens

The design PNG and the implemented PNG will never be pixel-identical: the data is real, the fonts render differently, and the components come from production code. Two tiers work.

1. **Human or AI side-by-side review** when a screen is implemented. Render the implemented screen at the same viewport and state, and show it with the confirmed PNG plus a diff overlay. Judge layout, fields, labels and states rather than pixels.
2. **Pixel regression from then on.** The first approved screenshot of the *implemented* screen becomes the baseline for regression tests. The design PNG stays as the spec and is not used as the regression baseline.

| Tool | Type | Fit | License / cost | Sources |
|---|---|---|---|---|
| Playwright `toHaveScreenshot` | Built into the test runner; `threshold` (0.2 by default), `maxDiffPixels`, masks; the baselines are committed | Default for web | Apache-2.0, free (V) | https://playwright.dev/docs/test-snapshots (V) |
| pixelmatch or odiff | Image diff libraries for a one-off design-to-implementation diff image | Side-by-side review step | MIT (K) | https://github.com/mapbox/pixelmatch (K) |
| reg-suit | CLI diff with an HTML report; framework-agnostic; stores results in S3 or GCS | Self-hosted diffing of any PNG folders | MIT, free (S) | https://github.com/reg-viz/reg-suit (S) |
| BackstopJS | Self-hosted, Puppeteer or Playwright, local HTML report | Self-hosted web | MIT, free (S) | https://github.com/garris/BackstopJS (S) |
| Argos | Hosted review UI that uploads Playwright or Storybook screenshots | Teams that want a review UI | Open source with paid cloud; self-hosting is unsupported (S) | https://argos-ci.com/blog/best-visual-regression-testing-tools (S) |
| Chromatic | Storybook cloud | Storybook projects | Paid, from about $179 a month (S) | https://www.chromatic.com (S) |
| Percy (BrowserStack), Applitools | Cloud; Applitools uses AI matching | Enterprise | Paid, with free tiers (S) | https://browserstack.com/guide/visual-regression-testing-tool (S) |
| Lost Pixel | Being discontinued; the team joined Figma in April 2026 (S) | **Do not adopt** | | https://argos-ci.com/blog/lost-pixel-alternatives (S) |
| Native: Roborazzi, Paparazzi or Compose Preview tests (Android); Flutter goldens; swift-snapshot-testing (iOS); Avalonia headless with Verify.Avalonia (desktop); pytest-textual-snapshot, insta or teatest (TUI) | Committed baselines with built-in diffs | Native clients | Open source | See section 1.2 |

## 4. Defaults the design step could offer

| Client type | Default prototype tool | Alternatives offered | Default style suggestion | Comparison |
|---|---|---|---|---|
| Web | HTML/CSS with the component library chosen in /architect (Tailwind with shadcn or DaisyUI, Bootstrap, or the framework's library), rendered by Playwright in the pinned Docker image | Framework dev server or Storybook stories; Figma or Penpot if the team already uses them; Mermaid for flows | The library the architecture picked; otherwise shadcn/ui (React), Angular Material or PrimeNG (Angular), Element Plus or Vuetify (Vue), Ant Design or Carbon for dense admin screens | Playwright `toHaveScreenshot` |
| Mobile | HTML at phone viewports in a device frame, styled as Material 3 or iOS | Flutter goldens, Compose previews or SwiftUI snapshots when the native stack is fixed; Figma or Penpot | Material 3 (Android or cross-platform), Apple HIG (iOS-only), or both side by side | The stack's native snapshot tool |
| Desktop | HTML styled as Fluent 2, macOS or GNOME (Electron or Tauri use the web defaults) | Avalonia headless; Flutter desktop goldens | Fluent 2 (Windows), Apple HIG (macOS), libadwaita (Linux) | Native snapshot tool, or Playwright for web-based shells |
| Terminal / CLI | Text transcript (Markdown) for CLIs; Textual snapshot SVG or VHS `.tape` PNG for TUIs | freeze; Ratatui with insta | Framework theme, color scheme and density | Textual snapshots, insta, teatest or VHS `.txt` |
| No UI | No screen prototypes; Mermaid or D2 for flows and state machines, plus interface examples | PlantUML | Not applicable | Contract tests instead of screenshots |
