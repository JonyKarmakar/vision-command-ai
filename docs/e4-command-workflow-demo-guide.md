# E.4 Command Workflow Demo Guide

This guide demonstrates the Milestone E.4 command-driven workflow in VisionCommand AI.

E.4 makes the assistant workflow more inspectable and safer by connecting command skills, command examples, planning, prepare-execution, safety review, manual confirmation, prepared command execution, and frontend audit traceability.

## Demo purpose

Use this demo to show that VisionCommand AI is not only a collection of image and video buttons.

The demo proves that the system can:

- show a command skills registry in Developer Mode
- separate implemented commands from manual or partial workflows
- load command examples from the registry
- plan a registry example without executing it
- plan and prepare a registry example for inspection
- show command skill metadata inside plan previews
- explain execution readiness and safety hints
- require manual confirmation before prepared execution
- execute an existing prepared command only after confirmation
- show a frontend audit summary after prepared command execution

## Important safety boundary

This milestone does not add a new model, new detection behavior, new LLM behavior, new backend command router, database audit table, or fully automated multi-step workflow engine.

E.4 improves the command workflow around existing implemented capabilities.

The registry is honest about command status:

- `implemented_command` means the command maps to an implemented execution path
- `workflow_available_manual` means the workflow exists in the UI but is not fully command-driven
- `partially_implemented_command_support` means some command support exists but manual steps or future routing may still be required

The demo should not claim:

- live or streaming detection
- identity recognition
- face recognition
- emotion inference
- private activity inference
- real persistent tracking IDs
- open-vocabulary detection
- database-backed execution auditing

## Recommended demo setup

Start the backend and frontend in the normal local development setup.

Use Developer Mode for this demo.

Have at least one image uploaded before demonstrating an image command execution path. Use a simple image with common detectable objects such as a person, car, dog, cat, bottle, chair, or laptop.

For video command examples, upload a short video only if you want to show video prepare-execution behavior. Keep the main demo focused on one successful image command execution first.

## Demo flow

### 1. Open Developer Mode

Open VisionCommand AI and switch to Developer Mode.

Explain that Developer Mode shows the command workflow internals that are hidden or simplified in User Mode.

Suggested narration:

- Developer Mode lets me inspect how a natural command becomes a plan, how the plan is prepared, and what safety checks exist before execution.

### 2. Upload an image

Upload an image in the image workspace.

Confirm that the upload result is visible.

Suggested narration:

- I start with uploaded media because command execution should always be grounded in an active image or video, not just a free-floating text command.

### 3. Load the Command Skills Registry

In Developer Mode, load the Command Skills Registry.

Confirm that the registry shows:

- registry version
- milestone status
- total skill count
- execution status summary
- category summary
- skill examples
- mapped actions
- mapped workflows
- required context
- outputs
- limitations

Suggested narration:

- The registry makes the assistant capability boundary explicit. It shows what can run now, what exists manually, and what is still partial or future work.

### 4. Filter the registry

Use the registry filters.

Recommended filters:

- execution status: implemented command
- category: image analysis or image editing

Confirm that the registry count updates.

Suggested narration:

- Filtering helps me focus on command skills that are actually implemented instead of overclaiming every planned workflow.

### 5. Choose a registry example

Pick a simple implemented example.

Good demo examples:

- detect objects in this image
- blur the person in this image
- crop the dog from this image
- zoom into the largest person

Use the plain example-loading action first.

Confirm that the example appears in the command input.

Suggested narration:

- The example is loaded into the input for testing. Loading an example alone does not run, plan, or execute anything.

### 6. Plan the registry example

Use the Plan example action.

Confirm that Command Plan Preview opens.

Review:

- original command
- planner mode
- planned action
- media type
- target class
- target scope
- requires detection
- requires tracking
- confidence
- matched command skill metadata
- readiness label

Suggested narration:

- Planning turns the command into structured intent. At this stage nothing has executed yet.

### 7. Plan and prepare the registry example

Use the Plan and prepare example action.

