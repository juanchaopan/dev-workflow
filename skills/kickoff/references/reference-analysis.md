# Analysis of a reference project

Analyze one reference project and write an independent analysis of it into this project.

Ask the user for the reference project's directory.

Explore the reference project freely and exhaustively. Decide for yourself what to examine, in what order and how deeply, and continue until nothing about the project is left unexplained.

Infer from the repository every resource outside it that the project uses, and examine each one as thoroughly as the code. When the repository lacks the address or credential needed to reach a resource, ask the user for it.

The implementation is evidence of what the project intends, not a statement of it, and it may be wrong anywhere. Establish the intent, and record where the implementation departs from it.

Leave the reference project and every resource it uses as you found them.

Write the analysis to `.docs/reference/<project-name>/`, organized in whatever way fits this project. It stands on its own, like a third-party audit: it contains no path of the reference project, absolute or relative, and no secret value.

Add the reference project, with a short summary, to `brief.md`. A project may have several reference projects, each in its own folder.
