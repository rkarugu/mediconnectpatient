# MediConnect Patient App - Authentication System Guide

## Overview

The patient app now features a comprehensive, robust authentication system supporting:
- **Email/Phone + Password** registration and login
- **Google OAuth** sign-in with phone number completion
- **Password reset** via email
- **Real-time validation** with helpful error messages
- **Secure token storage** using Expo Secure Store

## Features

### 1. Login Screen (`LoginScreen.tsx`)

**Supported Login Methods:**
- Email address + password
- Phone number + password
- Google OAuth (if configured)

**Features:**
- Real-time validation of email/phone format
- Password visibility toggle
- "Forgot Password?" link
- Google sign-in button (conditional on configuration)
- Clear error messages for each field
- Keyboard-aware layout for better UX

**Validation Rules:**
- Email: Must be valid email format
- Phone: Must be at least 10 digits
- Password: Minimum 6 characters

### 2. Registration Screen (`RegisterScreen.tsx`)

**Required Fields:**
- First Name (2-50 characters, letters/spaces/hyphens/apostrophes only)
- Last Name (2-50 characters, letters/spaces/hyphens/apostrophes only)
- Email (valid email format)
- Phone Number (at least 10 digits)
- Password (8+ characters with uppercase, lowercase, and numbers)
- Confirm Password (must match password)

**Features:**
- Comprehensive field-by-field validation
- Password strength requirements displayed
- Password visibility toggles for both fields
- Detects duplicate email/phone and shows helpful messages
- Real-time error clearing as user types
- Keyboard-aware scrolling

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

### 3. Google Phone Screen (`GooglePhoneScreen.tsx`)

**Purpose:** Collects phone number when using Google OAuth

**Features:**
- Displays email being used for Google sign-in
- Phone number validation (10+ digits)
- Real-time validation feedback
- Clear visual progress indicator
- Seamless integration with Google OAuth flow

### 4. Forgot Password Screen (`ForgotPasswordScreen.tsx`)

**Purpose:** Initiates password reset process

**Features:**
- Email address input with validation
- Sends reset link to user's email
- Success confirmation screen
- Link back to login

### 5. Reset Password Screen (`ResetPasswordScreen.tsx`)

**Purpose:** Allows user to set new password

**Features:**
- Validates reset token and email
- New password input with visibility toggle
- Confirm password field
- Password strength requirements
- Success confirmation before redirect to login

## Validation Utilities

### `src/utils/validation.ts`

Core validation functions:

```typescript
// Email validation
validateEmail(email: string): { valid: boolean; error?: string }

// Phone validation (10+ digits)
validatePhone(phone: string): { valid: boolean; error?: string }

// Password validation (8+ chars, uppercase, lowercase, numbers)
validatePassword(password: string): { valid: boolean; error?: string }

// Name validation (2-50 chars, letters/spaces/hyphens/apostrophes)
validateName(name: string, fieldName?: string): { valid: boolean; error?: string }

// Password match validation
validatePasswordMatch(password: string, confirmation: string): { valid: boolean; error?: string }

// Detect identifier type
isEmailOrPhone(identifier: string): 'email' | 'phone' | 'invalid'

// Format phone number
formatPhoneNumber(phone: string): string

// Get phone country code
getPhoneCountryCode(phone: string): string
```

### `src/utils/authHelpers.ts`

Error handling and helper functions:

```typescript
// Parse API errors into consistent format
parseAuthError(error: any): AuthError

// Format error messages for display
formatErrorMessage(error: AuthError): string

// Error type detection
isPhoneRequiredError(error: any): boolean
isEmailAlreadyExistsError(error: any): boolean
isPhoneAlreadyExistsError(error: any): boolean

// Get identifier type
getIdentifierType(identifier: string): 'email' | 'phone' | null

// Check if phone screen should be shown
shouldShowPhoneScreen(error: any): boolean
```

## Authentication Flow

### Standard Registration Flow

```
RegisterScreen
    ↓
[Validate all fields]
    ↓
[POST /auth/register]
    ↓
Success → Store token & user → Navigate to Main
    ↓
Error → Show field-specific errors or alert
```

### Standard Login Flow

```
LoginScreen
    ↓
[Validate email/phone and password]
    ↓
[POST /auth/login]
    ↓
Success → Store token & user → Navigate to Main
    ↓
Error → Show error alert
```

### Google OAuth Flow

```
LoginScreen (Google button)
    ↓
[Google Sign-In]
    ↓
[POST /auth/google with idToken]
    ↓
Phone Required? → GooglePhoneScreen → [POST /auth/google with idToken + phone]
    ↓
Success → Store token & user → Navigate to Main
    ↓
Error → Show error alert
```

### Password Reset Flow

```
LoginScreen (Forgot Password link)
    ↓
ForgotPasswordScreen
    ↓
[Enter email]
    ↓
[POST /auth/forgot-password]
    ↓
Success → Show confirmation → Redirect to Login
    ↓
User clicks email link → ResetPasswordScreen
    ↓
[Enter new password]
    ↓
[POST /auth/reset-password]
    ↓
Success → Redirect to Login
```

