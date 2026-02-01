# Google Sign-In Setup Guide for MediConnect Patient App

## Quick Setup (Recommended for Development)

For development/testing, you can use Expo's managed workflow which simplifies Google Sign-In.

### Step 1: Get Your Package Name
Your package name is: `com.mediconnect.patient` (or check in `app.json`)

### Step 2: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: **MediConnect**
3. Enable **Google+ API** (or Google Identity Services)

### Step 3: Create OAuth 2.0 Client IDs

#### A. For Android (Development & Production)

1. In Google Cloud Console → **Credentials** → **Create Credentials** → **OAuth client ID**
2. Application type: **Android**
3. Name: `MediConnect Patient Android`
4. Package name: `com.mediconnect.patient`
5. **SHA-1 certificate fingerprint:**

   **For Development (Expo Go):**
   - Use Expo's default debug certificate SHA-1:
   ```
   90:C3:A6:09:1C:45:3A:B4:A7:7F:4E:06:3E:C0:F6:8D:3E:8C:24:65
   ```

   **For Production Build:**
   - Run this command to get your SHA-1:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   - Or use: `eas credentials` after creating the build

6. Click **Create** and copy the **Client ID**

#### B. For iOS (Optional - if building for iOS)

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
   https://auth.expo.io/@rkarugu/mediconnect-patient-app
   ```
5. Click **Create** and copy the **Client ID**

### Step 4: Update .env File

Open `c:\laragon\www\mediconnect_patient_app\.env` and add:

```env
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

**Note:** For Expo Go development, use the Web Client ID for both `WEB` and `EXPO` fields.

### Step 5: Restart Expo

```bash
npx expo start --clear
```

## Testing Google Sign-In

1. Open the app in Expo Go
2. Click "Continue with Google"
3. Select your Google account
4. If prompted for phone number, enter it
5. You should be logged in!

## Troubleshooting

### "Google Sign In Failed - Invalid token"
- Make sure you're using the correct Client IDs
- For Expo Go, use the **Web Client ID**
- Verify redirect URI matches your Expo username

### "Missing Google client IDs"
- Check that `.env` file has the client IDs
- Restart Expo with `--clear` flag
- Make sure env variables start with `EXPO_PUBLIC_`

### "Phone number required"
- This is expected for new Google users
- Enter phone number when prompted
- This creates a complete patient account

## Production Build

For production builds (not Expo Go):

1. Run `eas build --platform android`
2. Get the production SHA-1 from `eas credentials`
3. Add the production SHA-1 to your Android OAuth client in Google Cloud Console
4. Use the Android Client ID in your app

## Backend Configuration

The backend is already configured to accept Google Sign-In at:
- Endpoint: `POST /api/auth/google`
- Payload: `{ id_token: "...", phone: "..." }`

No additional backend setup needed!
