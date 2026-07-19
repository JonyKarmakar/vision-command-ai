# E.4 Command-driven Workflow Upgrade

Status: Active

E.4 starts after the completion of the professional image and uploaded-video analysis workflows.

The purpose of E.4 is to make VisionCommand AI feel like a command-driven assistant, not only a UI with buttons.

## E.4.1 Command skills registry

Status: Implemented in PR #514

The command skills registry defines what the assistant can currently do, what workflows already exist manually, what still needs command-driven execution, what context each skill requires, and what limitations apply.

The registry is exposed through:

- `GET /commands/skills`
- `GET /commands/skills/{skill_id}`

## Why this matters

The project already has many image, video, chat, report, and workflow features.

Without a registry, command behavior can become scattered across parser logic, planner logic, frontend buttons, chat panels, and individual backend endpoints.

The registry gives E.4 a clear foundation for future command routing.

## Registry categories

The registry covers:

- image analysis commands
- image editing commands
- video editing commands
- video analysis commands
- video reporting workflows
- supported-class explanation behavior
- manual workflows that should become command-driven in E.4

## Important boundary

A registered skill is not automatically a claim that it is fully command-driven.

The `execution_status` field separates:

- `implemented_command`
- `workflow_available_manual`
- `partially_implemented_command_support`

This keeps the project honest.

## Examples of current implemented command skills

- detect image objects
- crop by detected class
- blur by detected class
- zoom by detected class
- enhance image
- blur background around detected objects
- trim uploaded video
- extract video frame
- detect objects in sampled video frames

## Examples of workflows available manually but not fully command-driven yet

- professional uploaded-video object analysis
- video privacy review
- video analysis report export
- tracking readiness summary

These are planned for later E.4 slices.

## Next E.4 slices

Recommended next steps:

- E.4.2 expose the registry in Developer Mode
- E.4.3 use the registry in command planning and preparation
- E.4.4 connect command-driven video analysis report generation
- E.4.5 connect command-driven privacy review and tracking readiness summaries
- E.4.6 add command-driven multi-step workflows

## Safety boundaries

The registry must not overclaim:

- no live or streaming detection
- no identity recognition
- no face recognition
- no emotion inference
- no private activity inference
- no real persistent tracking IDs yet
- no open-vocabulary detection yet

Future milestones can update the registry only after the features are implemented and tested.

## E.4.2 Developer Mode registry view

Status: Implemented in PR #515

The command skills registry is now visible from Developer Mode.

The frontend can load `GET /commands/skills` and display:

- registry version
- milestone status
- total skill count
- execution status summary
- category summary
- user examples
- mapped actions
- mapped workflows
- required and optional context
- outputs
- limitations

This makes the command layer easier to inspect before E.4 starts using the registry for planning, routing, and multi-step workflow execution.

This PR does not change command execution behavior.

## E.4.3 Registry-aware command planning metadata

Status: Implemented in PR #516

Command planning and command plan preparation now include compact command skill metadata.

Planning responses can include:

- matched command skill ID
- skill title
- skill category
- execution status
- supported media
- mapped actions
- mapped workflows
- required and optional context
- outputs
- limitations

Prepare-execution responses also include the matched command skill metadata for ready and blocked plans.

This makes it easier to understand whether a planned command maps to an implemented command, a manual workflow, or a partially implemented command-support behavior.

This PR does not change command execution behavior and does not make manual workflows command-driven yet.

## E.4.4 Command skill metadata in plan previews

Status: Implemented in PR #517

Developer Mode now displays command skill metadata inside the Command Plan Preview and Prepared Execution Preview.

The frontend shows:

- matched command skill ID
- skill title
- category
- execution status
- supported media
- mapped actions
- mapped workflows
- required and optional context
- outputs
- limitations

This makes registry-aware planning easier to inspect before the project adds command-driven routing or multi-step workflow execution.

This PR does not change command execution behavior.

## E.4.5 Command skill execution readiness labels

Status: Implemented in PR #518

Developer Mode now translates command skill execution status into readable readiness labels inside the Command Plan Preview and Prepared Execution Preview.

The labels clarify whether a matched skill is:

- executable now
- available as a manual workflow
- partially supported
- tracked as future work

This improves E.4 transparency before command routing or multi-step workflow execution is added.

This PR does not change command execution behavior.

## E.4.6 Command execution safety hints

Status: Implemented in PR #519

Developer Mode now shows execution safety hints inside the Prepared Execution Preview.

The hints explain:

- whether execution is blocked
- whether a prepared command object exists
- whether warnings are present
- whether the matched skill is implemented, manual-only, or partially supported
- what required context is expected
- when not to overclaim automation

