---
name: spike
description: Technical spike (proof of concept). When an approach is uncertain, run a time-boxed, throwaway verification first — write down the question and what counts as success, build the minimum, produce evidence (a URL to open, screenshots, performance numbers, logs) for the user, record the conclusion as an ADR once the user decides, then throw the spike code away and implement through the normal workflow. Use when the user says "let's do a POC first", "verify this first", "will this approach work" or "build a quick prototype"; /kickoff, /architect, /design and /change also suggest it for uncertain, risky points.
---

# Technical spike

A spike answers exactly one question. Its code does not aim for quality, has no complete tests and **is never merged into production code**; what it produces is a conclusion backed by evidence. The real implementation comes after the conclusion and is written from scratch through /roadmap and /implement.

## Steps

### 1. Define the question

Settle these with the user through AskUserQuestion (in the user's language) and write them into the spike notes (step 3):

- **The question**: one sentence, e.g. "Can WebSocket push stay below 200 ms latency with 1,000 concurrent connections?", "Will users understand this drag-to-reorder interaction at first sight?", "Can the existing payment API do installments?".
- **Success and failure criteria**: observable and measurable, e.g. "P95 latency below 200 ms", "at least 4 of 5 people finish the reordering without hints".
- **Time box**: the most it may take (e.g. "half a day", "at most three attempts"). No conclusion by then is a conclusion too: this path costs too much.
- **Out of scope**: what is explicitly not verified this time, so the scope does not grow.

### 2. Choose the form

| What to verify | Form | Where |
|---|---|---|
| Whether a library, service or algorithm works and is fast enough | A small standalone program or script with measurement code | A `spike/<short-name>` branch, code in `spikes/<short-name>/` |
| UI and interaction | A clickable prototype with hard-coded data | A `spike/<short-name>` branch, as a temporary page in the existing frontend or a separate frontend under `spikes/` |
| Integration with the existing system | The smallest change on the real code | A `spike/<short-name>` branch |
| New technology unrelated to the existing project | A small standalone project | A local temporary directory; create a repository only if the user wants to keep it |

Spike branches and directories start with `spike` so everyone can see they are not production code.

### 3. Write the spike notes

Put a `SPIKE.md` in the spike directory (or the branch root): question, criteria, time box, out of scope, how to run it. Results are added here later.

### 4. Build the minimum

- Build only what the question needs. Hard-coded data, skipped error handling and ignored layering rules are fine.
- Measurements must be trustworthy: for performance questions, warm up, repeat, and record the distribution (P50, P95, max), never a single run.
- Commit every attempt (`chore(spike): <what was tried>`) so it can be reviewed. Never open a PR meant for merging from a spike branch.

### 5. Collect evidence

| Kind of question | Evidence |
|---|---|
| Performance and feasibility | Measured numbers and tables, run logs, a description of the test environment (machine, data volume) |
| UI and interaction | A URL to open plus screenshots. Running locally, give `http://localhost:<port>` (with the project's start command or `docker compose up`); when the project has PR preview environments, push the spike branch and open a **draft PR** titled `[spike] ...` whose body says "do not merge", and show the user the preview URL |
| Integration | Complete requests, responses and logs of successful and failed calls |

### 6. Let the user verify and decide

Put the question, criteria, evidence and your assessment side by side. For UI questions, ask the user to open the URL and try it themselves. Then ask for the conclusion with AskUserQuestion:

- Adopt: the criteria are met; implement this approach for real
- Drop: the criteria are not met or the cost is too high; say what to use instead
- One more round: something is still unverified; say what the next round verifies (still within the time box)

### 7. Record the conclusion

- Write an ADR (the architect skill's `templates/adr.md`) with the status "Accepted" or "Rejected", with the measurements and the location of the screenshots in its "Evidence" section.
- When the spike answered an open question, mark it resolved in `docs/product/open-questions.md` and say which ADR holds the conclusion.
- When the spike changed the understanding of a requirement (e.g. users do not understand the interaction), update that requirement.

### 8. Clean up

- Close the draft PR.
- Tag the spike branch for the archive, then delete it: `git tag archive/spike-<short-name> spike/<short-name> && git push origin archive/spike-<short-name>`, then delete the local and remote branches. The tag brings it back when needed.
- Evidence such as screenshots and measurements goes into `docs/adr/assets/` and is committed with the ADR; the spike code never enters a production branch.

### 9. The real implementation

When the conclusion is "adopt", tell the user the next step: split real issues with /change (when the project has requirement documents) or /roadmap, then implement them properly with /implement. The spike code is reference only; do not copy it straight into production code.
