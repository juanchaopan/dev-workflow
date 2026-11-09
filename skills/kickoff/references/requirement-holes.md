# Requirement hole checklist

Check against these questions after each round of questions and before writing documents. For each hole say where the problem is, what it would lead to and how to fill it.

## Goals and success criteria

- Can the success criteria be measured? "Easy to use" or "fast" will not do; write "responds within 3 seconds" or "50 weekly active users".
- Does every feature map to at least one goal? Features that do not may be scope creep.
- Do two goals conflict? For example "completely free" versus "no ads, no fees, and support a million users".

## Roles and permissions

- Besides the main users, are there administrators, operators, support staff, reviewers or external systems?
- What can each role see, change and delete?
- What happens when one person has several roles? When a role changes or a person leaves, what happens to their data?
- What can people do without signing in?

## Flows and states

- Does every flow have an end? Where does it stop when abandoned halfway, timed out or failed?
- Does any business object have a state that cannot be entered or left? Can any state go back?
- Up to which step are undo, edit and cancel allowed?
- For approval flows: what if the approver is away, rejects, or asks for changes and a resubmission?

## Data

- Where does each kind of data come from, who maintains it, how long is it kept, can it be deleted and exported?
- Is deletion real or a soft delete? What happens to related data?
- Sensitive data such as personal, payment or health information: is it stored, where, and who can see it?
- Money: which currency, what precision, which rounding rule, how are refunds calculated?
- Time: which time zone, daylight saving time, crossing midnight, how deadlines are computed?
- Several languages or regions: do texts, formats or regulations differ?

## Edge cases and failures

- What do empty data, a single record and huge amounts of data look like?
- Two people edit the same record at once: whose change wins?
- Double clicks, duplicate submissions, retries after a lost connection: can they create two orders or two records?
- An external service it depends on (payment, SMS, maps, AI APIs) is down or slow: what does the user see?
- Malicious use: hammering an endpoint, mass sign-ups, uploading malicious files, accessing other people's data?

## Scale and constraints

- What are the orders of magnitude of users, data volume and peak load? And in a year?
- Do the expected response time and availability match the budget and the reality of one maintainer?
- Are there deployment restrictions: a specific country, offline, a specific cloud?
- Are there compliance requirements: personal data protection, security certification, GDPR, industry regulation?

## Scope

- Can the MVP be cut further? Ask for each item: "Is the first version still usable without it?"
- Does the out-of-scope list name the things people would assume are included?
- Is something "for later" actually shaping today's design? For example multi-tenancy or a public API later: not built now, but the architecture must leave room.

## Consistency

- Is the same thing called by different names? Settle one name in the glossary.
- Do answers from different rounds contradict each other?
- Do the user's assumptions include things that actually need verifying? Put them in the "Assumptions" section of the vision.
