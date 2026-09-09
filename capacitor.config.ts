import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gymflow.app",
  appName: "GymFlow",
  webDir: "out",
  server: {
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    backgroundColor: "#030304",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#030304",
      showSpinner: false,
    },
  },
};

export default config;
