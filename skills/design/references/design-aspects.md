# Design aspects

Reference list for the design step: the aspects it goes through with the user on every issue. For each aspect, the user either settles what the issue needs or confirms that the issue does not touch it. The details asked depend on the project and the issue. An aspect the issue needs that is not listed here is gone through the same way.

## Aspects

| Aspect | What to settle |
|---|---|
| Screens and flow | Which screens exist and how one leads to another; each screen's layout, fields, actions and states; the screen sizes each is drawn at |
| Fields | Type, required or not, length, default, validation rules, the message shown on error |
| Common rules | Rules every screen shares: date and amount formats, paging, how required fields are marked |
| Data | Tables and columns, or the formats of files and messages |
| Interfaces | Interfaces the system offers: web interfaces, command line, library, scheduled jobs. Interfaces it calls: what it sends and what it receives |
| Notifications | When they are sent, to whom, through which channel (text message, email, push), and what they say |
| Permissions | Who may see what, and who may do what |
| Complex rules | How states change, how several conditions decide an outcome, how amounts are calculated |
| Concurrent changes | What happens when two people change the same data at the same time |
| Errors | What the user sees, and what becomes of the data, in each kind of error |
| Animations | Which animations matter; for each, what moves from where to where, how long it takes, and its key frames |

## Concurrent changes

Ask the user which concurrent changes can happen in this issue, and how each is handled. Three usual approaches, for reference; the details belong to the project:

- the later save is rejected and the user sees the newer data;
- the later save overwrites;
- the data is locked while someone edits it.

## Kinds of error

Ask the user which of these this issue meets, and what the user sees and what becomes of the data in each:

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
