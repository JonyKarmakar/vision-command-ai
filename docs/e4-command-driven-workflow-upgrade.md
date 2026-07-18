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
