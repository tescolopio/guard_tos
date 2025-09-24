# Contributing to Terms Guardian

Thanks for your interest in contributing! This guide explains how to propose changes, run tests, and get reviews.

## Getting started

- Fork the repo and create a feature branch from main.
- Use Node 18+.
- Install deps: npm ci

## Development workflow

- Build dev bundle: npm run build:dev
- Run tests: npm test
- Lint (if configured): npm run lint

## Commit style

- Use clear, imperative commit messages: "Add..., Fix..., Refactor...".
- Reference files/modules in the subject when helpful.
- Keep commits focused and small; prefer separate commits for tests vs. code.

## Pull requests

- Describe the change and motivation.
- Include screenshots/GIFs for UI updates.
- Add/adjust tests when behavior changes.
- Update documentation where relevant.

## Tests

- Unit tests live under **tests**.
- Ensure the full test suite passes locally.
- For flaky tests, mark and explain in the PR.

## Areas of focus

- Analysis pipeline stability (rights, readability, summaries)
- Side panel rendering and performance
- Constants and thresholds alignment with docs
- Documentation clarity and examples

## Code of conduct

Be respectful and constructive. Assume positive intent. Collaborate openly.
