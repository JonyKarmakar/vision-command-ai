# Dockerignore Model Artifacts

## Purpose

This document explains why model artifact patterns are excluded from the backend Docker build context.

---

## Change

The backend Docker ignore file now excludes common model artifact patterns:

- *.pt
- *.onnx
- *.engine
- *.torchscript
- models/
- artifacts/

---

## Why This Matters

The local YOLO model file exists at:

backend/yolo26n.pt

This file is ignored by Git because .gitignore includes:

*.pt

However, Git ignore rules and Docker ignore rules are separate.

Before this change, the model file was ignored by Git, but it could still be sent to Docker during backend image builds.

---

## Benefit

This change helps prevent:

- accidentally sending large model files into Docker build context
- slower Docker builds
- unclear model artifact behavior
- accidental dependency on local-only model files

---

## What This Does Not Do

This change does not copy model files into the Docker image.

This change does not change MODEL_NAME.

This change does not change backend detection behavior.

This change only prevents ignored model artifacts from being included in the Docker build context.

---

## Related Files

- backend/.dockerignore
- .gitignore
- docs/model-artifact-strategy.md
- backend/Dockerfile
