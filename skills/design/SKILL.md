---
name: design
description: The design step of an issue, for any kind of client or none. Settles what code and tests are written from - screens and flow, fields, common rules, data, interfaces, notifications, permissions, complex rules, concurrent changes, errors and animations - going through every aspect with the user, checking the whole design for contradictions and gaps, and writing into .docs/design/ only what the user has confirmed - every document's full text is shown before it is written, and every screen is drawn as a prototype on the issue's scratch branch, rendered to images and confirmed by the user, animations by their key frames. Use for "/design <issue>" or when another step comes back to the design.
argument-hint: <issue number>
---

# Design

Read `../issue/workflow.md` first. Every rule there applies here. This step changes only `.docs/design/`; its commits carry `Step: design`. Prototype sources go on the issue's scratch branch.

## Everything is confirmed before it is written

Every document in `.docs/design/`, every line in it and every image is something the user has confirmed.

- **Every aspect.** Go through each aspect in `references/design-aspects.md` with the user. For an aspect this issue touches, ask its decisions with multiple-choice questions. For an aspect you judge it does not touch, tell the user why and have them confirm it. An aspect the issue needs that the list does not name is gone through the same way.
- **Content is asked.** Screens and flow, fields and their rules and messages, common rules, data, interfaces, notifications, permissions, complex rules, concurrent changes, errors and animations come from the user's answers. A detail of your own is a suggestion, asked on its own.
- **The look is shown.** Where buttons go and how a screen is laid out are drawn by you and confirmed by the user on the images. Changes the user asks for while looking are made and shown again.
- **Every document's text is shown.** Before a document is written or changed, show the user the whole text it will hold, `.docs/design/README.md` and the `Last changed` line included, and write it once the user confirms it. Changes the user asks for are made and the whole text is shown again.
- Judge from the amount of work how many questions to ask at once and how many screens to show at once.

## What to design

The design is the text of the design documents plus the confirmed images. The prototypes are only how the images are drawn.

Propose the documents this issue needs and confirm them with the user. A layout that usually fits:

- `.docs/design/README.md`: where each screen's images are, and which scratch branch holds each screen's prototype source;
- `.docs/design/screens/`: the confirmed images, in one folder per kind of client when there are several;
- `data.md`, `interfaces.md`, `rules.md`, when the issue needs them.

## Prototypes

- Ask which tool draws the prototypes and in which style. Recommend one per kind of client (`references/design-tools.md` has the full list):

| Client | Recommended | Also possible | Shown to the user |
|---|---|---|---|
| Web | Hand-written HTML with the component library chosen in architect | The framework's dev server or Storybook; Figma or Penpot when the team already uses them | One PNG per state |
| Phone | HTML at phone size, in a phone frame | Screenshots from Flutter, Compose or SwiftUI previews; Figma, Penpot | PNG |
| Desktop | HTML in the Fluent, macOS or GNOME style | Screenshots from Avalonia or Flutter desktop | PNG |
| Command line | The commands and their output written in Markdown | Textual or VHS screenshots for terminal interfaces | Text, or SVG or PNG |
| No interface | Flow and state diagrams (Mermaid, D2) with request and response examples of the interfaces | PlantUML | Diagrams and examples |

- Prototype sources, and whatever renders them, are committed to the issue's scratch branch `scratch/<number>-<short-name>`, never to `main`.
- Render one full-page image per state and per screen size, and show them to the user to confirm: one at a time, or in batches when there are many, a part drawn and confirmed before the next.
- Only confirmed images go into `.docs/design/screens/`.

## Animations

- An animation that matters is described in the design text: what moves from where to where, how long it takes, and the moments of its key frames. Each key frame gets an image, which the user confirms.
- When the stack cannot hold an animation at a chosen moment in tests, tell the user now; that animation is captured only at its start and end.
- Other animations are captured only after they end.

## Changing an existing design

- Change the existing documents in place; do not append. The text shown to the user is the whole document after the change.
- Show the user the whole of every screen the issue changes, not only the changed part.
- Take the latest prototype source from the scratch branch `.docs/design/README.md` names, copy it to this issue's own scratch branch, change it there, and point the README at the new branch.

## Things outside this issue

When the user brings up something beyond this issue, judge whether it belongs here, or becomes a new issue through /change with its dependency set.

## After the aspects and screens

Once every aspect and every screen is confirmed, and before any document's text is shown, check the whole design for contradictions and gaps on your own. Do not ask the user more questions about it; tell them what you found.

## Finish

Every document ends with `Last changed: #<issue> (<date>)`. Commit with `Step: design`, push the issue branch and the scratch branch, and comment on the issue.
