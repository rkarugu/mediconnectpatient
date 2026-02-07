# Lab Request Visibility - Debugging Guide

## Issue
Lab facility cannot see lab requests that have been created.

## Root Causes to Check

### 1. Missing `isLab()` Method (FIXED)
**Status**: ✅ FIXED
- Added `isLab()` method to `MedicalFacility` model
- Checks if `facility_type === 'Laboratory'` or `facility_type === 'Lab'` or `has_lab === true`

### 2. Facility Configuration Issues

#### Check if Facility is Configured as Lab
```sql
-- Check facility type and lab status
SELECT id, facility_name, facility_type, has_lab, status, is_active, fcm_token 
FROM medical_facilities 
WHERE id = <your_facility_id>;
```

**Expected Results**:
- `facility_type` should be 'Laboratory' or 'Lab'
- OR `has_lab` should be 1 (true)
- `status` should be 'approved'
- `is_active` should be 1 (true)
- `fcm_token` should have a value (for notifications)

#### If facility_type is wrong, update it:
```sql
UPDATE medical_facilities 
SET facility_type = 'Laboratory', has_lab = 1 
WHERE id = <your_facility_id>;
```

---

### 3. Lab Request Creation Issues

#### Check if Lab Requests Exist
```sql
-- Check all lab requests for a facility
SELECT id, service_request_id, lab_facility_id, status, created_at 
FROM lab_test_requests 
WHERE lab_facility_id = <your_facility_id>;
```

**Expected Results**:
- Should show lab requests assigned to this facility
- `status` should be 'pending', 'assigned', or other active statuses
- `lab_facility_id` should match your facility ID

#### If no lab requests exist:
1. Create a service request
2. Medic orders lab tests
3. Check if lab request is created with correct `lab_facility_id`

---

### 4. User Authentication Issues

#### Check if Facility User is Authenticated Correctly
```sql
-- Check facility user relationship
SELECT mf.id, mf.facility_name, mf.user_id, u.id, u.email, u.name 
FROM medical_facilities mf 
JOIN users u ON mf.user_id = u.id 
WHERE mf.id = <your_facility_id>;
```

**Expected Results**:
- `user_id` should be set
- User should exist in `users` table
- User should have correct email/credentials

#### If user_id is NULL:
```sql
UPDATE medical_facilities 
SET user_id = <correct_user_id> 
WHERE id = <your_facility_id>;
```

---

### 5. API Endpoint Issues

#### Test the Lab Requests Endpoint
```bash
# Get lab requests for facility
curl -X GET "http://10.210.19.13:8000/api/facility/lab/requests" \
  -H "Authorization: Bearer <facility_token>" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "pending",
      "is_urgent": false,
      "patient": {...},
      "medic": {...},
      "tests": [...],
      "collection_address": "...",
      "total_amount": 0,
      "created_at": "..."
    }
  ],
  "pagination": {...}
}
```

**If Error**: Check error message
- "Facility not found or is not a lab" → Facility type issue
- "Unauthorized" → Authentication issue
- Empty data → No lab requests assigned

---

## Step-by-Step Debugging

### Step 1: Verify Facility Configuration
```bash
# SSH into server and run
mysql -u root -p mediconnect

# Check facility
SELECT id, facility_name, facility_type, has_lab, status, is_active 
FROM medical_facilities 
WHERE facility_name LIKE '%<your_lab_name>%';
```

### Step 2: Verify Lab Request Exists
```bash
# Check if lab request was created
SELECT id, lab_facility_id, status, created_at 
FROM lab_test_requests 
WHERE lab_facility_id = <facility_id> 
ORDER BY created_at DESC 
LIMIT 5;
```

### Step 3: Check Logs for Errors
```bash
# Check Laravel logs
tail -f storage/logs/laravel.log | grep -i "lab\|facility"

# Look for errors like:
# - "Facility not found"
# - "is not a lab"
# - Database errors
```

### Step 4: Test API Directly
```bash
# Get facility token first
curl -X POST "http://10.210.19.13:8000/api/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "facility@email.com",
    "password": "password"
  }'

# Then get lab requests
curl -X GET "http://10.210.19.13:8000/api/facility/lab/requests" \
  -H "Authorization: Bearer <token>"
```

---

## Common Issues & Solutions

