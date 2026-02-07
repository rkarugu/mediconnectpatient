# Authentication System - Quick Reference

## What's New

A complete, production-ready authentication system has been implemented for the MediConnect Patient App with:

### ✅ Authentication Methods
- **Email/Phone + Password** - Traditional registration and login
- **Google OAuth** - One-tap sign-in with phone number completion
- **Password Reset** - Email-based password recovery

### ✅ Enhanced Screens

| Screen | Purpose | Key Features |
|--------|---------|--------------|
| **LoginScreen** | User login | Email/phone input, password toggle, Google OAuth, forgot password link |
| **RegisterScreen** | New account creation | All required fields, real-time validation, password strength indicator |
| **GooglePhoneScreen** | Complete Google signup | Phone number collection, visual progress |
| **ForgotPasswordScreen** | Password recovery | Email input, reset link delivery |
| **ResetPasswordScreen** | New password setup | Password validation, confirmation |

### ✅ Validation Features

**Real-time validation** for:
- Email format (RFC 5322 compliant)
- Phone numbers (10+ digits)
- Password strength (8+ chars, uppercase, lowercase, numbers)
- Name format (letters, spaces, hyphens, apostrophes)
- Password confirmation match

**Error handling:**
- Field-level error messages
- Duplicate account detection
- API error parsing and formatting
- User-friendly error messages

### ✅ Security

- Secure token storage (Expo Secure Store - encrypted)
- Password visibility toggles
- Bearer token authentication
- Automatic logout on 401
- Session persistence

## File Structure

```
src/
├── screens/
│   ├── LoginScreen.tsx              (Enhanced login)
│   ├── RegisterScreen.tsx           (Enhanced registration)
│   ├── GooglePhoneScreen.tsx        (Enhanced Google phone)
│   ├── ForgotPasswordScreen.tsx     (NEW - Password recovery)
│   └── ResetPasswordScreen.tsx      (NEW - Password reset)
├── utils/
│   ├── validation.ts                (Validation functions)
│   └── authHelpers.ts               (Error parsing & helpers)
├── services/
│   └── authService.ts               (API calls - already existed)
├── store/
│   └── authStore.ts                 (Zustand auth state)
└── config/
    └── api.ts                       (Axios instance)
```

## Usage Examples

### Login with Email/Phone
```typescript
const response = await authService.login({
  identifier: 'user@example.com', // or '+1234567890'
  password: 'SecurePass123'
});
```

### Register New Account
```typescript
const response = await authService.register({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  password: 'SecurePass123',
  passwordConfirmation: 'SecurePass123'
});
```

### Google OAuth
```typescript
const response = await authService.googleLogin({
  idToken: 'google_id_token_here',
  phone: '+1234567890' // optional, required if backend returns PHONE_REQUIRED
});
```

### Validation
```typescript
import { validateEmail, validatePhone, validatePassword } from '../utils/validation';

const emailCheck = validateEmail('user@example.com');
if (!emailCheck.valid) {
  console.error(emailCheck.error);
}

const phoneCheck = validatePhone('+1234567890');
if (!phoneCheck.valid) {
  console.error(phoneCheck.error);
}

const passwordCheck = validatePassword('SecurePass123');
if (!passwordCheck.valid) {
  console.error(passwordCheck.error);
}
```

### Error Handling
```typescript
import { parseAuthError, formatErrorMessage } from '../utils/authHelpers';

try {
  await authService.register(formData);
} catch (error) {
  const authError = parseAuthError(error);
  const message = formatErrorMessage(authError);
  Alert.alert('Error', message);
}
```

## Navigation Routes

**Auth Stack (when not authenticated):**
- `Login` - Main login screen
- `Register` - Registration screen
- `GooglePhone` - Google OAuth phone completion
- `ForgotPassword` - Password recovery
- `ResetPassword` - Password reset

**App Stack (when authenticated):**
- `Main` - Main app with tabs
- `Request` - Medical request screen
- `LiveTracking` - Live tracking
- `Payment` - Payment screen
- `Review` - Review screen
- `LabRequests` - Lab requests
- `LabResults` - Lab results
- `LabConsent` - Lab consent

