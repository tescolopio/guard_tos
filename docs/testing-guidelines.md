# Testing Guidelines for Terms Guardian

## Always Use Timeouts

**CRITICAL**: Always include timeouts when running testing commands to prevent hanging tests.

### Playwright Testing Commands

Always use the `timeout` command when running Playwright tests:

```bash
# Correct - with timeout
timeout 120s npx playwright test [test-file] --headed

# Incorrect - can hang indefinitely
npx playwright test [test-file] --headed
```

### Recommended Timeouts

- **Playwright tests**: 120 seconds (2 minutes)
- **Jest tests**: 60 seconds (1 minute)
- **Build commands**: 300 seconds (5 minutes)

### Example Commands

```bash
# Run all Playwright tests with timeout
timeout 120s npx playwright test

# Run specific test file with timeout
timeout 120s npx playwright test extension-initialization.spec.js --headed

# Run Jest tests with timeout
timeout 60s npm test

# Build with timeout
timeout 300s npm run build
```

### Why Timeouts Are Important

1. **Prevent CI/CD pipeline hanging**
2. **Provide clear failure feedback**
3. **Allow for debugging and iteration**
4. **Ensure test reliability**

### If Tests Time Out

1. Check if the issue is environmental (browser, extensions, permissions)
2. Verify all test setup is correct (extension built, paths correct)
3. Look for specific error messages in the timeout output
4. Consider if the timeout duration is appropriate for the test complexity

