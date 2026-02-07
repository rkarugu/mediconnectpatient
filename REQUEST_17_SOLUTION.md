# Service Request #17 - Lab Visibility Issue - SOLUTION

## Problem
Lab facility cannot see the lab request created for service request #17.

## Root Cause
The lab facility is likely not properly configured in the database. The `FacilityLabController` checks if a facility `isLab()` before allowing access, and the facility must meet these criteria:

1. `facility_type` = 'Laboratory' or 'Lab'
2. OR `has_lab` = 1 (true)
3. `status` = 'approved'
4. `is_active` = 1 (true)
5. `user_id` must be linked to a valid user

## Solution Steps

### Step 1: Identify the Lab Facility for Request #17

Run this SQL query to find which lab facility is assigned to request #17:

```sql
SELECT 
    ltr.id as lab_request_id,
    ltr.lab_facility_id,
    mf.facility_name,
    mf.facility_type,
    mf.has_lab,
    mf.status,
    mf.is_active,
    mf.user_id,
    mf.fcm_token
FROM lab_test_requests ltr
LEFT JOIN medical_facilities mf ON ltr.lab_facility_id = mf.id
WHERE ltr.service_request_id = 17;
```

**Note the `lab_facility_id` from the results** - you'll need it for the next steps.

### Step 2: Check Facility Configuration

Once you have the `lab_facility_id`, run this query to see what's wrong:

```sql
SELECT 
    id,
    facility_name,
    facility_type,
    has_lab,
    status,
    is_active,
    user_id,
    fcm_token
FROM medical_facilities
WHERE id = <lab_facility_id>;
```

### Step 3: Apply Fixes

Based on the results from Step 2, run the appropriate SQL commands:

#### If facility_type is not 'Laboratory' or 'Lab':
```sql
UPDATE medical_facilities 
SET facility_type = 'Laboratory', has_lab = 1 
WHERE id = <lab_facility_id>;
```

#### If status is not 'approved':
```sql
UPDATE medical_facilities 
SET status = 'approved' 
WHERE id = <lab_facility_id>;
```

#### If is_active is not 1:
```sql
UPDATE medical_facilities 
SET is_active = 1 
WHERE id = <lab_facility_id>;
```

#### If user_id is NULL:
First, find a user that should be linked to this facility:
```sql
SELECT id, email, name FROM users WHERE email LIKE '%facility%' LIMIT 5;
```

Then link the user:
```sql
UPDATE medical_facilities 
SET user_id = <user_id> 
WHERE id = <lab_facility_id>;
```

### Step 4: Clear Cache

After applying fixes, clear the Laravel cache:

```bash
php artisan cache:clear
php artisan config:clear
```

### Step 5: Verify the Fix

Test that the facility can now see the lab request:

1. Login to the facility account
2. Navigate to Lab Requests
3. You should see the lab request for service request #17

---

## Quick All-in-One Fix

If you want to fix everything at once (assuming facility_id is known), run this:

```sql
-- Replace <lab_facility_id> with the actual ID from Step 1
UPDATE medical_facilities 
SET 
    facility_type = 'Laboratory',
    has_lab = 1,
    status = 'approved',
    is_active = 1
WHERE id = <lab_facility_id>;
```

---

## What Was Fixed in Code

1. **Added `isLab()` method to MedicalFacility model**
   - File: `app/Models/MedicalFacility.php`
   - Checks if facility is configured as a lab
   - This was missing and causing "Facility not found or is not a lab" error

2. **Added FCM notification for lab requests**
   - File: `app/Http/Controllers/Api/MedicLabTestController.php`
   - Facility now receives push notification when lab request created

3. **Added event listener for lab result completion**
   - Files: `app/Events/LabResultCompleted.php`, `app/Listeners/ResumeServiceRequestFromOnHold.php`
   - Service request automatically resumes from "on_hold" when lab results ready

---

## Testing Checklist

After applying the fixes:

- [ ] Run Step 1 SQL query - confirm lab_facility_id
- [ ] Run Step 2 SQL query - check facility configuration
- [ ] Apply appropriate fixes from Step 3
- [ ] Run `php artisan cache:clear`
- [ ] Login as facility user
- [ ] Navigate to Lab Requests
- [ ] Confirm you can see the lab request for request #17
- [ ] Check facility receives FCM notification
- [ ] Verify lab request details are visible

---

## Troubleshooting

### Still can't see requests after fixes?

1. **Check if you're logged in as the correct facility user**
   - Verify `user_id` in medical_facilities matches your login user

2. **Check if lab request exists**
   ```sql
   SELECT COUNT(*) FROM lab_test_requests WHERE service_request_id = 17;
   ```

3. **Check browser cache**
   - Clear browser cache and cookies
   - Try incognito/private window

4. **Check logs**
   ```bash
   tail -f storage/logs/laravel.log | grep -i "lab\|facility"
   ```

---

## Next Steps After Lab Can See Requests

Once the lab facility can see requests:

1. **Facility processes lab request**
   - Dispatch collector
   - Mark sample collected
   - Start processing
   - Add results

2. **Lab results completed**
   - Event automatically dispatches
   - Service request resumes from "on_hold" to "in_progress"
   - Medic and patient notified

3. **Medic creates prescription**
   - Patient receives notification
   - Prescription visible in patient app

4. **Service marked complete**
   - Ready for payment

---

## Summary

The issue is that the lab facility is not properly configured in the database. By running the SQL queries and fixes above, the facility will be configured correctly and will be able to see all lab requests assigned to it.

**Key Points**:
- Facility must have `facility_type = 'Laboratory'` or `has_lab = 1`
- Facility must have `status = 'approved'`
- Facility must have `is_active = 1`
- Facility must have a valid `user_id` linked to a user account

Once these are set, the facility will immediately be able to see all lab requests.
