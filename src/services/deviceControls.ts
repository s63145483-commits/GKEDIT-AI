/**
 * GKEDIT AI Device Controls Engine
 * Provides hardware-safe browser device controls with feature detection,
 * automatic resource cleanup on unmount/visibility change, and voice/chat commands.
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface DeviceControlState {
  torchOn: boolean;
  isScreenTorch?: boolean;
  torchSupported: boolean | null;
  torchError: string | null;
  locationActive: boolean;
  locationData: LocationData | null;
  locationAddress?: string | null;
  locationError: string | null;
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
  isFullscreen: boolean;
  appVolume: number;
  theme: 'dark' | 'light';
}

type StateListener = (state: DeviceControlState) => void;

class DeviceControlsManager {
  private torchStream: MediaStream | null = null;
  private torchTrack: MediaStreamTrack | null = null;
  private locationWatchId: number | null = null;
  private wakeLockSentinel: any = null;
  private listeners: Set<StateListener> = new Set();

  public state: DeviceControlState = {
    torchOn: false,
    torchSupported: null,
    torchError: null,
    locationActive: false,
    locationData: null,
    locationError: null,
    wakeLockActive: false,
    wakeLockSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    isFullscreen: typeof document !== 'undefined' && !!document.fullscreenElement,
    appVolume: 80,
    theme: 'dark',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      // Load saved settings
      try {
        const savedVol = localStorage.getItem('gkedit_app_volume');
        if (savedVol) this.state.appVolume = parseInt(savedVol, 10);
        const savedTheme = localStorage.getItem('gkedit_theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          this.state.theme = savedTheme;
        }
      } catch {}

      // Automatically release camera and location when tab is hidden
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.state.torchOn) {
            this.turnOffTorch();
          }
          if (this.state.locationActive) {
            this.stopLocation();
          }
          if (this.wakeLockSentinel) {
            this.releaseWakeLock();
          }
        }
      });

      // Track fullscreen changes
      document.addEventListener('fullscreenchange', () => {
        this.state.isFullscreen = !!document.fullscreenElement;
        this.notify();
      });
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn({ ...this.state }));
  }

  // -------------------------------------------------------------
  // TORCH / FLASHLIGHT
  // -------------------------------------------------------------
  public async turnOnTorch(): Promise<void> {
    this.state.torchError = null;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera / Torch API is not supported on this browser.');
      }

      // Request rear camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      const track = stream.getVideoTracks()[0];
      if (!track) {
        throw new Error('No camera video track available.');
      }

      // Verify torch capability
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
      if (!('torch' in capabilities)) {
        // Stop stream immediately
        track.stop();
        stream.getTracks().forEach((t) => t.stop());
        // Auto fallback to Screen Torch so user is never left without light
        this.state.torchOn = true;
        this.state.isScreenTorch = true;
        this.state.torchSupported = false;
        this.state.torchError = null;
        this.notify();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gkedit:screen_torch_toggle', { detail: { on: true } }));
        }
        return;
      }

      // Apply torch constraint
      await (track as any).applyConstraints({
        advanced: [{ torch: true }],
      });

      this.torchStream = stream;
      this.torchTrack = track;
      this.state.torchOn = true;
      this.state.isScreenTorch = false;
      this.state.torchSupported = true;
      this.state.torchError = null;
      this.notify();
    } catch (err: any) {
      console.warn('Hardware torch unavailable, activating Screen Torch fallback:', err);
      // Seamless Screen Torch fallback
      this.state.torchOn = true;
      this.state.isScreenTorch = true;
      this.state.torchError = null;
      this.notify();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gkedit:screen_torch_toggle', { detail: { on: true } }));
      }
    }
  }

  public turnOffTorch() {
    try {
      if (this.torchTrack) {
        try {
          (this.torchTrack as any).applyConstraints({
            advanced: [{ torch: false }],
          });
        } catch {}
        this.torchTrack.stop();
        this.torchTrack = null;
      }
      if (this.torchStream) {
        this.torchStream.getTracks().forEach((t) => t.stop());
        this.torchStream = null;
      }
    } catch (err) {
      console.warn('Error turning off torch:', err);
    } finally {
      this.state.torchOn = false;
      this.state.isScreenTorch = false;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gkedit:screen_torch_toggle', { detail: { on: false } }));
      }
      this.notify();
    }
  }

  public async toggleTorch(): Promise<boolean> {
    if (this.state.torchOn) {
      this.turnOffTorch();
      return false;
    } else {
      await this.turnOnTorch();
      return true;
    }
  }

  // -------------------------------------------------------------
  // GEOLOCATION & REVERSE GEOCODING
  // -------------------------------------------------------------
  public async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const parts = [
          data.locality || data.city || data.principalSubdivisionCode,
          data.principalSubdivision,
          data.countryName,
        ].filter(Boolean);
        if (parts.length > 0) {
          const addr = parts.join(', ');
          this.state.locationAddress = addr;
          this.notify();
          return addr;
        }
      }
    } catch (e) {
      console.warn('Reverse geocoding error:', e);
    }
    return null;
  }

  public startLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const errorMsg = 'Geolocation is not supported by this browser.';
        this.state.locationError = errorMsg;
        this.notify();
        return reject(new Error(errorMsg));
      }

      this.state.locationError = null;
      this.state.locationActive = true;
      this.notify();

      if (this.locationWatchId !== null) {
        navigator.geolocation.clearWatch(this.locationWatchId);
        this.locationWatchId = null;
      }

      this.locationWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc: LocationData = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            timestamp: pos.timestamp,
          };
          this.state.locationData = loc;
          this.state.locationError = null;
          this.state.locationActive = true;
          this.notify();

          // Fetch reverse geocoded human-readable address in background
          this.reverseGeocode(loc.latitude, loc.longitude).catch(() => {});

          resolve(loc);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          let userMsg = 'Could not retrieve location.';
          if (err.code === err.PERMISSION_DENIED) {
            userMsg =
              'Location permission denied. In Chrome: tap the lock/tune icon next to the URL > Permissions > Location > Allow, then reload.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            userMsg = 'Position unavailable. Please ensure device location / GPS is turned ON.';
          } else if (err.code === err.TIMEOUT) {
            userMsg = 'Location request timed out. Please check signal and retry.';
          }
          this.state.locationError = userMsg;
          this.state.locationActive = false;
          this.notify();
          reject(new Error(userMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 5000,
        }
      );
    });
  }

  public stopLocation() {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
    this.state.locationActive = false;
    this.notify();
  }

  public toggleLocation() {
    if (this.state.locationActive) {
      this.stopLocation();
    } else {
      this.startLocation().catch(() => {});
    }
  }

  // -------------------------------------------------------------
  // WAKE LOCK (KEEP SCREEN AWAKE)
  // -------------------------------------------------------------
  public async requestWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.state.wakeLockActive = false;
          this.notify();
        });
        this.state.wakeLockActive = true;
        this.notify();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Wake Lock request error:', err);
      this.state.wakeLockActive = false;
      this.notify();
      return false;
    }
  }

  public async releaseWakeLock() {
    try {
      if (this.wakeLockSentinel) {
        await this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch (err) {
      console.warn('Wake lock release error:', err);
    } finally {
      this.state.wakeLockActive = false;
      this.notify();
    }
  }

  public async toggleWakeLock() {
    if (this.state.wakeLockActive) {
      await this.releaseWakeLock();
    } else {
      await this.requestWakeLock();
    }
  }

  // -------------------------------------------------------------
  // VIBRATION TEST
  // -------------------------------------------------------------
  public triggerVibration(pattern: number[] = [100, 60, 100]): boolean {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  // -------------------------------------------------------------
  // FULLSCREEN TOGGLE
  // -------------------------------------------------------------
  public async toggleFullscreen(): Promise<boolean> {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        this.state.isFullscreen = true;
      } else {
        await document.exitFullscreen();
        this.state.isFullscreen = false;
      }
      this.notify();
      return this.state.isFullscreen;
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
      return false;
    }
  }

  // -------------------------------------------------------------
  // APP VOLUME & THEME
  // -------------------------------------------------------------
  public setAppVolume(val: number) {
    const clamped = Math.max(0, Math.min(100, val));
    this.state.appVolume = clamped;
    try {
      localStorage.setItem('gkedit_app_volume', clamped.toString());
    } catch {}
    this.notify();
  }

  public toggleTheme() {
    const nextTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.state.theme = nextTheme;
    try {
      localStorage.setItem('gkedit_theme', nextTheme);
      if (nextTheme === 'light') {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
    } catch {}
    this.notify();
  }

  // -------------------------------------------------------------
  // VOICE & CHAT COMMANDS INTERPRETER
  // -------------------------------------------------------------
  public async handleCommand(text: string): Promise<{
    handled: boolean;
    reply: string;
    spokenText?: string;
    actionType?: 'torch' | 'location' | 'vibration' | 'theme';
    meta?: any;
  } | null> {
    const clean = text.toLowerCase().trim();

    // 1. Torch / Flashlight commands
    const isTorchOff =
      clean.includes('turn off torch') ||
      clean.includes('torch off') ||
      clean.includes('turn torch off') ||
      clean.includes('turn off the torch') ||
      clean.includes('stop torch') ||
      clean.includes('flashlight off') ||
      clean.includes('turn off flashlight') ||
      clean.includes('turn flashlight off') ||
      clean.includes('turn off the flashlight') ||
      clean.includes('turn off light') ||
      clean.includes('turn off the light') ||
      clean.includes('light off');

    const isTorchOn =
      !isTorchOff && (
        clean.includes('turn torch') ||
        clean.includes('torch on') ||
        clean.includes('turn on torch') ||
        clean.includes('turn torch on') ||
        clean.includes('start torch') ||
        clean.includes('turn on flashlight') ||
        clean.includes('turn flashlight on') ||
        clean.includes('turn flashlight') ||
        clean.includes('flashlight on') ||
        clean.includes('turn on light') ||
        clean.includes('turn on the light') ||
        clean.includes('turn on the torch') ||
        clean.includes('turn on the flashlight') ||
        clean.includes('screen torch') ||
        clean === 'torch' ||
        clean === 'flashlight' ||
        clean === 'flash'
      );

    if (isTorchOff) {
      this.turnOffTorch();
      return {
        handled: true,
        actionType: 'torch',
        reply: '🌑 Flashlight deactivated.',
        spokenText: 'Flashlight turned off.',
      };
    }

    if (isTorchOn) {
      try {
        await this.turnOnTorch();
        const isScreen = this.state.isScreenTorch;
        return {
          handled: true,
          actionType: 'torch',
          reply: isScreen
            ? '⚡ Screen Torch activated at maximum lumen brightness.'
            : '⚡ Rear LED flashlight activated. Illuminating your surroundings.',
          spokenText: isScreen
            ? 'Screen Torch activated at maximum lumen brightness.'
            : 'Rear LED flashlight activated.',
        };
      } catch (err: any) {
        return {
          handled: true,
          actionType: 'torch',
          reply: `⚠️ Torch failed: ${this.state.torchError || err.message}`,
          spokenText: 'Sorry, the flashlight could not be activated.',
        };
      }
    }

    if (clean.includes('toggle torch') || clean.includes('toggle flashlight')) {
      const nowOn = await this.toggleTorch();
      return {
        handled: true,
        actionType: 'torch',
        reply: nowOn ? '⚡ Flashlight activated.' : '🌑 Flashlight deactivated.',
        spokenText: nowOn ? 'Flashlight turned on.' : 'Flashlight turned off.',
      };
    }

    // 2. Geolocation / Locations commands
    const isLocationStop =
      clean.includes('stop location') ||
      clean.includes('turn off location') ||
      clean.includes('disable location');

    const isLocationQuery =
      !isLocationStop && (
        clean.includes('location') ||
        clean.includes('locations') ||
        clean.includes('where am i') ||
        clean.includes('where i am') ||
        clean.includes('where are we') ||
        clean.includes('coordinates') ||
        clean.includes('gps') ||
        clean.includes('latitude')
      );

    if (isLocationStop) {
      this.stopLocation();
      return {
        handled: true,
        actionType: 'location',
        reply: '🛑 Geolocation tracking terminated and GPS sensor released.',
        spokenText: 'Location tracking terminated and sensor released.',
      };
    }

    if (isLocationQuery) {
      try {
        const loc = await this.startLocation();
        const addr = this.state.locationAddress || (await this.reverseGeocode(loc.latitude, loc.longitude));
        const addrText = addr || 'GPS Fix coordinates';

        return {
          handled: true,
          actionType: 'location',
          reply: `🛰️ Geolocation acquired:\n- **Location**: ${addrText}\n- **Latitude**: ${loc.latitude.toFixed(5)}\n- **Longitude**: ${loc.longitude.toFixed(5)}\n- **Accuracy**: ±${loc.accuracy}m\n\n[Open in Google Maps](https://www.google.com/maps?q=${loc.latitude},${loc.longitude})`,
          spokenText: `Your current location is ${addr ? `near ${addr}` : `at latitude ${loc.latitude.toFixed(3)}, longitude ${loc.longitude.toFixed(3)}`}, with accuracy of plus or minus ${loc.accuracy} meters. I have displayed your map link on screen.`,
          meta: { loc, addr: addrText },
        };
      } catch (err: any) {
        return {
          handled: true,
          actionType: 'location',
          reply: `⚠️ Location error: ${this.state.locationError || err.message}`,
          spokenText: 'Could not access location. Please ensure device GPS and location permissions are enabled.',
        };
      }
    }

    // 3. Vibration command
    if (clean.includes('vibrate') || clean.includes('test vibration') || clean.includes('haptic pulse')) {
      const ok = this.triggerVibration();
      return {
        handled: true,
        actionType: 'vibration',
        reply: ok ? '📳 Haptic pulse executed.' : '⚠️ Vibration API not supported on this device.',
        spokenText: ok ? 'Haptic pulse executed.' : 'Vibration is not supported on this device.',
      };
    }

    return null;
  }
}

export const deviceControls = new DeviceControlsManager();
