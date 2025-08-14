import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.07ca1c3a779947d584712891fa67d61a',
  appName: 'obcfaces',
  webDir: 'dist',
  server: {
    url: 'https://07ca1c3a-7799-47d5-8471-2891fa67d61a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;