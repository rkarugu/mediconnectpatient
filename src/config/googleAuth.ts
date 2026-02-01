import Constants from 'expo-constants';

type Env = Record<string, string | undefined>;

const env = ((globalThis as any)?.process?.env ?? {}) as Env;

export const GOOGLE_EXPO_CLIENT_ID = env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;
export const GOOGLE_IOS_CLIENT_ID = env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID = env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
export const GOOGLE_WEB_CLIENT_ID = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const getInferredHost = () => {
  const constantsAny = Constants as any;
  const hostUri: string | undefined =
    constantsAny?.expoConfig?.hostUri ??
    constantsAny?.expoGoConfig?.debuggerHost ??
    constantsAny?.manifest?.debuggerHost ??
    constantsAny?.manifest2?.extra?.expoGo?.debuggerHost;

  return hostUri ? hostUri.split(':')[0] : undefined;
};