Confirm that Prepared Execution Preview opens.

Review:

- status
- executable flag
- prepared command object
- warnings
- prepared execution command skill
- execution safety hints

Suggested narration:

- Prepare-execution checks whether the plan can become a concrete command object. It still does not run the command.

### 8. Review the decision checklist

In Prepared Execution Preview, review the Prepared Execution Decision Checklist.

Confirm that it shows:

- prepared command object availability
- backend executable flag
- registry skill readiness
- warnings
- manual confirmation requirement

Suggested narration:

- The decision checklist makes the final boundary visible before execution. It helps prevent accidental or unclear command execution.

### 9. Confirm the manual execution gate

Check the manual confirmation box.

Confirm that Execute Prepared Command becomes clickable only when:

- the prepared command is technically executable
- a prepared command object exists
- the manual confirmation box is checked

Suggested narration:

- This is a frontend safety gate. The developer must confirm that they reviewed the checklist, warnings, active media, and prepared command.

### 10. Execute the prepared command

Click Execute Prepared Command.

Confirm that the command result appears in the correct result view.

For example:

- detection result
- crop result
- blur result
- zoom result
- generated output history item when applicable

Suggested narration:

- Execution uses the existing command execution path. E.4 did not create a new hidden shortcut. It made the path clearer, safer, and easier to audit.

### 11. Review the command execution audit summary

Return to Prepared Execution Preview and review the Command Execution Audit Summary.

Confirm that it records:

- execution timestamp
- original command
- planner mode
- prepared action
- final result type
- active media filename
- active media source
- matched registry skill metadata
- prepare-execution warnings
- manual confirmation state

Suggested narration:

- This audit summary is frontend traceability. It is useful for demos and debugging, but it is not a database audit log.

### 12. Copy or download JSON evidence

Use the copy or download actions for:

- Command Plan Preview
- Prepared Execution Preview
- Command Result

Suggested narration:

- The workflow exposes JSON evidence so the command behavior can be reviewed and tested, not only demonstrated visually.

## Demo path for manual or partial workflows

You can also show a manual or partially supported registry skill.

Recommended flow:

- filter by manual workflow or partial support
- choose an example
- plan or plan-and-prepare it
- show the readiness label
- show warnings or blocked prepare-execution state
- explain that the workflow exists, but is not fully command-driven yet

Suggested narration:

- This is intentionally honest. The registry helps prevent overclaiming by showing whether a workflow is implemented, manual, partial, or future work.

## What to emphasize in a portfolio walkthrough

Emphasize that E.4 demonstrates:

- command-to-plan architecture
- registry-aware capability tracking
- execution readiness labels
- explicit safety boundaries
- manual confirmation before execution
- frontend audit traceability
- clear separation between planning, preparation, and execution

This is useful for AI software engineering, applied AI, LLM application, LLMOps-style evaluation, and production-oriented workflow design.

## What not to claim

Do not describe E.4 as a complete autonomous agent system.

Do not claim the assistant can safely execute any arbitrary command.

Do not claim database-backed audit logging.

Do not claim command routing is complete for every manual workflow.

Do not claim real object tracking, identity recognition, or open-vocabulary vision.

## Troubleshooting

If the prepared execution is blocked, check:

- whether an image or video is uploaded
- whether the selected skill is implemented
- whether the target class is supported
- whether the command needs clarification
- whether warnings explain missing context

If Execute Prepared Command is disabled, check:

- whether the prepared command is executable
- whether a prepared command object exists
- whether the manual confirmation box is checked
- whether the app is currently busy

If the audit summary is not visible, execute a prepared command successfully first.

## Expected final demo message

At the end of the demo, you should be able to say:

- The system shows what commands it supports.
- It can turn selected examples into command plans.
- It can prepare executable commands for inspection.
- It clearly separates planning, preparation, and execution.
- It requires manual confirmation before execution.
- It records a frontend audit summary after execution.
- It keeps limitations visible instead of overclaiming automation.