## Key Validation Rules

### Email
- Must be valid email format
- Example: `user@example.com`

### Phone
- Minimum 10 digits
- Accepts: digits, spaces, hyphens, parentheses, plus sign
- Examples: `1234567890`, `(123) 456-7890`, `+1-234-567-8900`

### Password
- Minimum 8 characters
- Must contain uppercase letter (A-Z)
- Must contain lowercase letter (a-z)
- Must contain number (0-9)
- Example: `SecurePass123`

### Name
- Minimum 2 characters
- Maximum 50 characters
- Only letters, spaces, hyphens, apostrophes
- Examples: `John`, `Mary-Jane`, `O'Connor`

## API Endpoints Required

Backend must support these endpoints:

```
POST   /auth/register          - Create new account
POST   /auth/login             - Login with email/phone
POST   /auth/google            - Google OAuth login
POST   /auth/forgot-password   - Request password reset
POST   /auth/reset-password    - Reset password with token
POST   /auth/logout            - Logout
GET    /auth/me                - Get current user
```

## Environment Variables

```env
# Google OAuth (optional, but recommended)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_web_id.apps.googleusercontent.com

# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://your-api-url/api
EXPO_PUBLIC_SOCKET_URL=http://your-socket-url
```

## Testing Checklist

- [ ] Register with valid email and phone
- [ ] Register with duplicate email (should error)
- [ ] Register with duplicate phone (should error)
- [ ] Register with weak password (should error)
- [ ] Login with email
- [ ] Login with phone
- [ ] Login with invalid credentials (should error)
- [ ] Google sign-in (if configured)
- [ ] Google sign-in with phone requirement
- [ ] Forgot password flow
- [ ] Reset password with valid token
- [ ] Reset password with invalid token (should error)
- [ ] Login persists after app restart
- [ ] Logout clears token

## Customization

### Change Colors
Edit `src/constants/theme.ts`:
```typescript
export const COLORS = {
  primary: '#2B7BB9',        // Main brand color
  secondary: '#2ECC71',      // Secondary color
  error: '#E74C3C',          // Error color
  // ... more colors
};
```

### Change Validation Rules
Edit `src/utils/validation.ts`:
```typescript
export const ValidationRules = {
  password: {
    minLength: 8,            // Change minimum length
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,  // Change pattern
  },
  // ... more rules
};
```

### Add New Auth Method
1. Create new screen component
2. Add API method to `authService`
3. Add route to `App.tsx`
4. Handle navigation flow

## Common Issues & Solutions

**Issue:** Google sign-in not working
- **Solution:** Check Google client IDs in `.env`, restart Expo with `--clear`

**Issue:** Validation errors not clearing
- **Solution:** Errors auto-clear on input change. Check `onChangeText` handlers.

**Issue:** Token not persisting
- **Solution:** Verify `setAuth()` is called with valid user/token. Check Secure Store permissions.

**Issue:** Password reset email not received
- **Solution:** Check spam folder, verify email in backend, check email service configuration.

## Documentation Files

- **AUTHENTICATION_GUIDE.md** - Comprehensive authentication documentation
- **GOOGLE_SIGNIN_SETUP.md** - Google OAuth setup instructions
- **AUTH_QUICK_REFERENCE.md** - This file

## Next Steps

1. **Configure Google OAuth** (optional but recommended)
   - Follow `GOOGLE_SIGNIN_SETUP.md`
   - Add client IDs to `.env`

2. **Test All Flows**
   - Use testing checklist above
   - Test on both Android and iOS if possible

3. **Backend Integration**
   - Ensure all API endpoints are implemented
   - Verify error response formats match expected structure

4. **Customize Styling** (optional)
   - Update colors in `src/constants/theme.ts`
   - Adjust spacing/sizing as needed

5. **Deploy**
   - Build and test on physical devices
   - Monitor error logs in production
