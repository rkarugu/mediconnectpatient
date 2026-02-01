# MediConnect Patient App (React Native/Expo)

## Overview
Patient-facing mobile app for requesting medical services, tracking medics, payments, and telemedicine.

## Tech Stack
- **Framework:** React Native with Expo
- **Navigation:** React Navigation
- **State:** Zustand
- **HTTP Client:** Axios
- **Maps:** react-native-maps
- **Location:** Expo Location
- **Push:** Firebase Cloud Messaging
- **Payments:** M-Pesa via Laravel API
- **Realtime:** Socket.IO or polling
- **Video:** Agora SDK

## MVP Modules
1. Authentication (register/login/forgot password)
2. Home (Map + nearby medics)
3. Request a Medic
4. Live Medic Tracking
5. Payments (M-Pesa)
6. Reviews & Ratings
7. Profile & Settings
8. Telemedicine (Video Calls)

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- Laravel backend running on LAN

### Install & Run
```bash
npx create-expo-app . --template blank-typescript
npm install
npx expo start
```

### Environment Variables
Create `.env`:
```
EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:8000/api
```

## Development Notes
- Use `EXPO_PUBLIC_API_BASE_URL` to target your Laravel backend on LAN.
- Use Expo Go for testing on Android.
- For web builds, ensure CORS is configured in Laravel.

## Project Structure
```
/
├── src/
│   ├── config/
│   │   └── api.ts
│   ├── store/
│   │   └── authStore.ts
│   ├── services/
│   │   ├── authService.ts
│   │   └── api.ts
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   └── ...
│   └── navigation/
└── assets/
```

## API Integration
- Base URL: `AppConfig.baseUrl`
- Auth endpoints: `/auth/*`
- Protected routes: Bearer token via Axios interceptor
- Socket URL: `AppConfig.socketUrl` for real-time tracking.

## Build & Deploy
```bash
# Development
npx expo start

# Production Build
npx expo build:android
npx expo build:ios
```
