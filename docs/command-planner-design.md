# Intelligent Command Planner Design

## Purpose

The Intelligent Command Planner is the next AI-focused milestone for VisionCommand AI.

The goal is to move beyond simple commands such as:

    crop person
    blur person

Toward richer natural-language image and video commands such as:

    Detect all people and blur the one on the left
    Find the largest vehicle and crop it
    Track the person wearing red in the video
    Zoom into the object near the bottom-right corner
    Extract frames where a dog appears
    Blur all faces and license plates

This milestone brings the project closer to its real identity: a multimodal AI assistant for visual analysis, editing, tracking, and automation.

## What Is a Command Planner?

A command planner converts a user command into a structured action plan.

Example command:

    Blur all people in this image

Expected structured plan:

    {
      "media_type": "image",
      "action": "blur_all_by_class",
      "target_class": "person",
      "target_scope": "all",
      "requires_detection": true,
      "requires_tracking": false,
      "parameters": {},
      "confidence": 0.95,
      "needs_clarification": false,
      "clarification_question": null
    }

The backend can validate this plan and then execute the correct tool.

## Why This Matters

The current command system is useful but still basic.

The future assistant needs to understand:

- Action intent
- Media type
- Target object
- Target location
- Scope such as single, all, largest, left, right, top, bottom, or center
- Whether detection is needed
- Whether tracking is needed
- Whether clarification is needed
- Whether the command is safe and executable

This is what makes the system feel like an AI assistant instead of a collection of buttons.

## Job Skills Covered

This milestone supports:

- AI Engineer
- LLM Engineer
- Applied AI Developer
- Evaluation Engineer
- LLMOps Engineer
- ML Software Engineer

## Core Concepts

### LLM Engineering

The planner should eventually use prompts and structured output to convert natural language into JSON.

Key concepts:

- Prompt design
- Structured JSON output
- Tool selection
- Intent extraction
- Parameter extraction
- Fallback behavior

### Evaluation Engineering

The planner should be tested with a dataset of expected command outputs.

Key concepts:

- Test cases
- Expected vs actual outputs
- Accuracy measurement
- Failure categories
- Regression testing

### LLMOps

The planner should eventually log prompt version, parser mode, latency, provider, success/failure, and validation result.

Key concepts:

- Prompt versioning
- Parser comparison
- Failure tracking
- LLM output validation
- Cost-aware LLM usage

## First Action Plan Schema

The first version should produce this structure:

    {
      "media_type": "image | video | unknown",
      "action": "detect | annotate | crop_by_class | blur_by_class | blur_all_by_class | zoom | track | extract_frames | summarize | unknown",
      "target_class": "person | car | dog | cup | etc | null",
      "target_scope": "single | all | largest | smallest | left | right | top | bottom | center | unknown",
      "requires_detection": true,
      "requires_tracking": false,
      "parameters": {},
      "confidence": 0.0,
      "needs_clarification": false,
      "clarification_question": null
    }

## Planner Modes

### Rule-based planner

Purpose:

- Fast
- Deterministic
- Testable
- Good fallback

Best for:

- Simple commands
- Local testing
- Regression tests

### LLM planner

Purpose:

- Understand richer natural language
- Handle variation in user commands
- Support future voice assistant workflows

Best for:

- Complex commands
- Assistant-like behavior
- Prompt engineering practice

### Hybrid planner

Purpose:

- Try rule-based planner first
- Use LLM planner when the command is complex or uncertain
- Validate all outputs before execution

Best for:

- Production-style AI assistant behavior

## Example Commands and Expected Plans

### Example 1

Command:

    Detect all objects in this image

Expected plan:

    media_type: image
    action: detect
    target_class: null
    target_scope: all
    requires_detection: true
    requires_tracking: false

### Example 2

Command:

    Blur all people

Expected plan:

    media_type: image
    action: blur_all_by_class
    target_class: person
    target_scope: all
    requires_detection: true
    requires_tracking: false

### Example 3

Command:

    Crop the largest car

Expected plan:

    media_type: image
    action: crop_by_class
    target_class: car
    target_scope: largest
    requires_detection: true
    requires_tracking: false

### Example 4

Command:

    Track the person in the video

Expected plan:

    media_type: video
    action: track
    target_class: person
    target_scope: single
    requires_detection: true
    requires_tracking: true

### Example 5

Command:

    Zoom into the object on the left

Expected plan:

    media_type: image
    action: zoom
    target_class: null
    target_scope: left
    requires_detection: true
    requires_tracking: false

## Validation Rules

Planner output should be validated before execution.

Validation should check:

- Is the action supported?
- Is the media type supported?
- Is the target class known or allowed?
- Does the action require a class?
- Does the action require image or video?
- Does the action require clarification?
- Are required parameters present?

Invalid plans should not be executed.

## Evaluation Dataset

The first command evaluation dataset should contain JSON-style test cases.

Each test case should include:

- Input command
- Expected media type
- Expected action
- Expected target class
- Expected target scope
- Expected detection requirement
- Expected tracking requirement

Example:

    {
      "command": "Blur all people",
      "expected": {
        "media_type": "image",
        "action": "blur_all_by_class",
        "target_class": "person",
        "target_scope": "all",
        "requires_detection": true,
        "requires_tracking": false
      }
    }

## First Implementation Plan

The first implementation should be small and testable.

Step 1:

- Add planner schema

Step 2:

- Add rule-based command planner

Step 3:

- Add planner validation

Step 4:

- Add small command evaluation dataset

Step 5:

- Add tests for planner outputs

Step 6:

- Add API endpoint to preview the plan without executing it

Possible endpoint:

    POST /commands/plan

Execution should remain separate from planning.

## Local Testing Requirements

Before pushing planner code, run:

    python -m py_compile backend/app/main.py

Run targeted tests:

    cd backend
    python -m pytest tests/test_command_planner.py -q
    cd ..

For shared command parser changes, run:

    cd backend
    python -m pytest tests/test_command_parse.py tests/test_command_validation.py tests/test_command_execution.py -q
    cd ..

For larger backend changes, run:

    cd backend
    python -m pytest -q
    cd ..

Also run:

    git diff --check
    git status

## Success Criteria

This design milestone is successful when:

- The planner purpose is clear
- The action plan schema is defined
- Planner modes are defined
- Example commands are documented
- Validation rules are documented
- Evaluation dataset direction is documented
- The next implementation branch is clear

The next implementation branch should be:

    feature/command-planner-schema-and-rule-parser
