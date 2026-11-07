export interface LauncherApp {
  id: string;
  name: string;
  scheme: string;
  webUrl: string;
  category: string;
  iconBg: string;
  keywords: string[];
}

export const SUPPORTED_EXTERNAL_APPS: LauncherApp[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    scheme: 'vnd.youtube://',
    webUrl: 'https://youtube.com',
    category: 'Video',
    iconBg: 'bg-red-600',
    keywords: ['youtube', 'yt', 'video', 'videos'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    scheme: 'whatsapp://',
    webUrl: 'https://web.whatsapp.com',
    category: 'Chat',
    iconBg: 'bg-emerald-600',
    keywords: ['whatsapp', 'wa', 'chat', 'message'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    scheme: 'instagram://',
    webUrl: 'https://instagram.com',
    category: 'Social',
    iconBg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600',
    keywords: ['instagram', 'insta', 'reels', 'ig'],
  },
  {
    id: 'maps',
    name: 'Google Maps',
    scheme: 'geo:0,0?q=',
    webUrl: 'https://maps.google.com',
    category: 'Navigation',
    iconBg: 'bg-blue-600',
    keywords: ['maps', 'google maps', 'navigation', 'gps map', 'directions'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    scheme: 'mailto:',
    webUrl: 'https://mail.google.com',
    category: 'Mail',
    iconBg: 'bg-red-500',
    keywords: ['gmail', 'email', 'mail'],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    scheme: 'tg://',
    webUrl: 'https://web.telegram.org',
    category: 'Chat',
    iconBg: 'bg-sky-500',
    keywords: ['telegram', 'tg'],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    scheme: 'spotify://',
    webUrl: 'https://open.spotify.com',
    category: 'Music',
    iconBg: 'bg-emerald-500',
    keywords: ['spotify', 'music', 'songs', 'playlist'],
  },
  {
    id: 'chrome',
    name: 'Chrome',
    scheme: 'googlechrome://',
    webUrl: 'https://google.com',
    category: 'Browser',
    iconBg: 'bg-amber-600',
    keywords: ['chrome', 'browser', 'google', 'web'],
  },
  {
    id: 'playstore',
    name: 'Play Store',
    scheme: 'market://',
    webUrl: 'https://play.google.com',
    category: 'Apps',
    iconBg: 'bg-cyan-600',
    keywords: ['play store', 'playstore', 'store', 'app store'],
  },
  {
    id: 'dialer',
    name: 'Phone Dialer',
    scheme: 'tel:',
    webUrl: 'tel:',
    category: 'Utility',
    iconBg: 'bg-green-600',
    keywords: ['phone', 'dialer', 'call', 'telephone'],
  },
  {
    id: 'sms',
    name: 'SMS Messages',
    scheme: 'sms:',
    webUrl: 'sms:',
    category: 'Utility',
    iconBg: 'bg-indigo-600',
    keywords: ['sms', 'messages', 'text message'],
  },
];

class AppLauncherService {
  /**
   * Launch external app via mobile deep link scheme with browser web URL fallback
   */
  public launchExternalApp(appNameOrId: string): { success: boolean; app?: LauncherApp } {
    const clean = appNameOrId.toLowerCase().trim();
    const target = SUPPORTED_EXTERNAL_APPS.find(
      (a) =>
        a.id === clean ||
        a.name.toLowerCase() === clean ||
        a.keywords.some((k) => clean.includes(k) || k.includes(clean))
    );

    if (!target) return { success: false };

    try {
      const start = Date.now();
      window.location.href = target.scheme;
      setTimeout(() => {
        if (Date.now() - start < 1500) {
          window.open(target.webUrl, '_blank');
        }
      }, 700);
      return { success: true, app: target };
    } catch {
      window.open(target.webUrl, '_blank');
      return { success: true, app: target };
    }
  }

  /**
   * Search for an app from query string
   */
  public findApp(query: string): LauncherApp | null {
    const clean = query.toLowerCase().trim();
    return (
      SUPPORTED_EXTERNAL_APPS.find(
        (a) =>
          a.id === clean ||
          a.name.toLowerCase().includes(clean) ||
          clean.includes(a.name.toLowerCase()) ||
          a.keywords.some((k) => clean.includes(k))
      ) || null
    );
  }

  public getAllApps(): LauncherApp[] {
    return SUPPORTED_EXTERNAL_APPS;
  }
}

export const appLauncherService = new AppLauncherService();