### Issue 1: "Facility not found or is not a lab"

**Cause**: 
- Facility type is not set to 'Laboratory'
- `has_lab` is not set to true
- User is not authenticated

**Solution**:
```sql
-- Update facility type
UPDATE medical_facilities 
SET facility_type = 'Laboratory', has_lab = 1 
WHERE id = <facility_id>;

-- Verify
SELECT facility_type, has_lab FROM medical_facilities WHERE id = <facility_id>;
```

---

### Issue 2: Lab Requests Not Showing

**Cause**:
- Lab requests not created with correct `lab_facility_id`
- Lab requests have wrong status
- Facility ID mismatch

**Solution**:
```sql
-- Check what facility ID is being used
SELECT DISTINCT lab_facility_id FROM lab_test_requests;

-- Check if requests exist for your facility
SELECT COUNT(*) FROM lab_test_requests WHERE lab_facility_id = <your_facility_id>;

-- If count is 0, lab requests not being assigned to this facility
```

---

### Issue 3: Facility Can't Login

**Cause**:
- Wrong credentials
- User not linked to facility
- User account disabled

**Solution**:
```sql
-- Check facility user
SELECT mf.id, mf.facility_name, mf.user_id, u.email, u.status 
FROM medical_facilities mf 
LEFT JOIN users u ON mf.user_id = u.id 
WHERE mf.id = <facility_id>;

-- If user_id is NULL, link user
UPDATE medical_facilities 
SET user_id = <user_id> 
WHERE id = <facility_id>;
```

---

## Verification Checklist

- [ ] Facility `facility_type` is 'Laboratory' or 'Lab'
- [ ] Facility `has_lab` is 1 (true)
- [ ] Facility `status` is 'approved'
- [ ] Facility `is_active` is 1 (true)
- [ ] Facility `user_id` is set and valid
- [ ] User exists and can authenticate
- [ ] Lab requests exist in database
- [ ] Lab requests have correct `lab_facility_id`
- [ ] Lab requests have active status (not completed/cancelled)
- [ ] FCM token is set (for notifications)
- [ ] API endpoint returns lab requests
- [ ] Facility can see requests in UI

---

## Quick Fix Commands

### If Facility Type is Wrong
```sql
UPDATE medical_facilities 
SET facility_type = 'Laboratory', has_lab = 1 
WHERE id = <facility_id>;
```

### If User is Not Linked
```sql
UPDATE medical_facilities 
SET user_id = <user_id> 
WHERE id = <facility_id>;
```

### If Status is Not Approved
```sql
UPDATE medical_facilities 
SET status = 'approved', is_active = 1 
WHERE id = <facility_id>;
```

### If FCM Token is Missing
```sql
UPDATE medical_facilities 
SET fcm_token = '<valid_fcm_token>' 
WHERE id = <facility_id>;
```

---

## Testing After Fix

### 1. Create a New Lab Request
- Patient creates service request
- Medic accepts request
- Medic orders lab tests
- Check if lab request appears in facility dashboard

### 2. Check Notifications
- Facility should receive FCM notification
- Notification should appear on device
- Check logs for "FCM notification sent to facility"

### 3. Verify Lab Can See Request
- Login as facility
- Navigate to lab requests
- Should see newly created request
- Should be able to view details

---

## Database Schema Reference

### medical_facilities table
```sql
- id (INT)
- user_id (INT) - Links to users table
- facility_name (VARCHAR)
- facility_type (VARCHAR) - Should be 'Laboratory' or 'Lab'
- has_lab (BOOLEAN) - Should be 1 for labs
- status (VARCHAR) - Should be 'approved'
- is_active (BOOLEAN) - Should be 1
- fcm_token (VARCHAR) - For push notifications
```

### lab_test_requests table
```sql
- id (INT)
- service_request_id (INT)
- lab_facility_id (INT) - Links to medical_facilities
- status (VARCHAR) - pending, assigned, collector_dispatched, etc.
- created_at (TIMESTAMP)
```

---

## Next Steps

1. **Run the verification checklist** above
2. **Check database** for facility configuration
3. **Apply quick fixes** if needed
4. **Test the flow** end-to-end
5. **Monitor logs** for errors

If issues persist after these steps, provide:
- Facility ID
- Error messages from logs
- Database query results
