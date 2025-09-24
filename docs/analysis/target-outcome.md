# Target Outcome Fixtures - Terms Guardian

## Overview

Target outcome fixtures provide deterministic validation of the analysis pipeline against known ToS documents. They ensure that clause detection, scoring, and categorization remain consistent across changes to the codebase.

## Structure

Each target outcome fixture consists of two files:

1. **HTML fixture**: The test document (e.g., `__tests__/fixtures/complex-tos.html`)
2. **Expectations file**: JSON defining expected analysis results (e.g., `__tests__/fixtures/expected/complex-tos.json`)

## Creating a New Target Outcome Fixture

### 1. Create the HTML fixture

Place your HTML file in `__tests__/fixtures/`. The file should contain realistic ToS content with the clauses you want to test.

```html
<!doctype html>
<html>
  <head>
    <title>Test Terms</title>
  </head>
  <body>
    <h1>Terms of Service</h1>
    <h2>Binding Arbitration</h2>
    <p>You agree to binding arbitration...</p>
    <!-- Add other sections to test -->
  </body>
</html>
```

### 2. Create the expectations file

Place a JSON file in `__tests__/fixtures/expected/` with the same base name as your HTML fixture:

```json
{
  "meta": {
    "fixture": "your-fixture.html",
    "description": "Description of what this fixture tests"
  },
  "expectations": {
    "rightsScoreRange": [20, 80],
    "expectedGradeOneOf": ["C", "D", "F"],
    "mustHaveClauses": {
      "HIGH_RISK": ["ARBITRATION", "CLASS_ACTION_WAIVER"],
      "MEDIUM_RISK": ["LIABILITY_LIMITATION"]
    },
    "expectedCategories": [
      "DISPUTE_RESOLUTION",
      "CLASS_ACTIONS",
      "LIABILITY_AND_REMEDIES"
    ],
    "sectionHeadingRegexes": ["BINDING ARBITRATION|ARBITRATION", "LIABILITY"]
  }
}
```

### 3. Write the test file

Create a test in `__tests__/unit/target_outcome_your_fixture.test.js`:

```javascript
/**
 * @jest-environment node
 */

const fs = require("fs");
const path = require("path");
const { createTextExtractor } = require("../../src/analysis/textExtractor");
const { createRightsAssessor } = require("../../src/analysis/rightsAssessor");
// ... other imports

function loadHtmlFixture() {
  const p = path.join(
    process.cwd(),
    "__tests__",
    "fixtures",
    "your-fixture.html",
  );
  return fs.readFileSync(p, "utf8");
}

function loadExpectations() {
  const p = path.join(
    process.cwd(),
    "__tests__",
    "fixtures",
    "expected",
    "your-fixture.json",
  );
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw).expectations;
}

describe("Target outcome validation: your-fixture", () => {
  // ... test implementation (see target_outcome_complex_tos.test.js as template)
});
```

## Expectations Format

### Core Fields

- **`rightsScoreRange`**: `[min, max]` - Acceptable range for the rights score (0-100)
- **`expectedGradeOneOf`**: Array of acceptable letter grades (`["A", "B", "C", "D", "F"]`)
- **`mustHaveClauses`**: Object specifying required clause detections by risk level
- **`expectedCategories`**: Array of category names that should appear in `categoryScores`
- **`sectionHeadingRegexes`**: Array of regex patterns that should match section headings

### Clause Risk Levels

Clauses are organized into three risk levels:

- **`HIGH_RISK`**: `ARBITRATION`, `CLASS_ACTION_WAIVER`, `UNILATERAL_CHANGES`, etc.
- **`MEDIUM_RISK`**: `LIABILITY_LIMITATION`, `JURY_TRIAL_WAIVER`, etc.
- **`POSITIVES`**: `CLEAR_OPT_OUT`, `SELF_SERVICE_DELETION`, etc.

See `src/utils/constants.js` for the complete mapping.

### Section Heading Regexes

Use regex patterns to validate that important topics appear in section headings:

```json
"sectionHeadingRegexes": [
  "MANDATORY BINDING ARBITRATION|ARBITRATION",
  "WAIVER OF CLASS ACTION|JURY TRIAL",
  "LIMITATION OF LIABILITY",
  "MODIF(?:Y|ICATION)|CHANG"
]
```

## Running Target Outcome Tests

### Run all tests

```bash
npm test
```

### Run only target outcome tests

```bash
npm run test:outcome
```

### Run a specific fixture test

```bash
npm test -- __tests__/unit/target_outcome_your_fixture.test.js
```

## Schema Documentation

The complete schema for target outcome fixtures is documented in `docs/analysis/target-outcome.schema.json`. This schema describes the expected structure of analysis results but is used for documentation only—tests use flexible assertions rather than strict schema validation.

## Best Practices

1. **Use realistic content**: Base fixtures on actual ToS documents to ensure representative testing
2. **Include edge cases**: Test boundary conditions like very short/long documents
3. **Flexible ranges**: Use score ranges rather than exact values to accommodate minor variations
4. **Multiple grades**: Allow multiple acceptable grades to handle borderline cases
5. **Regex patterns**: Make heading regexes tolerant of wording variations
6. **Clause coverage**: Include a mix of high-risk, medium-risk, and positive clauses

## Troubleshooting

### Test failing due to score out of range

- Check if clause detection patterns need updating in `src/data/legalPatterns.js`
- Adjust the score range in your expectations file
- Verify the fixture contains the expected clauses

### Missing clause detections

- Review the text in your HTML fixture
- Check regex patterns in `legalPatterns.js`
- Ensure clause buckets match those in `src/utils/constants.js`

### Section heading regex not matching

- Print actual headings using `console.log` in the test
- Make regex patterns more flexible (e.g., use `MODIF(?:Y|ICATION)` for variations)
- Check that headings are extracted correctly by the summarizer

## Example: Complex ToS Fixture

The `complex-tos.html` fixture demonstrates a comprehensive test covering:

- Multiple high-risk clauses (arbitration, class action waiver, unilateral changes)
- Various section types (billing, data practices, liability)
- Complex legal language requiring multiple detection patterns
- Score range validation (25-95) with flexible grade acceptance

See `__tests__/fixtures/complex-tos.html` and `__tests__/fixtures/expected/complex-tos.json` for the complete example.

