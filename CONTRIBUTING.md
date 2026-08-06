# Contributing

Use a simple branch-and-pull-request workflow for team collaboration.

## Branch Naming

Use short, descriptive branch names:

```text
feature/firmware-retry-logic
feature/dashboard-alert-ui
fix/backend-validation
 docs/setup-notes
hardware/pcb-update
```

## Workflow

1. Sync the latest main branch.
2. Create a new branch for your task.
3. Make focused changes.
4. Test the part you changed.
5. Commit with a clear message.
6. Push your branch.
7. Open a pull request into main.
8. Ask at least one teammate to review.

## Commit Style

Use clear commit messages:

```text
Add firmware setup notes
Fix backend temperature validation
Update dashboard alert table
Document PCB pin mapping
```

## Review Checklist

Before opening a pull request, check:

- The project still runs locally.
- No generated folders are committed.
- Environment values are kept in local configuration files.
- Documentation is updated when setup or behavior changes.

## Suggested Team Areas

- Firmware: ESP32 sensor reading and communication logic.
- Backend: Flask API, PostgreSQL schema, validation, and analytics.
- Frontend: dashboard UI, charts, alert views, and usability.
- Hardware: PCB notes, wiring references, and component documentation.
- Documentation: setup guides, API notes, and demo instructions.
