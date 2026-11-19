---
name: kickoff
description: Starts a new project for any language, stack and code platform - asks for the project brief (goals, users, scope, clients, the team's technologies, reference projects, languages), the code platform, public or private, the plan and the initial version, creates the directory, the local and remote repository and the labels, and pushes brief.md and VERSION as the first commit. As the first step of an issue (/kickoff <issue>), updates the brief when the issue changes it, and analyzes a reference project when that is the issue. Use for "new project", "/kickoff", "start a project" or "I have an idea".
argument-hint: "[issue number]"
---

# Kickoff

Read `../issue/workflow.md` first. Every rule there applies here. The platform's commands are in `../issue/references/platforms.md`.

- `/kickoff` with no issue number starts a new project ("A new project").
- `/kickoff <number>`, or this step inside /issue, is the kickoff step of that issue ("The kickoff step").

## A new project

Start from whatever the user brings: an idea, a document or a problem.

### The brief

Ask in rounds, with multiple-choice questions wherever there are options, until each part is clear:

- the goals, the users and the scope, including the features the user already has in mind, as a list;
- the clients it supports: phone, tablet, desktop; touch or keyboard and mouse;
- the technologies the team knows;
- reference projects: existing systems to study, each analyzed later in its own issue through /change, once the project is set up;
- the languages of code comments, of documents, of prototypes and screen text, and of issues and review comments; each may differ.

### The code platform and the repository

1. Ask which code platform hosts the project: GitHub, Azure DevOps, GitLab, Bitbucket Cloud or Gitea/Forgejo. Put what each lacks that matters into the options (`platforms.md`).
2. Ask whether the repository is public or private.
3. Find out the account's plan with the platform's command-line tool (`platforms.md`, "Plans and free CI minutes"). When the plan, for this repository, does not enforce branch rules and required checks, or cannot keep secrets per environment, tell the user what that means, and ask:
   - "Upgrade the plan" (Recommended): the platform then stops a merge that fails a check, including a merge made on its website, and keeps secrets per environment. Payment is the user's to make on the platform's website; wait until it is done.
   - "Stay on this plan": the agent still confirms every condition before it merges, and the hooks check every commit; but anyone can merge on the website, and secrets carry the environment in their names, such as `PROD_DB_URL`.
4. Ask for the initial version, recommending `0.0.0`.

### Create it

1. Write `.docs/brief.md` with the brief and the code platform, ending with `Last changed: initial commit (<date>)`. Write `VERSION` with the version on one line.
2. Create the project directory and the local repository with `main` as its default branch, and create the remote repository with the visibility chosen, its default branch `main`.
3. Commit `.docs/brief.md` and `VERSION` as the first commit, `chore: start the project` with the trailer `Step: kickoff`, and push it to `main`. The main agent checks it against the step table itself (`workflow.md`, "Steps and what each may change").
4. Create the labels on the platform: `type:feature`, `type:fix`, `type:refactor`, `type:maintenance`, `type:ops`, `type:spike`, `size:S`, `size:M`, `size:L`, `size:XL`, `risk:low`, `risk:medium`, `risk:high` and `human-reviewed`, or the platform's equivalents (`platforms.md`). Tell the user which were created.
5. When the project directory is not the current one, tell the user to start Claude Code again in that directory.
6. Tell the user the next command: /change, with what they want built first.

## The kickoff step

1. Read the issue and `.docs/brief.md`.
2. Judge whether the issue changes the brief: a new kind of client, a new compliance requirement, a new group of users, a new reference project. When it does, ask about what changes, and update `.docs/brief.md` once the user has answered.
3. When the issue is the analysis of a reference project, this step is the analysis: follow `references/reference-analysis.md`.
4. When nothing changes, comment "No change in this step: <reason>."

The architect step comes back to this step when it finds that the brief must change.
