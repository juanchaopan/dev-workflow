# Design aspects

Reference list for the design step. It helps the design think of everything an issue may need settled. Use what the project and the issue need; it is not a checklist to fill, and aspects outside it are welcome.

## Aspects

| Aspect | What to settle |
|---|---|
| Screens and flow | Which screens exist and how one leads to another; each screen's layout, fields, actions and states |
| Fields | Type, required or not, length, default, validation rules, the message shown on error |
| Common rules | Rules every screen shares: date and amount formats, paging, how required fields are marked |
| Data | Tables and columns, or the formats of files and messages |
| Interfaces | Interfaces the system offers: web interfaces, command line, library, scheduled jobs. Interfaces it calls: what it sends and what it receives |
| Notifications | When they are sent, to whom, through which channel (text message, email, push), and what they say |
| Permissions | Who may see what, and who may do what |
| Complex rules | How states change, how several conditions decide an outcome, how amounts are calculated |
| Concurrent changes | What happens when two people change the same data at the same time |
| Errors | What the user sees, and what becomes of the data, in each kind of error |

## Concurrent changes

Ask the user which concurrent changes can happen in this issue. Three usual approaches, for reference; the details belong to the project:

- the later save is rejected and the user sees the newer data;
- the later save overwrites;
- the data is locked while someone edits it.

## Kinds of error

Ask the user which of these this issue meets, and what the user sees in each:

- the input is wrong;
- the business rules do not allow it (e.g. not enough stock, not enough balance);
- no permission (not signed in, session expired, no right to this action);
- the thing is gone (someone else deleted it);
- a concurrent change conflicts;
- something it depends on fails (an external service does not answer, the database cannot be reached);
- the network drops (a phone or browser is briefly offline);
- partial success (a batch where some items succeed and some fail, e.g. 3 of 100 imported rows have errors);
- duplicate submission (the user presses "Pay" twice);
- a bug in the program itself.
