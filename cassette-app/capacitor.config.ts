import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fm.cassette.app',
  appName: 'Cassette',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://cassette-share.vercel.app',
    cleartext: true,
  },
};

export default config;
