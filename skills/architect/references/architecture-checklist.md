# Architecture hole checklist

Go through each item once the design is done. For each problem say where it is, in which situation it goes wrong, how to change it and what the change costs.

## Does it match the requirements

- Is every MVP requirement owned by at least one component?
- Can every component name the requirements it exists for? One that cannot may be unnecessary.
- Does every architecture metric (scale, response time, availability, cost) have a matching design element?
- Is there a "later" requirement that actually needs room today (multi-tenancy, multiple languages, a public API, data export)?

## Overdesign

- Does the number of services match the maintenance capacity? Every independently deployed service adds deployment, monitoring, upgrades and troubleshooting.
- Is every piece of infrastructure (message queue, cache, search engine) backed by a requirement? Could the database do the job for now?
- Is there complexity added for "maybe later"?
- Managed versus self-hosted: with few maintainers, prefer managed services unless cost or compliance rules them out.

## Distributed-system problems (several services or instances)

- Network calls: is there a timeout? Can a retry execute something twice? Is the called endpoint idempotent?
- When one operation changes data in several services, how is all-or-nothing guaranteed (Saga, Outbox, or not splitting at all)?
- With eventual consistency, can users see stale data? How does the UI handle it?
- Can messages be duplicated, reordered or lost? Can consumers cope? Where do failed messages go (dead-letter queue)?
- When a downstream service slows down, can it drag the upstream down (rate limiting, circuit breakers, back pressure)?
- How do services find each other? How is configuration distributed?
- When an interface or event format changes, can old and new versions run at the same time?
- With several instances: where do sessions live? Does a scheduled job run once per instance? Can local caches diverge?
- Can clock differences between machines affect ordering, expiry and reconciliation?

## Single points of failure and capacity

- Which components run as a single instance? What happens when one goes down? Is that acceptable?
- What if the database goes down? Are there backups? Has a restore been rehearsed? How much data loss (RPO) and downtime (RTO) are acceptable?
- After a year of data growth, are queries still fast? Is partitioning or archiving needed?
- At peak traffic, which component gives out first?

## Data

- Does each kind of data have exactly one owner? Do two services write the same table?
- Can schema changes ship without downtime (add the column, migrate data, drop the old column last)? Does rolling back the application require rolling back the database?
- Sensitive data: is it encrypted at rest? Can it end up in logs? Who can access it?
- Are the deletion and export requirements reflected in the design?

## Security

- Is every hop authenticated, including internal calls between services?
- Is authorization enforced on the server, not just by hiding buttons in the frontend?
- Where do secrets and tokens live? Can they end up in the repository or in images?
- At which layer is external input validated?
- Are administrative functions separated from regular ones?
- How bad is it if a third-party service you depend on is compromised or abused?

## Code structure

- Does each component's layering match its stack's standards? If not, is there an ADR, and were the architecture check rules changed with it?
- Are frontend pages separated from presentational components? Can a presentational component render from its inputs alone?
- Do module boundaries match data ownership? Does any module read or write another module's data directly?

## Delivery and operations

- Does every component have a health check? Does it shut down gracefully (finishing in-flight requests before exiting)?
- When a request crosses several services, can one trace ID tie the logs together?
- How do you find out something is wrong? Where do alerts go?
- Are the environments complete: can the whole system run locally? Does every PR get a preview environment? Does someone approve production deployments?
- How do you roll back code, configuration and database schema?
- Where do feature flags live, and how is a feature switched off without redeploying?

## Migration (modernization and architecture changes)

- Can every step ship and roll back on its own?
- While old and new implementations coexist, how is data kept consistent? Who owns the data?
- Were characterization tests added to pin down current behavior before touching old code?
- Does any step require downtime? How long? Can users accept it?
- When, and under which conditions, is the old system retired?

## Cost

- What is the monthly cost with no traffic? With 10 times the expected traffic?
- Are there services billed per traffic or per call that could run away (AI APIs, egress, log storage)?
