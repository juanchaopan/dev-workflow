---
name: spike
description: Technical spike (proof of concept). When an approach is uncertain, run a time-boxed, throwaway verification first — write down the question and what counts as success, build the minimum, produce evidence (a URL to open, screenshots, performance numbers, logs) for the user, record the conclusion as an ADR once the user decides, then archive the spike code as a pushed tag, throw the branch away and implement through the normal workflow. Use when the user says "let's do a POC first", "verify this first", "will this approach work" or "build a quick prototype"; /kickoff, /architect, /design and /change also suggest it for uncertain, risky points.
---

# Technical spike

A spike answers exactly one question. Its code does not aim for quality, has no complete tests and **is never merged into production code**; what it produces is a conclusion backed by evidence. The real implementation comes after the conclusion and is written from scratch through /roadmap and /implement.

Every spike lives in git from the first attempt to the archive tag, so nothing is lost when it is cleaned up.

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
| New technology unrelated to the existing project | A small standalone project | A `spike/<short-name>` branch, code in `spikes/<short-name>/`; when the project has no repository yet, a new directory with `git init` and a `spike/<short-name>` branch |

Spike branches and directories start with `spike` so everyone can see they are not production code.

### 3. Write the spike notes

Put a `SPIKE.md` in the spike directory (or the branch root): question, criteria, time box, out of scope, how to run it. Results are added here later. Commit it before the first attempt.

### 4. Build the minimum

- Build only what the question needs. Hard-coded data, skipped error handling and ignored layering rules are fine.
- Measurements must be trustworthy: for performance questions, warm up, repeat, and record the distribution (P50, P95, max), never a single run.
- Commit every attempt (`chore(spike): <what was tried>`) so it can be reviewed, and commit the results in SPIKE.md as they come in. Never open a PR meant for merging from a spike branch.

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

- On the spike branch, add the conclusion to SPIKE.md (adopted, dropped, the ADR it goes into) and commit it.
- Write an ADR (the architect skill's `templates/adr.md`) with the status "Accepted" or "Rejected", with the measurements and the location of the screenshots in its "Evidence" section. Evidence such as screenshots and measurements goes into `docs/adr/assets/`. Commit them on a `docs/` branch with `docs(adr): <conclusion>` and merge with /open-pr; the spike code never enters a production branch.
- When the spike answered an open question, mark it resolved in `docs/product/open-questions.md` and say which ADR holds the conclusion.
- When the spike changed the understanding of a requirement (e.g. users do not understand the interaction), update that requirement.

### 8. Clean up

Archive first, delete afterwards, and check each step before the next:

1. Close the draft PR, when there is one.
2. Check nothing is left out: on the spike branch `git status` is clean, and SPIKE.md with the results, evidence and conclusion is committed. Otherwise commit them now (`chore(spike): record the results`).
3. Archive: `git tag archive/spike-<short-name> spike/<short-name>`, `git push origin archive/spike-<short-name>`, and confirm the tag is on the remote with `git ls-remote --tags origin archive/spike-<short-name>`. A spike in its own `git init` directory has no remote: ask the user whether to push it to a new private repository (`gh repo create <name> --private --source . --push`, then push the tag) or keep it only on this machine, and tell them where it is.
4. Delete the branch: switch away from it and `git branch -D spike/<short-name>`. Delete the remote branch only when it was pushed (`git ls-remote --heads origin spike/<short-name>` lists it): `git push origin --delete spike/<short-name>`. A standalone `git init` directory is deleted only once it is pushed, or when the user says to drop it.

The tag brings the spike back when needed: `git switch -c spike/<short-name> archive/spike-<short-name>`.

### 9. The real implementation

When the conclusion is "adopt", tell the user the next step: split real issues with /change (when the project has requirement documents) or /roadmap, then implement them properly with /implement. The spike code is reference only; do not copy it straight into production code.
