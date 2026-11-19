---
name: deploy
description: Deploys one deployment target named in the architecture's "Deployment targets" section, on any code platform, by starting that target's manually started deployment job - stop when downtime is needed, migrate and rebuild, deploy, smoke tests - so secrets stay on the platform. Production gets the latest released version, staging the latest main. Use for "/deploy production", "/deploy staging" or "deploy to production".
argument-hint: <target>
---

# Deploy

Read `../issue/workflow.md` first. Every rule there applies here. The platform's commands for starting a job and reading its result are in `../issue/references/platforms.md`.

1. Read the section "Deployment targets" in `.docs/architecture.md`. When the target named is not there, say so, list the targets there are, and stop.
2. Decide what to deploy:
   - production: the latest released version. When production already runs it, say so and ask whether to deploy it again;
   - staging: the latest `main`.
3. Tell the user what the job will do, and whether the target is down while it runs. Start only when the user confirms.
4. Start the target's deployment job with that version. It stops the service when the target needs downtime, runs `migrate` and `rebuild`, deploys, and runs the smoke tests: all of them on staging, the production-safe ones on production. A target without an address is published, and the job confirms the new version is visible.
5. Wait for the job with one command that blocks until it finishes, run in the background. Walk the user through every step that needs their hands, such as a submission to an app store, and wait for each to be done.
6. Report the result: what was deployed where, the migrations, the smoke tests.

When the job fails, tell the user what failed. When something goes wrong in production, it is fixed forward: a `fix` issue through /change, then /release and /deploy again.
