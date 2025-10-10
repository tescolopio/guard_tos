# Alpha Testing Quick Start Guide

## 🚀 Ready to Test? Follow These Steps

### Step 1: Load Extension in Chrome

1. **Open Chrome Extensions Page**
   ```
   chrome://extensions/
   ```
   
2. **Enable Developer Mode**
   - Toggle the switch in the top-right corner

3. **Load Unpacked Extension**
   - Click "Load unpacked" button
   - Navigate to: `/mnt/d/guard_tos/dist`
   - Click "Select Folder"

4. **Verify Extension Loaded**
   - ✅ Extension card appears with "Terms Guardian" name
   - ✅ Icon visible in Chrome toolbar
   - ✅ No error messages in red

### Step 2: Quick Smoke Test

**Test 1: Extension Icon**
- Click the Terms Guardian icon in toolbar
- Side panel should open on the right
- Should show welcome/empty state

**Test 2: Visit ToS Page**
- Navigate to: https://www.google.com/intl/en/policies/terms/
- Extension should detect ToS content
- Should offer to analyze

**Test 3: Run Analysis**
- Click "Analyze" button
- Wait for analysis to complete (should be < 5 seconds)
- Review results displayed

### Step 3: Check Console for Errors

1. **Open Chrome DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

2. **Check Console Tab**
   - Look for errors (red text)
   - Note any warnings (yellow text)
   - Look for Terms Guardian log messages

3. **Inspect Service Worker**
   - Go to `chrome://extensions/`
   - Find Terms Guardian
   - Click "service worker" link (blue text)
   - New DevTools window opens - check console

### Step 4: Test on Multiple Sites

Visit each of these and trigger analysis:

**Quick Tests (5 minutes):**
1. https://www.google.com/intl/en/policies/terms/
2. https://www.facebook.com/legal/terms
3. https://twitter.com/en/tos
4. https://www.amazon.com/gp/help/customer/display.html?nodeId=508088
5. https://www.microsoft.com/en-us/servicesagreement

**Extended Tests (15 minutes):**
6. https://github.com/site/terms
7. https://www.spotify.com/us/legal/end-user-agreement/
8. https://help.netflix.com/legal/termsofuse
9. https://www.paypal.com/us/webapps/mpp/ua/useragreement-full
10. https://www.linkedin.com/legal/user-agreement

### Step 5: Document Findings

For each test, note:
- ✅ **Success**: Analysis completed, results look good
- ⚠️ **Warning**: Works but with issues (slow, minor errors)
- ❌ **Failure**: Crash, major error, no results

**Quick Notes Template:**
```
Site: [URL]
Status: ✅ / ⚠️ / ❌
Time: [seconds to complete]
Issues: [any problems observed]
Notes: [additional observations]
```

---

## 🐛 Common Issues & Solutions

### Issue: Extension won't load
**Solution:** 
- Check manifest.json syntax
- Verify all required files exist in dist/
- Look for errors in extension page

### Issue: Side panel won't open
**Solution:**
- Check if side panel permission is granted
- Inspect service worker console for errors
- Try reloading extension

### Issue: Analysis doesn't start
**Solution:**
- Check if page actually has ToS content
- Open console, look for detection messages
- Try using context menu (right-click) as backup

### Issue: Analysis fails/crashes
**Solution:**
- Check if model files are accessible
- Look for out-of-memory errors
- Try shorter/simpler ToS page

---

## 📊 Performance Checklist

- [ ] Analysis completes in < 5 seconds
- [ ] Memory usage < 150MB (check Chrome Task Manager)
- [ ] No memory leaks after multiple analyses
- [ ] Works on long documents (10,000+ words)
- [ ] Works on short documents (500 words)
- [ ] Multiple tabs can analyze simultaneously

---

## 🎯 Success Criteria for Alpha

**Must Have (Go/No-Go):**
- [ ] Extension loads without errors
- [ ] Analysis works on at least 8/10 test sites
- [ ] No crashes or hangs
- [ ] Results are displayed correctly
- [ ] Model predictions seem reasonable

**Nice to Have:**
- [ ] Fast analysis (< 3 seconds)
- [ ] Beautiful UI/UX
- [ ] Helpful summaries
- [ ] Accurate clause detection

---

## 🚦 Decision Points

**🟢 GREEN LIGHT (Proceed to Closed Alpha)**
- All "Must Have" items passing
- < 3 critical bugs
- Positive initial impressions

**🟡 YELLOW LIGHT (Fix & Retest)**
- Some "Must Have" items failing
- 3-5 critical bugs found
- Performance concerns

**🔴 RED LIGHT (Major Rework Needed)**
- Multiple "Must Have" items failing
- > 5 critical bugs
- Model accuracy unacceptable
- Fundamental design issues

---

## 📝 Next Steps After Initial Test

### If Green Light:
1. Document test results
2. Create alpha tester signup form
3. Package extension for distribution
4. Schedule Week 2 closed alpha kickoff

### If Yellow/Red Light:
1. Create prioritized bug list
2. Fix critical issues
3. Retest thoroughly
4. Repeat alpha test when ready

---

## 💬 Questions or Issues?

- **Technical questions**: Check docs/ directory
- **Bug reports**: Create GitHub Issue
- **Quick help**: [Your contact info]

---

**Ready? Let's test! 🧪**

Start with Step 1 above and work through the checklist.
