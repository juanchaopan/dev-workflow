---
name: perf-test
description: Runs the project's performance and load tests against one deployment target named in the architecture's "Deployment targets" section, by starting the manually started performance test job, after explaining the impact and getting confirmation for production, and reports the results against the architecture's performance metrics. Use for "/perf-test staging", "/perf-test production" or "load test staging".
argument-hint: <target>
---

# Performance test

Read `../issue/workflow.md` first. Every rule there applies here. The platform's commands for starting a job and reading its result are in `../issue/references/platforms.md`.

1. Read `.docs/architecture.md`.
   - When the project has no performance tests, say so and stop.
   - When the target named is not in "Deployment targets", say so, list the targets there are, and stop.
   - When the target has no address that can take load, such as an app store or a package registry, say that it cannot be tested, and stop.
2. For `production`, explain the impact first: real users may see it slow down, the load creates data and costs, and what the scripts will do. Run only when the user confirms.
3. Start the performance test job for the target, and wait for it with one command that blocks until it finishes, run in the background. The tests create and remove their own data (`workflow.md`, "Tests against deployed targets").
4. Report each result against the performance metrics in the architecture: the metric, the measured value, pass or fail.