## API Endpoints

### Authentication Endpoints

**POST /auth/register**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123",
  "password_confirmation": "SecurePass123",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "emergency_contact_name": "Jane Doe"
}
```

Response:
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**POST /auth/login**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Or with phone:
```json
{
  "phone": "+1234567890",
  "password": "SecurePass123"
}
```

**POST /auth/google**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "phone": "+1234567890"
}
```

**POST /auth/forgot-password**
```json
{
  "email": "john@example.com"
}
```

**POST /auth/reset-password**
```json
{
  "email": "john@example.com",
  "password": "NewSecurePass123",
  "token": "reset_token_from_email"
}
```

**POST /auth/logout**
- Clears authentication token

**GET /auth/me**
- Returns current authenticated user

## State Management

### Auth Store (`src/store/authStore.ts`)

Uses Zustand with persistent storage:

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}
```

**Usage:**
```typescript
const { user, token, isAuthenticated, setAuth, logout, loadAuth } = useAuthStore();
```

## Error Handling

### Error Types

1. **Validation Errors** - Field-specific validation failures
   - Shown inline below each field
   - Cleared when user starts typing

2. **Duplicate Account Errors** - Email/phone already registered
   - Shown as field error with helpful message
   - Suggests logging in instead

3. **Phone Required Error** - Google OAuth without phone
   - Redirects to GooglePhoneScreen
   - Allows user to provide phone number

4. **API Errors** - Server-side errors
   - Shown in Alert dialog
   - Parsed and formatted for user-friendly display

### Error Messages

Common error messages:

| Error | Message |
|-------|---------|
| Empty email | "Email is required" |
| Invalid email | "Please enter a valid email address" |
| Empty phone | "Phone number is required" |
| Invalid phone | "Phone number must be at least 10 digits" |
| Weak password | "Password must contain uppercase, lowercase, and numbers" |
| Password mismatch | "Passwords do not match" |
| Duplicate email | "This email is already registered. Please login or use a different email." |
| Duplicate phone | "This phone number is already registered. Please login or use a different number." |

## Google OAuth Setup

### Prerequisites

1. Google Cloud Console project created
2. OAuth 2.0 credentials configured for:
   - Android (with SHA-1 fingerprint)
   - iOS (with Bundle ID)
   - Web (with redirect URIs)

### Environment Variables

```env
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
```

### Configuration File

See `GOOGLE_SIGNIN_SETUP.md` for detailed setup instructions.

## Security Features

1. **Secure Token Storage**
   - Uses Expo Secure Store (encrypted)
   - Tokens never stored in plain text

2. **Password Security**
   - Passwords hashed on backend (Laravel Sanctum)
   - Minimum 8 characters with complexity requirements
   - Visibility toggle for better UX without compromising security

3. **API Security**
   - Bearer token authentication
   - HTTPS only (in production)
   - CORS protection

4. **Session Management**
   - Automatic token refresh (handled by backend)
   - 401 response triggers logout
   - Persistent login across app restarts

## Testing

### Manual Testing Checklist

**Registration:**
- [ ] All fields required validation
- [ ] Email format validation
- [ ] Phone format validation (10+ digits)
- [ ] Password strength validation
- [ ] Password match validation
- [ ] Duplicate email detection
- [ ] Duplicate phone detection
- [ ] Successful registration redirects to Main

**Login:**
- [ ] Email/phone required validation
- [ ] Password required validation
- [ ] Invalid credentials error
- [ ] Successful login redirects to Main
- [ ] Login persists across app restart

**Google OAuth:**
- [ ] Google sign-in opens Google dialog
- [ ] Phone required redirects to GooglePhoneScreen
- [ ] Phone validation on GooglePhoneScreen
- [ ] Successful Google sign-in redirects to Main

**Password Reset:**
- [ ] Forgot Password link navigates correctly
- [ ] Email validation on ForgotPasswordScreen
- [ ] Reset email sent successfully
- [ ] Reset link opens ResetPasswordScreen
- [ ] Password validation on ResetPasswordScreen
- [ ] Successful reset redirects to Login

## Troubleshooting

### Issue: "Google not configured"
**Solution:** Ensure all required Google client IDs are set in `.env` file and restart Expo with `npx expo start --clear`

### Issue: "Phone number required" after Google sign-in
**Expected behavior:** This is normal. User needs to provide phone number to complete registration.

### Issue: Validation errors not clearing
**Solution:** Errors clear automatically when user starts typing. If not, check that `onChangeText` handler is updating state correctly.

### Issue: Token not persisting
**Solution:** Check that `setAuth()` is called with valid user and token objects. Verify Secure Store is working on device.

### Issue: Password reset email not received
**Solution:** Check spam folder. Verify email address is correct. Check backend email configuration.

## Future Enhancements

- [ ] Biometric authentication (fingerprint/face)
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Apple, Facebook)
- [ ] Account recovery with security questions
- [ ] Session timeout warning
- [ ] Login activity history
- [ ] Device management (logout from other devices)
