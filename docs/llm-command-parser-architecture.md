# LLM Command Parser Architecture

This document explains the command parsing layer in VisionCommand AI and how it prepares the project for future real LLM integration.

## Purpose

The LLM layer is responsible for understanding user commands and converting them into structured actions.

It does not perform object detection. YOLO performs detection.

The parser layer converts commands such as:

```text
crop person
blur all persons
extract frame at 1 second
detect frames from 0 to 3 seconds
track person from 0 to 3 seconds
trim video from 0 to 2 seconds
```

into structured command objects such as:

```json
{
  "action": "track_video",
  "class_name": "person",
  "start_seconds": 0,
  "end_seconds": 3,
  "interval_seconds": 1.0
}
```

The execution layer then uses this structured output to call the correct backend function.

## Main Flow

```text
User command
    ↓
Parser mode selected
    ↓
Command parser service
    ↓
Structured parsed command
    ↓
Parsed command validation
    ↓
Command execution
    ↓
Result
```

## Current Parser Modes

### rule_based

The current working parser.

It uses deterministic Python logic in:

```text
backend/app/services/command_parser.py
```

It recognizes keywords such as:

```text
detect
crop
blur
extract frame
extract frames
detect frames
track
trim video
```

This parser is predictable and testable.

### llm_mock

A mock LLM parser mode.

It currently reuses the rule-based parser internally but returns parser metadata as:

```json
{
  "parser_mode": "llm_mock",
  "parser_type": "llm_mock",
  "parser_version": "mock-v1"
}
```

This exists to test the future LLM architecture without calling an external LLM.

### real_llm

A future parser mode.

It is reserved for real external LLM integration.

At the moment, it returns a not-implemented response. This is intentional.

## Important Backend Endpoints

### Parse command

```text
POST /commands/parse
```

Parses a command without executing it.

Example request:

```json
{
  "command": "crop person",
  "parser_mode": "rule_based"
}
```

Example response:

```json
{
  "command": "crop person",
  "parser_mode": "rule_based",
  "parser_type": "rule_based",
  "parser_version": "v1",
  "parsed_command": {
    "action": "crop_by_class",
    "class_name": "person"
  }
}
```

### Preview LLM prompt

```text
POST /commands/parse/prompt-preview
```

Returns the prompt structure that a future LLM parser would receive.

It includes:

```text
prompt_version
system_prompt
user_prompt
expected_json_schema
```

This helps with prompt engineering and LLMOps.

### Validate parsed command

```text
POST /commands/validate-parsed
```

Validates structured parsed command JSON before execution.

This protects the backend from invalid LLM output.

Example valid parsed command:

```json
{
  "action": "crop_by_class",
  "class_name": "person"
}
```

Example invalid parsed command:

```json
{
  "action": "crop_by_class"
}
```

The invalid example fails because class_name is required.

### Evaluate parser

```text
GET /commands/evaluate?parser_mode=rule_based
GET /commands/evaluate?parser_mode=llm_mock
```

Runs parser evaluation cases and returns:

```text
total cases
passed cases
failed cases
accuracy
expected output
actual output
```

This provides a baseline for future LLM parser evaluation.

### Compare parsers

```text
GET /commands/evaluate/compare
```

Compares parser modes side by side.

Currently compares:

```text
rule_based
llm_mock
```

Later this can compare:

```text
rule_based
llm_mock
real_llm
```

## Frontend Support

The frontend currently supports:

```text
Parser mode selector
Parse Command
Preview LLM Prompt
Validate Parsed Command
Load Parser Evaluation
Load Parser Comparison
```

This makes the command parser layer visible in the UI.

## Why Validation Matters

Real LLM output cannot be trusted blindly.

A future LLM might return incomplete or incorrect JSON:

```json
{
  "action": "crop_by_class"
}
```

The validation layer checks whether required fields are present before execution.

This prevents unsafe or broken command execution.

## Future Real LLM Integration Plan

The next implementation phase should add real LLM support behind the existing parser interface.

Future flow:

```text
User command
    ↓
parser_mode = real_llm
    ↓
Build prompt
    ↓
Call external LLM
    ↓
Parse JSON response
    ↓
Validate parsed command
    ↓
Return structured command
```

The real LLM parser should include:

```text
Environment variable for API key
Provider configuration
Timeout handling
Error handling
Fallback to rule_based parser
Logging of parser attempts
Evaluation against existing test cases
```

## Current Status

Completed:

```text
Rule-based command parser
Mock LLM parser mode
Parser metadata
Parser mode selector
Parse command endpoint
Prompt preview endpoint
Parsed command validation service
Parsed command validation endpoint
Frontend validation panel
Parser evaluation endpoint
Frontend evaluation panel
Parser comparison endpoint
Frontend comparison panel
Parser service interface
Prompt builder service
Parser evaluation tests
```

Not completed yet:

```text
Real external LLM API integration
LLM parser output JSON parsing
LLM parser logging
LLM parser latency/cost tracking
LLM fallback strategy
LLM evaluation against rule_based baseline
```

## Key Lesson

The LLM part of this project is not just “call an LLM”.

The correct production-style design is:

```text
Prompt
    ↓
LLM output
    ↓
Structured JSON
    ↓
Validation
    ↓
Evaluation
    ↓
Execution
    ↓
Logging
```