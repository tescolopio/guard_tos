# Terms Guardian Test Fixtures

This directory contains test fixtures for manual smoke testing of the Terms Guardian extension.

## Files

- `sample-tos.html` - Comprehensive Terms of Service test page

## Test Fixture Details

### `sample-tos.html`

**Purpose**: Test all core extension functionality on a single page

**Features Tested**:

- ✅ Legal text detection (should trigger extension badge)
- ✅ Rights assessment (arbitration, class action waiver, etc.)
- ✅ Readability grading (mixed complexity levels)
- ✅ Summarization (multiple sections)
- ✅ Uncommon words identification
- ✅ Dictionary terms extraction

**Expected Behavior**:

1. **Extension Detection**: Badge should appear when page loads
2. **Side Panel Content**:
   - Rights grade (should be low due to arbitration clauses)
   - Readability grade (should show mixed scores)
   - Overall summary of the terms
   - Section-by-section summaries
   - Key excerpts highlighting important clauses
   - Uncommon legal terms with definitions
   - Dictionary terms frequency

**Key Test Clauses**:

- **High Risk**: Arbitration, class action waiver, unilateral changes
- **Medium Risk**: Jury trial waiver, vague consent
- **Positive**: Clear contact information, account responsibilities
- **Complex Language**: Legal jargon mixed with simple explanations

## Manual Testing Steps

### Setup

1. Build the extension: `npm run build`
2. Load unpacked extension from `dist/` folder in Chrome
3. Enable developer mode in extensions
4. Pin the extension to toolbar

### Test Execution

1. **Open Test Fixture**: Navigate to `docs/fixtures/sample-tos.html`
2. **Verify Detection**: Extension badge should appear (shows "!")
3. **Open Side Panel**: Click extension icon to open analysis panel
4. **Check Analysis Results**:
   - Rights assessment should show low grade due to arbitration clauses
   - Readability should show detailed scores from multiple algorithms
   - Summary should capture key points from all sections
   - Uncommon words list should include legal terms
   - Dictionary terms should show frequency counts

### Expected Results

- **No Console Errors**: Check DevTools for runtime errors
- **Responsive UI**: All sections should load within 5 seconds
- **Accurate Analysis**: Rights score should reflect the restrictive clauses
- **Complete Data**: All UI sections should be populated

## Troubleshooting

### Extension Not Detecting

- Check that the page contains sufficient legal terms
- Verify extension is enabled and has necessary permissions
- Check console for any loading errors

### Analysis Not Working

- Ensure all analysis modules are properly loaded
- Check for network errors if dictionary lookups fail
- Verify the text extraction is working correctly

### UI Not Loading

- Check that sidepanel HTML/CSS/JS are properly bundled
- Verify message passing between content script and sidepanel
- Look for JavaScript errors in sidepanel console

## Performance Benchmarks

- **Initial Load**: < 2 seconds
- **Text Analysis**: < 3 seconds
- **UI Render**: < 1 second
- **Memory Usage**: < 50MB

## Adding New Test Fixtures

When creating new test fixtures:

1. Include a mix of legal and non-legal content
2. Add various readability levels
3. Include both positive and negative rights clauses
4. Test edge cases (very short/long text, special characters)
5. Document expected results in fixture comments

## File Access Toggle Note

When testing locally, you may need to enable "Allow access to file URLs" in the extension settings for the fixture to work properly.
