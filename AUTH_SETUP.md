# MediConnect Patient App - Authentication Setup Guide

This guide covers all three authentication methods: **Google Sign-In**, **Email/Password**, and **Phone Number (OTP)**.

---

## 🚀 Quick Start

1. **Copy the environment template:**
   ```bash
   copy .env.example .env
   ```

2. **Configure your authentication methods** (see sections below)

3. **Restart Expo:**
   ```bash
   npx expo start --clear
   ```

---

## 📧 Email/Password Authentication

Email/password authentication works out of the box with your Laravel backend. No additional configuration needed!

**Features:**
- Registration with email, phone, and password
- Login with email or phone number
- Password validation (min 8 chars, uppercase, lowercase, number)
- Input validation with real-time error messages

**Backend Requirements:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/phone and password

---

## 🔐 Google Sign-In Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: **MediConnect**
3. Enable **Google+ API** or **Google Identity Services**

### Step 2: Create OAuth 2.0 Credentials

#### A. For Android

1. In **Credentials** → **Create Credentials** → **OAuth client ID**
2. Application type: **Android**
3. Name: `MediConnect Patient Android`
4. Package name: `com.mediconnect.patient`
5. **SHA-1 certificate fingerprint:**
   
   **For Expo Go (Development):**
   ```
   90:C3:A6:09:1C:45:3A:B4:A7:7F:4E:06:3E:C0:F6:8D:3E:8C:24:65
   ```
   
   **For Production Build:**
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

6. Click **Create** and copy the **Client ID**

#### B. For iOS (Optional)

1. Create Credentials → OAuth client ID
2. Application type: **iOS**
3. Name: `MediConnect Patient iOS`
4. Bundle ID: `com.mediconnect.patient`
5. Click **Create** and copy the **Client ID**

#### C. For Web/Expo (Required for Expo Go)

1. Create Credentials → OAuth client ID
2. Application type: **Web application**
3. Name: `MediConnect Patient Expo`
4. Authorized redirect URIs:
   ```
   https://auth.expo.io/@YOUR_EXPO_USERNAME/mediconnect-patient-app
   ```
5. Click **Create** and copy the **Client ID**

### Step 3: Update .env File

```env
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

### Step 4: Test Google Sign-In

```bash
npx expo start --clear
```

**Backend Requirements:**
- `POST /api/auth/google` - Authenticate with Google ID token
- Payload: `{ id_token: "...", phone: "..." }`

---

## 📱 Phone Number (OTP) Authentication

Phone authentication uses **Firebase Authentication** for OTP verification.

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing: **MediConnect**
3. Add an Android app:
   - Package name: `com.mediconnect.patient`
   - Download `google-services.json` (not needed for Expo managed workflow)

### Step 2: Enable Phone Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Phone** authentication
3. Add your test phone numbers (optional for development)

### Step 3: Get Firebase Configuration

1. In Firebase Console → **Project Settings** → **General**
2. Scroll to **Your apps** section
3. Copy the Firebase configuration values

### Step 4: Update .env File

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### Step 5: Test Phone Authentication

```bash
npx expo start --clear
```

**Backend Requirements:**
- `POST /api/auth/phone` - Authenticate with Firebase token
- Payload: `{ phone: "+254...", firebase_token: "..." }`

---

## 🎨 UI/UX Features

### Enhanced Features
- ✅ **Modern UI** with clean design and smooth animations
- ✅ **Real-time validation** with inline error messages
- ✅ **Password strength** requirements display
- ✅ **Show/hide password** toggle
- ✅ **Phone number formatting** for Kenyan numbers
- ✅ **OTP countdown timer** with resend option
- ✅ **Loading states** with activity indicators
- ✅ **Keyboard handling** with KeyboardAvoidingView
- ✅ **Safe area support** for notched devices

### Authentication Flows

#### 1. Google Sign-In Flow
1. User taps "Continue with Google"
2. Google authentication popup
3. If phone number is missing → redirect to phone input screen
4. Auto-login and navigate to main app

#### 2. Email/Password Flow
1. User enters email/phone and password
2. Real-time validation
3. Auto-login on success

#### 3. Phone OTP Flow
1. User enters phone number
2. Receive 6-digit OTP via SMS
3. Enter OTP code
4. Verify and auto-login

#### 4. Registration Flow
1. User fills in all required fields
2. Real-time validation for each field
3. Password strength requirements shown
4. Auto-login after successful registration

---

## 🐛 Troubleshooting

### Google Sign-In Issues

**"Invalid token" error:**
- Verify you're using the correct Client IDs
- For Expo Go, use the Web Client ID
- Check redirect URI matches your Expo username

**"Missing Google client IDs" warning:**
- Ensure `.env` file exists and has values
- Restart Expo with `--clear` flag
- Variables must start with `EXPO_PUBLIC_`

### Phone Authentication Issues

**"Firebase not configured" error:**
- Check all Firebase env variables are set
- Verify Firebase project has Phone auth enabled
- Restart Expo after adding env variables

**"Failed to send OTP":**
- Ensure phone number format is correct (+254...)
- Check Firebase quotas and billing
- Verify reCAPTCHA is working (invisible mode)

**"Invalid OTP":**
- OTP expires after 5 minutes
- Use resend button if OTP expired
- Check for SMS delivery issues

### General Issues

**Environment variables not loading:**
```bash
# Clear cache and restart
npx expo start --clear
```

**Navigation errors:**
- Ensure all screens are imported in App.tsx
- Check navigation names match exactly

---

## 📱 Testing

### Test Accounts

**Email/Password:**
- Create a new account through the register screen
- Or use existing test accounts in your backend

**Google:**
- Use any Google account
- First-time users will need to provide phone number

**Phone (Development):**
- Add test numbers in Firebase Console → Authentication → Sign-in method → Phone
- Test numbers don't require actual SMS

### Production Testing

1. Build the app:
   ```bash
   eas build --platform android --profile preview
   ```

2. Get production SHA-1:
   ```bash
   eas credentials
   ```

3. Add production SHA-1 to Google Cloud Console

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** - it's in `.gitignore`
2. **Use Firebase App Check** in production (prevents abuse)
3. **Implement rate limiting** on backend auth endpoints
4. **Validate tokens server-side** - never trust client validation alone
5. **Use secure storage** - auth tokens stored in SecureStore
6. **Enable 2FA** for sensitive operations (future enhancement)

---

## 📦 Dependencies

The following packages are used for authentication:

```json
{
  "expo-auth-session": "~7.0.10",
  "expo-web-browser": "~15.0.10",
  "firebase": "^10.4.0",
  "expo-secure-store": "~15.0.8",
  "axios": "^1.6.5"
}
```

All dependencies are already installed!

---

## 🚀 Backend Integration

### Required Laravel Routes

```php
// Email/Password
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout

// Google Sign-In
POST /api/auth/google

// Phone Authentication
POST /api/auth/phone

// Password Reset
POST /api/auth/forgot-password
POST /api/auth/reset-password

// User Info
GET /api/auth/me
```

### Response Format

All auth endpoints should return:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+254712345678"
    },
    "token": "your_auth_token_here"
  }
}
```

---

## 📝 Notes

- Phone numbers are formatted for Kenya (+254)
- Google Sign-In requires phone number for new users
- Password must meet strength requirements
- All auth tokens are stored securely in SecureStore
- Auto-login after successful registration

---

## 💬 Support

If you encounter issues:
1. Check this guide thoroughly
2. Review console logs in Expo
3. Verify backend is running and accessible
4. Test API endpoints directly (Postman/Insomnia)

---

**Happy Coding! 🎉**