This improves safety and transparency before command routing or multi-step workflow execution is added.

This PR does not change command execution behavior.

## E.4.7 Command Skills Registry filters

Status: Implemented in PR #520

Developer Mode now supports local filtering inside the Command Skills Registry.

The registry can be filtered by:

- execution status
- category

The view also shows how many skills match the active filters and provides a reset action.

This makes the registry easier to inspect as E.4 adds more command skills and workflow-routing metadata.

This PR does not change command execution behavior.

## E.4.8 Command plan examples from registry

Status: Implemented in PR #521

Developer Mode now lets registry examples populate the command input.

Each command skill example can be selected from the Command Skills Registry and loaded into the command input for testing.

This helps test planner behavior from the registry without automatically running, parsing, planning, or executing the command.

This PR does not change command execution behavior.

## E.4.9 Registry example planning shortcut

Status: Implemented in PR #522

Developer Mode now lets a registry example be loaded and planned from the Command Skills Registry.

The shortcut:

- loads the selected example into the command input
- clears stale command parse and prepare-execution state
- sends the example to the command planning endpoint
- opens the Command Plan Preview after planning

This is a planning shortcut only. It does not run commands, prepare execution, execute prepared commands, or add workflow routing.

This PR does not change command execution behavior.

## E.4.10 Registry example plan-and-prepare shortcut

Status: Implemented in PR #523

Developer Mode now lets a registry example be planned and prepared for inspection from the Command Skills Registry.

The shortcut:

- loads the selected example into the command input
- clears stale parse, clarification, plan, and prepare-execution state
- sends the example to the command planning endpoint
- sends the returned plan to the prepare-execution endpoint
- opens the Prepared Execution Preview for inspection

This is still not command execution. It does not run commands, execute prepared commands, or add workflow routing.

This PR does not change command execution behavior.

## E.4.11 Prepared execution decision checklist

Status: Implemented in PR #524

Prepared Execution Preview now includes a decision checklist before the developer decides whether to execute a prepared command.

The checklist uses existing prepare-execution data only:

- prepared command object availability
- backend executable flag
- matched registry skill readiness
- warning presence
- manual confirmation requirement

This improves the safety boundary after planning and preparation, especially when using registry example shortcuts.

This PR does not change command execution behavior, routing, backend logic, model behavior, or prepared command execution.

## E.4.12 Prepared execution manual confirmation gate

Status: Implemented in PR #525

Prepared Execution Preview now requires an explicit frontend confirmation before Execute Prepared Command becomes clickable.

The confirmation gate:

- resets whenever a new prepare-execution result is loaded
- stays disabled when the prepared command is not technically executable
- asks the developer to confirm checklist, warnings, active media, and prepared command review
- enables the existing Execute Prepared Command button only after confirmation

This is a frontend safety gate only.

This PR does not change backend logic, command execution behavior, workflow routing, LLM behavior, or vision model behavior.

## E.4.13 Command execution audit summary

Status: Implemented in PR #526

Prepared command execution now produces a frontend audit summary after Execute Prepared Command completes.

The audit summary records:

- execution timestamp
- original command
- planner mode
- prepared action
- final result type
- active media filename and media source
- matched registry skill metadata
- prepare-execution warnings
- manual confirmation state

This is a frontend traceability summary only. It is not a database audit log.

This PR does not change backend logic, command execution behavior, workflow routing, LLM behavior, or vision model behavior.

## E.4.14 Command workflow demo guide

Status: Implemented in PR #527

The E.4 command workflow now has a dedicated demo guide:

- `docs/e4-command-workflow-demo-guide.md`

The guide documents the complete Developer Mode flow from command skills registry discovery through example loading, planning, prepare-execution, decision checklist review, manual confirmation, prepared command execution, and frontend audit summary review.

The guide also documents safety boundaries, honest portfolio wording, manual or partial workflow behavior, troubleshooting, and what not to claim.

This PR is documentation only. It does not change frontend behavior, backend behavior, command execution, routing, LLM behavior, or vision model behavior.

## E.4.15 E.4 milestone summary

Status: Implemented in PR #528

The E.4 command workflow now has a dedicated milestone summary:

- `docs/e4-command-workflow-milestone-summary.md`

The summary documents what E.4 implemented, what it proves, what it does not prove yet, safety and honesty boundaries, deferred future work, and the recommended next step.

This PR is documentation only. It does not declare v1.0 readiness and does not change frontend behavior, backend behavior, command execution, routing, LLM behavior, or vision model behavior.
