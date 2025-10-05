# Aggregated Mock Terms & Policies

This directory consolidates all mock and captured Terms/Policy HTML pages used across the project for training and testing.

## Sources Included

- `__tests__/fixtures/` — lightweight HTML fixtures used by automated unit tests (5 files)
- `docs/fixtures/` — documentation examples and sample TOS snapshots (2 files)
- `test-pages/` — full mock corpus, including curated captures and raw website saves (111 files)

## Maintenance

From the repository root, regenerate this mirror after adding new pages with:

```bash
python scripts/refresh_all_mocks.py
```

## Notes

- The original directory structures are preserved under this aggregation root to avoid filename collisions.
- Supporting `_files/` subdirectories from saved webpages are included so that resource references remain intact.
- Existing tests and pipelines continue to reference the original file locations; this mirror is provided for bulk analysis and dataset preparation.
