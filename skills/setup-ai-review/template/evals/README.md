# An exam for the AI reviewer

This directory collects real bugs from the project to test the AI reviewer: given that change again, would it catch the bug?

## When to add a case

- A bug was found only after merging (reported by users, failed in production, or you reverted it).
- The AI reviewer raised a false alarm on a change that was actually fine. Record these too, as "clean" cases that check for false positives.

## How to add one

Copy `review-cases/_template.md` to `<date>-<short-description>.md` and fill in the metadata at the top:

| Field | Meaning |
|---|---|
| `id` | The case name; the file name works |
| `expect` | `bug`: the change contains a bug the reviewer should report; `clean`: the change is fine and the reviewer should report nothing Important |
| `pr` | The PR number of the change. Instead of `pr` you can give `base` and `head` |
| `base` / `head` | The commits before and after the change; the diff between them is what gets reviewed |
| `file` / `line` | The file with the bug (relative to the repository root) and its line number after the change. Not needed for `clean` cases |

In the body, describe what happened, the root cause and how it was fixed, for later reference.

## How to run

```
node evals/run-review-evals.mjs            # every case
node evals/run-review-evals.mjs <id> ...   # only the given cases
```

A bug counts as caught when the reviewer reports an Important finding near its line (within 10 lines by default). Every run appends its score to `results.jsonl`, together with the version of REVIEW.md at the time.

Optional environment variables: `EVAL_MODEL` sets the model, `EVAL_LINE_TOLERANCE` the allowed line deviation.

## When to run

After changing REVIEW.md or CLAUDE.md, switching models, or when review quality seems to have changed. If the score did not improve, revert the change.

Each case is one Claude call and uses your allowance.
