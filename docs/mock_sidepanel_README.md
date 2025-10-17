# Mock Sidepanel Preview

This mock page shows how the Terms Guardian side panel should look once the analysis completes and data is hydrated.

## What it contains

- Document metadata and combined grade, using the gradient text style introduced during UI refresh
- Summary metrics populated with representative values from `data/sample_analysis.json`
- Risk badge, confidence chip, and document length chip for at-a-glance context
- Section snapshots, key excerpts, and uncommon terms populated from the same mock data set
- Gradient background and glassmorphism effects to match the current design language

## How to view it

1. Open the repository in VS Code or your preferred editor.
2. Right-click `docs/mock_sidepanel.html` and choose **Open with Live Server** (or simply open the file in your browser).
3. The page is fully static—no build step is required.

> Tip: The page scales down to mobile width, so you can toggle device emulation in browser dev tools to check small-screen behavior.

## Updating the mock

If the panel layout or typography changes, adjust the markup and inline styles in `docs/mock_sidepanel.html`. The values can be swapped out easily with future sample analyses to reflect new scenarios (e.g., high-risk vs. low-risk documents).
