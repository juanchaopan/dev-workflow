---
name: design
description: The design step of an issue, for any kind of client or none. Settles what code and tests are written from - screens and flow, fields, common rules, data, interfaces, notifications, permissions, complex rules, concurrent changes and errors - asking the user before anything is written, and has every screen drawn as a prototype on the issue's scratch branch, rendered to images and confirmed by the user, animations by their key frames. Writes .docs/design/. Use for "/design <issue>" or when another step comes back to the design.
argument-hint: <issue number>
---

# Design

Read `../issue/workflow.md` first. Every rule there applies here. This step changes only `.docs/design/`; its commits carry `Step: design`. Prototype sources go on the issue's scratch branch.

## Ask before you write

Decisions about content are asked first, with multiple-choice questions, and only what the user has answered goes into the design documents and the prototypes: fields, whether they are required, validation rules, error messages, permissions, complex rules, concurrent changes, the errors the issue meets. The look - where buttons go, how a screen is laid out - is drawn by you and confirmed by the user on the images; changes the user asks for while looking are made. Judge from the amount of work how many questions to ask at once and how many screens to show at once.

## What to design

Judge from the project and the issue which design documents are needed. `references/design-aspects.md` lists the aspects to think through, the usual approaches to concurrent changes, and the kinds of error; ask the user about the concurrent changes and the errors this issue meets.

A layout that usually fits:

- `.docs/design/README.md`: where each screen's images are, and which scratch branch holds each screen's prototype source;
- `.docs/design/screens/`: the confirmed images, in one folder per kind of client when there are several;
- `data.md`, `interfaces.md`, `rules.md`, created only when needed.

The design is the text of the design documents plus the confirmed images. The prototypes are only how the images are drawn.

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
- Confirmed images go into `.docs/design/screens/`.

## Animations

- An animation that matters is described in the design text: what moves from where to where, how long it takes, and the moments of its key frames. Each key frame gets an image, which the user confirms.
- When the stack cannot hold an animation at a chosen moment in tests, tell the user now; that animation is captured only at its start and end.
- Other animations are captured only after they end.

## Changing an existing design

- Change the existing documents in place; do not append.
- Show the user the whole of every screen the issue changes, not only the changed part.
- Take the latest prototype source from the scratch branch `.docs/design/README.md` names, copy it to this issue's own scratch branch, change it there, and point the README at the new branch.

## Things outside this issue

When the user brings up something beyond this issue, judge whether it belongs here, or becomes a new issue through /change with its dependency set.

## Finish

End each document with `Last changed: #<issue> (<date>)`, commit with `Step: design`, push the issue branch and the scratch branch, and comment on the issue.
