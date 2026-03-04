# Patient App Version Management

## Current Version
- **Version Name:** 1.0.2
- **Version Code:** 5
- **Last Updated:** March 4, 2026

## Version History

| Version Name | Version Code | Date | Changes |
|--------------|--------------|------|---------|
| 1.0.2 | 5 | Mar 4, 2026 | Production deployment with all fixes |
| 1.0.1 | 4 | Previous | (Already used in Play Store) |
| 0.1.1 | 4 | Previous | Initial testing version |

## Version Files to Update

When incrementing versions, update these files:

### 1. `android/app/build.gradle`
```gradle
defaultConfig {
    applicationId "com.mediconnect.patient"
    versionCode 5          // ← INCREMENT THIS (must be higher than previous)
    versionName "1.0.2"    // ← UPDATE THIS (semantic versioning)
}
```

### 2. `app.json`
```json
{
  "expo": {
    "version": "1.0.2"     // ← KEEP IN SYNC with versionName
  }
}
```

## Version Increment Rules

### Version Code (Integer)
- **MUST** increment by at least 1 for every Play Store upload
- Cannot reuse a version code that was previously uploaded
- Starts from 1, increments forever
- Example: 4 → 5 → 6 → 7...

### Version Name (String - Semantic Versioning)
Format: `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes (1.0.0 → 2.0.0)
- **MINOR:** New features, backward compatible (1.0.0 → 1.1.0)
- **PATCH:** Bug fixes, minor changes (1.0.0 → 1.0.1)

## Before Every Build

### Checklist
- [ ] Check current version in Play Console
- [ ] Increment `versionCode` in `build.gradle`
- [ ] Update `versionName` in `build.gradle`
- [ ] Update `version` in `app.json` to match
- [ ] Commit changes with version message
- [ ] Build AAB with new version

### Commands
```bash
# 1. Update versions in files (manually or script)
# 2. Commit changes
git add android/app/build.gradle app.json
git commit -m "chore: bump version to 1.0.X (versionCode Y)"
git push origin main

# 3. Build AAB
npx eas-cli build -p android --profile production
```

## Common Errors

### "Version code 4 has already been used"
**Cause:** Trying to upload an AAB with a version code that already exists in Play Console

**Solution:**
1. Open `android/app/build.gradle`
2. Increment `versionCode` (e.g., 4 → 5)
3. Update `versionName` (e.g., "1.0.1" → "1.0.2")
4. Rebuild AAB

### Version Mismatch Between Files
**Cause:** `app.json` version doesn't match `build.gradle` versionName

**Solution:** Keep them in sync:
- `app.json` → `"version": "1.0.2"`
- `build.gradle` → `versionName "1.0.2"`

## Automation Script (Future)

Create `scripts/bump-version.js`:
```javascript
// Auto-increment version code and update both files
// Usage: node scripts/bump-version.js patch|minor|major
```

## Play Store Release Tracks

### Internal Testing
- Use for QA and internal team testing
- Can use same version code multiple times
- Fast review process

### Closed Testing
- Beta testers
- Requires version code increment
- Feedback collection

### Production
- Public release
- **MUST** increment version code
- Cannot rollback version codes

## Best Practices

1. **Always increment version code** for Play Store uploads
2. **Use semantic versioning** for version names
3. **Keep files in sync** (app.json and build.gradle)
4. **Document changes** in release notes
5. **Test before production** using Internal Testing track
6. **Never reuse version codes** - they're permanent

## Next Version Planning

**For Next Build:**
- Version Code: 6
- Version Name: 1.0.3 (if patch) or 1.1.0 (if new features)

**Update these files:**
```bash
# android/app/build.gradle
versionCode 6
versionName "1.0.3"

# app.json
"version": "1.0.3"
```

---

**Remember:** Version codes are permanent in Play Store. Once uploaded, you cannot reuse that number. Always increment!
