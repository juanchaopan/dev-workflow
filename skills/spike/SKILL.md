---
name: spike
description: Technical spike (proof of concept). When an approach is uncertain, run a time-boxed verification first — write down the question and what counts as success, build the minimum on a spike branch, produce evidence (a URL to open, screenshots, performance numbers, logs) for the user, record the conclusion as an ADR once the user decides, merge only the conclusion and its evidence into main, and keep the spike code on its branch and archive tag. Use when the user says "let's do a POC first", "verify this first", "will this approach work" or "build a quick prototype"; /kickoff, /architect, /design and /change also suggest it for uncertain, risky points.
---

# Technical spike

A spike answers exactly one question. Its code does not aim for quality and has no complete tests. It is never merged into main or into any production branch. What it produces is a conclusion backed by evidence: the ADR and the evidence files it links are merged into main, and the code stays on the spike branch as reference.

Everything that produces a result is committed on the spike branch. Nothing that makes a result stays only on the local machine.

## Steps

### 1. Define the question

Settle these with the user through AskUserQuestion (in the user's language) and write them into the spike notes (step 3):

- **The question**: one sentence, e.g. "Can WebSocket push stay below 200 ms latency with 1,000 concurrent connections?", "Will users understand this drag-to-reorder interaction at first sight?", "Can the existing payment API do installments?".
- **Success and failure criteria**: observable and measurable, e.g. "P95 latency below 200 ms", "at least 4 of 5 people finish the reordering without hints".
- **Time box**: the most it may take (e.g. "half a day", "at most three attempts"). No conclusion by then is a conclusion too: this path costs too much.
- **Out of scope**: what is explicitly not verified this time, so the scope does not grow.

### 2. Choose the form

Every form lives on a branch `spike/<short-name>`.

| What to verify | Form | Where |
|---|---|---|
| Whether a library, service or algorithm works and is fast enough | A small standalone program or script with measurement code | Code in `spikes/<short-name>/` on the spike branch |
| UI and interaction | A clickable prototype with hard-coded data | A temporary page in the existing frontend, or a separate frontend under `spikes/<short-name>/`, on the spike branch |
| Integration with the existing system | The smallest change on the real code | The spike branch itself |
| Technology unrelated to the existing project | A small standalone project | Code in `spikes/<short-name>/` on the spike branch; when the project has no repository, an empty directory with `git init` and a `spike/<short-name>` branch |

Spike branches and directories start with `spike` so everyone can see they are not production code.

### 3. Write the spike notes

Put a `SPIKE.md` in the spike directory (or at the branch root): the question, criteria, time box, out of scope, the exact commands that reproduce every result (setup, data, run, measurement, screenshot), and an empty results section. Commit it before the first attempt. Results are added to it as they come in.

### 4. Build the minimum

- Build only what the question needs. Hard-coded data, skipped error handling and ignored layering rules are fine.
- Put everything that reproduces a result in the branch: measurement programs, rendering and screenshot scripts, sample data, configuration files and the results themselves. Anything a result depends on and that is not committed is a defect of the spike.
- Measurements must be trustworthy: for performance questions, warm up, repeat, and record the distribution (P50, P95, max), never a single run.
- Commit every attempt (`chore(spike): <what was tried>`) so it can be reviewed, and commit the results in SPIKE.md as they come in.
- Never open a PR meant for merging from a spike branch.

### 5. Collect evidence

| Kind of question | Evidence |
|---|---|
| Performance and feasibility | Measured numbers and tables, run logs, a description of the test environment (machine, data volume) |
| UI and interaction | A URL to open plus screenshots. Running locally, give `http://localhost:<port>` (with the project's start command or `docker compose up`). When the project has PR preview environments, push the spike branch and open a **draft PR** titled `[spike] ...` whose body says "do not merge", and show the user the preview URL |
| Integration | Complete requests, responses and logs of successful and failed calls |

Before the project has PR preview environments and CI, the evidence is local: the localhost URL, the screenshots and the numbers.

### 6. Let the user verify and decide

Put the question, criteria, evidence and your assessment side by side. For UI questions, ask the user to open the URL and try it themselves. Then ask for the conclusion with AskUserQuestion:

- Adopt: the criteria are met; implement this approach for real
- Drop: the criteria are not met or the cost is too high; say what to use instead
- One more round: something is still unverified; say what the next round verifies (still within the time box)

### 7. Record the conclusion

- On the spike branch, add the conclusion to SPIKE.md (adopted or dropped, and the ADR it goes into) and commit it.
- On a `docs/` branch from main, write the ADR from the architect skill's `templates/adr.md`, with the status "Accepted" (adopted) or "Rejected" (dropped). Its "Evidence" section holds the measurements and points to the screenshots.
- Copy into `docs/adr/assets/` only the evidence files the decision needs (for example the screenshots and the measurement tables), taken from the spike branch with `git checkout spike/<short-name> -- <path>` or `git show spike/<short-name>:<path>`. Everything else stays on the spike branch: the code, the measurement programs, the scripts, the sample data, the configuration and SPIKE.md.
- Commit the ADR and the copied evidence on the `docs/` branch with `docs(adr): <conclusion>` and merge it with /open-pr. The spike branch is not merged.
- When the spike answered an open question, mark it resolved in `docs/product/open-questions.md` and say which ADR holds the conclusion.
- When the spike changed the understanding of a requirement (e.g. users do not understand the interaction), update that requirement on the same `docs/` branch.

### 8. Check that the spike reproduces from its committed files

Before archiving, clone the spike branch into a new empty directory, outside the working tree and with no other files around it, and check that the results can be reproduced from it alone:

1. `git clone --branch spike/<short-name> <path-of-this-repository> <clean-directory>`; the clone contains only committed files.
2. In the clean directory, run the commands in SPIKE.md in order. A missing file, dependency or configuration is a defect: commit it on the spike branch, then repeat the check from step 1.
3. Compare the reproduced results with those in SPIKE.md. If they differ beyond the measured spread, record the difference in SPIKE.md and tell the user before the conclusion stands.
4. Delete the clean directory.

### 9. Clean up

Archive first, then remove only the local copy, and check each step before the next. Steps that need a remote apply only when the repository has one (`git remote` lists `origin`). The spike branch on the remote is never deleted, and once pushed, a branch stays there.

1. Close the draft PR, when there is one. Closing it leaves its branch in place.
2. Check nothing is left out: on the spike branch `git status` is clean, and SPIKE.md with the results, evidence and conclusion is committed. Otherwise commit them now (`chore(spike): record the results`).
3. Archive: `git tag archive/spike-<short-name> spike/<short-name>`.
4. Keep the branch on the remote, when there is one: `git push -u origin spike/<short-name>` (when it was pushed before, this sends the last commits), then `git ls-remote --heads origin spike/<short-name>` must list it at the same commit as the local branch. Push the tag too: `git push origin archive/spike-<short-name>`, and confirm it with `git ls-remote --tags origin archive/spike-<short-name>`.
5. Without a remote, the spike branch and its archive tag stay in the local repository. Do not delete the local branch yet: the tag keeps its commits, and the branch and tag are pushed when /scaffold creates the remote, which pushes all spike branches and tags.
6. Remove the local copy, once it is safe: with a remote, after step 4 is confirmed; without one, after scaffold has pushed the branch and tag. Switch away from the branch and run `git branch -D spike/<short-name>`.
7. A spike in its own `git init` directory has no remote: ask the user whether to push it to a new private repository (`gh repo create <name> --private --source . --push`, then push the tag) or keep it only on this machine, and tell them where it is. The directory is deleted only once it is pushed, or when the user says to drop it.

The spike comes back when needed from its remote branch (`git switch spike/<short-name>` creates the local branch from `origin`) or from the tag (`git switch -c spike/<short-name> archive/spike-<short-name>`).

### 10. The real implementation

When the conclusion is "adopt", tell the user the next step: the ADR's decision goes into the design or the change of the issue that uses it. Plan that issue with /change when the project already has requirement documents, or with /roadmap otherwise, then implement it with /implement. The issue's design or change text takes the conclusion and refers to the ADR. The spike code is reference only; do not copy it straight into production code.
