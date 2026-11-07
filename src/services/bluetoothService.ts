// ========================================================================
// REAL WEB BLUETOOTH HARDWARE SERVICE (Zero Fake Data)
// Strictly interfaces with navigator.bluetooth and GATT services (0x180F)
// With full-lifecycle explicit error handling and diagnostic event logs
// ========================================================================

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel: number | null; // Exact 0-100% read from 0x180F / 0x2A19, null if unsupported
  batteryServiceAvailable: boolean;
  batteryServiceNote?: string;
  connectedAt?: number;
}

export interface BluetoothDiagnostics {
  isSupported: boolean;
  isIframe: boolean;
  isSecureContext: boolean;
  browser: 'chrome' | 'edge' | 'safari' | 'firefox' | 'opera' | 'unknown';
  os: 'android' | 'windows' | 'mac' | 'ios' | 'linux' | 'unknown';
  directUrl: string;
  permissionsPolicyAllowed: boolean | null; // null if Permissions Policy API is not available
  adapterAvailable: boolean | null; // null if getAvailability() is not supported
  hasTransientActivation: boolean | null;
}

export type BluetoothLogStage =
  | 'ENVIRONMENT_CHECK'
  | 'PERMISSIONS_POLICY'
  | 'USER_GESTURE'
  | 'DEVICE_REQUEST'
  | 'DEVICE_SELECTED'
  | 'GATT_CONNECT'
  | 'SERVICE_DISCOVERY'
  | 'TELEMETRY_READ'
  | 'DISCONNECT'
  | 'ERROR';

export type BluetoothLogStatus = 'info' | 'running' | 'success' | 'warning' | 'error';

export interface BluetoothLogEntry {
  id: string;
  timestamp: string; // e.g. "10:28:45.123"
  rawTime: number;
  stage: BluetoothLogStage;
  status: BluetoothLogStatus;
  title: string;
  details?: string;
  errorName?: string;
  remedy?: string;
}

export interface BluetoothServiceState {
  isSupported: boolean;
  isScanning: boolean;
  connectedDevice: BluetoothDeviceInfo | null;
  lastError: string | null;
  diagnostics: BluetoothDiagnostics;
  logs: BluetoothLogEntry[];
}

type BluetoothListener = (state: BluetoothServiceState) => void;

function formatTimestamp(): string {
  const now = new Date();
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(
    now.getMilliseconds(),
    3
  )}`;
}

class RealBluetoothService {
  private nativeDevice: any = null;
  private gattServer: any = null;
  private listeners: Set<BluetoothListener> = new Set();

  private state: BluetoothServiceState;

  constructor() {
    this.state = {
      isSupported: this.checkSupport(),
      isScanning: false,
      connectedDevice: null,
      lastError: null,
      diagnostics: this.computeDiagnostics(),
      logs: [],
    };

    // Initialize with environment check log
    if (typeof window !== 'undefined') {
      this.initEnvironmentLog();
    }
  }

  private checkSupport(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public computeDiagnostics(): BluetoothDiagnostics {
    const isSupported = this.checkSupport();
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    const isSecureContext = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
    const directUrl = typeof window !== 'undefined' ? window.location.href : '';

    let browser: BluetoothDiagnostics['browser'] = 'unknown';
    let os: BluetoothDiagnostics['os'] = 'unknown';

    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('edg/')) {
        browser = 'edge';
      } else if (ua.includes('opr/') || ua.includes('opera/')) {
        browser = 'opera';
      } else if (ua.includes('chrome') || ua.includes('crios')) {
        browser = 'chrome';
      } else if (ua.includes('safari') && !ua.includes('chrome')) {
        browser = 'safari';
      } else if (ua.includes('firefox') || ua.includes('fxios')) {
        browser = 'firefox';
      }

      if (ua.includes('android')) {
        os = 'android';
      } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
        os = 'ios';
      } else if (ua.includes('win')) {
        os = 'windows';
      } else if (ua.includes('mac')) {
        os = 'mac';
      } else if (ua.includes('linux')) {
        os = 'linux';
      }
    }

    // Check Permissions Policy API if exposed by browser
    let permissionsPolicyAllowed: boolean | null = null;
    if (typeof document !== 'undefined') {
      const docAny = document as any;
      if (docAny.permissionsPolicy && typeof docAny.permissionsPolicy.allowsFeature === 'function') {
        try {
          permissionsPolicyAllowed = docAny.permissionsPolicy.allowsFeature('bluetooth');
        } catch {
          permissionsPolicyAllowed = null;
        }
      } else if (docAny.featurePolicy && typeof docAny.featurePolicy.allowsFeature === 'function') {
        try {
          permissionsPolicyAllowed = docAny.featurePolicy.allowsFeature('bluetooth');
        } catch {
          permissionsPolicyAllowed = null;
        }
      }
    }

    // Check User Activation API if available
    let hasTransientActivation: boolean | null = null;
    if (typeof navigator !== 'undefined') {
      const navAny = navigator as any;
      if (navAny.userActivation && typeof navAny.userActivation.isActive === 'boolean') {
        hasTransientActivation = navAny.userActivation.isActive;
      }
    }

    return {
      isSupported,
      isIframe,
      isSecureContext,
      browser,
      os,
      directUrl,
      permissionsPolicyAllowed,
      adapterAvailable: null, // Asynchronous, queried during diagnostic runs
      hasTransientActivation,
    };
  }

  private initEnvironmentLog() {
    const diag = this.computeDiagnostics();
    this.addLog({
      stage: 'ENVIRONMENT_CHECK',
      status: diag.isSupported ? 'info' : 'warning',
      title: 'Web Bluetooth Engine Initialized',
      details: `Browser: ${diag.browser.toUpperCase()} | OS: ${diag.os.toUpperCase()} | Secure: ${
        diag.isSecureContext ? 'HTTPS/Localhost' : 'INSECURE'
      } | Iframe: ${diag.isIframe ? 'YES (Embedded)' : 'NO (Top-level)'} | Policy Allowed: ${
        diag.permissionsPolicyAllowed === null ? 'Unknown' : diag.permissionsPolicyAllowed ? 'TRUE' : 'FALSE'
      }`,
    });
  }

  public addLog(entry: Omit<BluetoothLogEntry, 'id' | 'timestamp' | 'rawTime'>) {
    const fullEntry: BluetoothLogEntry = {
      ...entry,
      id: `bt-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: formatTimestamp(),
      rawTime: Date.now(),
    };

    // Prefix for browser devtools console visibility
    const consolePrefix = `[WebBluetooth·${entry.stage}]`;
    if (entry.status === 'error') {
      console.error(consolePrefix, entry.title, entry.details || '', entry.remedy || '');
    } else if (entry.status === 'warning') {
      console.warn(consolePrefix, entry.title, entry.details || '');
    } else {
      console.log(consolePrefix, entry.title, entry.details || '');
    }

    // Keep up to 60 recent log entries
    const updatedLogs = [fullEntry, ...this.state.logs].slice(0, 60);
    this.state.logs = updatedLogs;
    this.notify();
  }

  public clearLogs() {
    this.state.logs = [];
    this.notify();
  }

  public getState(): BluetoothServiceState {
    return {
      ...this.state,
      diagnostics: this.computeDiagnostics(),
    };
  }

  public subscribe(listener: BluetoothListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('Error in bluetooth listener', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gkedit:bluetooth_state_change', {
          detail: currentState,
        })
      );
    }
  }

  public isSupported(): boolean {
    return this.checkSupport();
  }

  /**
   * Run an explicit non-invasive diagnostic check on the system & browser
   */
  public async runFullDiagnostics(): Promise<BluetoothDiagnostics> {
    const diag = this.computeDiagnostics();

    this.addLog({
      stage: 'ENVIRONMENT_CHECK',
      status: 'running',
      title: 'Running Bluetooth System Diagnostics...',
      details: 'Checking Navigator API, Secure Context, Permissions Policy, and Bluetooth adapter availability.',
    });

    // 1. API Support
    if (!diag.isSupported) {
      let remedy = 'Switch to Google Chrome or Microsoft Edge on Android, Windows, Mac, or ChromeOS.';
      if (diag.browser === 'safari' || diag.os === 'ios') {
        remedy = 'Apple iOS Safari does not support the Web Bluetooth API. Use Google Chrome on Android or desktop.';
      } else if (diag.browser === 'firefox') {
        remedy = 'Mozilla Firefox has Web Bluetooth disabled by default. Please use Google Chrome.';
      }
      this.addLog({
        stage: 'ENVIRONMENT_CHECK',
        status: 'error',
        title: 'Navigator.bluetooth is undefined',
        details: `Your browser (${diag.browser}) on (${diag.os}) does not support the Web Bluetooth API.`,
        remedy,
      });
      return diag;
    }

    // 2. Secure Context
    if (!diag.isSecureContext) {
      this.addLog({
        stage: 'ENVIRONMENT_CHECK',
        status: 'error',
        title: 'Non-Secure Context Detected',
        details: 'Web Bluetooth API strictly requires HTTPS or localhost.',
        remedy: 'Ensure the URL begins with https:// or run on localhost.',
      });
      return diag;
    }

    // 3. Iframe Permissions Policy
    if (diag.isIframe) {
      if (diag.permissionsPolicyAllowed === false) {
        this.addLog({
          stage: 'PERMISSIONS_POLICY',
          status: 'error',
          title: 'Iframe Permissions-Policy Disallows Bluetooth',
          details: 'The host iframe was created without allow="bluetooth". Calls to requestDevice will throw SecurityError.',
          remedy: 'Click "Launch in Direct Tab" to open the app directly at full page without iframe restrictions.',
        });
      } else {
        this.addLog({
          stage: 'PERMISSIONS_POLICY',
          status: 'warning',
          title: 'Running Inside Embedded Iframe',
          details: 'If connection fails with SecurityError, the parent frame lacks allow="bluetooth". Use the Direct Tab launcher.',
        });
      }
    } else {
      this.addLog({
        stage: 'PERMISSIONS_POLICY',
        status: 'success',
        title: 'Running at Top-Level Window',
        details: 'Not embedded in an iframe; browser Permissions Policy is unrestricted.',
      });
    }

    // 4. Check Bluetooth Radio / Adapter Availability
    if (typeof navigator !== 'undefined' && (navigator as any).bluetooth?.getAvailability) {
      try {
        const available = await (navigator as any).bluetooth.getAvailability();
        diag.adapterAvailable = available;
        if (available) {
          this.addLog({
            stage: 'ENVIRONMENT_CHECK',
            status: 'success',
            title: 'Bluetooth Hardware Radio Active',
            details: 'The system has an active Bluetooth radio enabled and ready for scanning.',
          });
        } else {
          this.addLog({
            stage: 'ENVIRONMENT_CHECK',
            status: 'warning',
            title: 'Bluetooth Hardware Radio is Disabled',
            details: 'navigator.bluetooth.getAvailability() returned false. Your device Bluetooth radio is toggled OFF.',
            remedy: 'Enable Bluetooth in your device settings. On Android, also verify Location is toggled ON.',
          });
        }
      } catch (err: any) {
        this.addLog({
          stage: 'ENVIRONMENT_CHECK',
          status: 'info',
          title: 'Adapter Availability Query Skipped',
          details: err.message,
        });
      }
    }

    this.state.diagnostics = diag;
    this.notify();
    return diag;
  }

  /**
   * Request device & connect via real Web Bluetooth API
   * Must be called directly inside an explicit user gesture (click/tap)
   */
  public async connectDevice(deviceTypeHint?: string): Promise<{
    success: boolean;
    device?: BluetoothDeviceInfo;
    error?: string;
  }> {
    const diag = this.computeDiagnostics();

    // Log user gesture & activation status
    const navAny = typeof navigator !== 'undefined' ? (navigator as any) : null;
    const isUserActive = navAny?.userActivation ? navAny.userActivation.isActive : 'unknown';

    this.addLog({
      stage: 'USER_GESTURE',
      status: 'info',
      title: 'User Gesture Initiated Connection',
      details: `Trigger: Direct tap | Transient User Activation: ${isUserActive} | Hint: ${deviceTypeHint || 'all'}`,
    });

    // Step 1: Platform Support Validation
    if (!diag.isSupported) {
      const errMsg =
        diag.browser === 'safari' || diag.os === 'ios'
          ? 'Apple iOS Safari does not support the Web Bluetooth API. Please open GKEDIT AI in Google Chrome on Android or desktop.'
          : diag.browser === 'firefox'
          ? 'Mozilla Firefox does not support Web Bluetooth by default. Please use Google Chrome or Microsoft Edge.'
          : 'Web Bluetooth API is not available on this platform. Please use Google Chrome on Android or desktop with Bluetooth enabled.';

      this.addLog({
        stage: 'ERROR',
        status: 'error',
        title: 'Connection Aborted: API Unsupported',
        errorName: 'NotSupportedError',
        details: errMsg,
        remedy: 'Open app in Google Chrome on Android, Windows, macOS, or ChromeOS.',
      });

      this.state.lastError = errMsg;
      this.notify();
      return { success: false, error: errMsg };
    }

    // Step 2: Secure Context Check
    if (!diag.isSecureContext) {
      const errMsg = 'Web Bluetooth requires a Secure Context (HTTPS or localhost).';
      this.addLog({
        stage: 'ERROR',
        status: 'error',
        title: 'Connection Aborted: Insecure Context',
        errorName: 'SecurityError',
        details: errMsg,
        remedy: 'Access the application via HTTPS.',
      });
      this.state.lastError = errMsg;
      this.notify();
      return { success: false, error: errMsg };
    }

    // Step 3: Pre-check Iframe Permissions Policy
    if (diag.isIframe && diag.permissionsPolicyAllowed === false) {
      const errMsg =
        'Web Bluetooth is blocked by the embedded preview iframe permissions policy. Click "Launch in Direct Tab" below to connect with full hardware access in Chrome.';
      this.addLog({
        stage: 'PERMISSIONS_POLICY',
        status: 'error',
        title: 'Blocked by Iframe Permissions Policy',
        errorName: 'SecurityError',
        details: 'The container iframe does not permit the "bluetooth" feature.',
        remedy: 'Click "Launch in Direct Tab" to open the app directly at top-level.',
      });
      this.state.lastError = errMsg;
      this.notify();
      return { success: false, error: errMsg };
    }

    this.state.isScanning = true;
    this.state.lastError = null;
    this.notify();

    try {
      // Step 4: Configure Request Options
      // Standard non-blocklisted services:
      // - 0x180F / 'battery_service'
      // - 0x180A / 'device_information'
      const options: any = {
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information'],
      };

      this.addLog({
        stage: 'DEVICE_REQUEST',
        status: 'running',
        title: 'Invoking Native Bluetooth Device Chooser...',
        details: `Calling navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['battery_service', 'device_information'] }). A native browser picker popup should now appear.`,
      });

      // Prompt native browser device picker
      const device = await (navigator as any).bluetooth.requestDevice(options);

      if (!device) {
        throw new Error('No Bluetooth device was selected.');
      }

      this.nativeDevice = device;

      this.addLog({
        stage: 'DEVICE_SELECTED',
        status: 'success',
        title: `Peripheral Selected: "${device.name || 'Unnamed'}"`,
        details: `Hardware Device ID: ${device.id} | Name: ${device.name || 'N/A'}`,
      });

      // Handle spontaneous disconnect from hardware
      device.addEventListener('gattserverdisconnected', (event: any) => {
        this.addLog({
          stage: 'DISCONNECT',
          status: 'warning',
          title: `Peripheral Disconnected`,
          details: `Device "${device.name || device.id}" disconnected from GATT server.`,
        });
        this.handleDisconnected();
      });

      // Step 5: Connect to GATT Server
      if (!device.gatt) {
        throw new Error(`Device "${device.name || device.id}" does not expose a GATT client interface.`);
      }

      this.addLog({
        stage: 'GATT_CONNECT',
        status: 'running',
        title: 'Connecting to GATT Server...',
        details: `Establishing Bluetooth Low Energy GATT link with ${device.name || device.id}...`,
      });

      this.gattServer = await device.gatt.connect();

      this.addLog({
        stage: 'GATT_CONNECT',
        status: 'success',
        title: 'GATT Server Connected Successfully',
        details: `GATT client session established. Active connection: ${this.gattServer.connected}`,
      });

      // Step 6: Query real Battery Service (UUID 0x180F)
      let batteryLevel: number | null = null;
      let batteryServiceAvailable = false;
      let batteryServiceNote: string | undefined = undefined;

      this.addLog({
        stage: 'SERVICE_DISCOVERY',
        status: 'running',
        title: 'Querying GATT Battery Service (0x180F)...',
        details: 'Attempting getPrimaryService("battery_service")...',
      });

      try {
        const batteryService = await this.gattServer.getPrimaryService('battery_service');
        if (batteryService) {
          this.addLog({
            stage: 'SERVICE_DISCOVERY',
            status: 'success',
            title: 'Battery Service (0x180F) Discovered',
            details: `GATT Service 0x180F is supported by peripheral firmware. Reading Characteristic 0x2A19 (battery_level)...`,
          });

          const batteryChar = await batteryService.getCharacteristic('battery_level');
          const value = await batteryChar.readValue();
          batteryLevel = value.getUint8(0);
          batteryServiceAvailable = true;

          this.addLog({
            stage: 'TELEMETRY_READ',
            status: 'success',
            title: `Live Battery Telemetry: ${batteryLevel}%`,
            details: `Exact value read from byte 0 of Characteristic 0x2A19 (Zero Fake Data).`,
          });

          // Subscribe to battery level notifications if supported by characteristic
          if (batteryChar.properties?.notify) {
            try {
              await batteryChar.startNotifications();
              batteryChar.addEventListener('characteristicvaluechanged', (e: any) => {
                const newLvl = e.target.value.getUint8(0);
                if (this.state.connectedDevice) {
                  this.state.connectedDevice.batteryLevel = newLvl;
                  this.notify();
                }
                this.addLog({
                  stage: 'TELEMETRY_READ',
                  status: 'info',
                  title: `Battery Level Changed Notification: ${newLvl}%`,
                });
              });
            } catch {
              // Notification subscription optional
            }
          }
        }
      } catch (battErr: any) {
        // Battery service 0x180F is not exposed by this hardware
        batteryServiceAvailable = false;
        batteryLevel = null;
        batteryServiceNote =
          'Battery service (0x180F) is not exposed by this peripheral firmware. The device is connected, but does not provide standard GATT battery level telemetry.';

        this.addLog({
          stage: 'SERVICE_DISCOVERY',
          status: 'warning',
          title: 'Battery Service (0x180F) Not Exposed',
          details: `getPrimaryService('battery_service') threw: ${battErr.message || 'Service not found'}. This is normal for peripherals that only use proprietary or audio profiles without GATT 0x180F.`,
        });
      }

      const connectedInfo: BluetoothDeviceInfo = {
        id: device.id,
        name: device.name || 'Unnamed Bluetooth Peripheral',
        connected: true,
        batteryLevel,
        batteryServiceAvailable,
        batteryServiceNote,
        connectedAt: Date.now(),
      };

      this.state.isScanning = false;
      this.state.connectedDevice = connectedInfo;
      this.state.lastError = null;
      this.notify();

      return {
        success: true,
        device: connectedInfo,
      };
    } catch (err: any) {
      this.state.isScanning = false;
      const errName = err.name || 'UnknownError';
      const errMsg = err.message || 'Failed to connect to Bluetooth peripheral.';
      let userFriendlyMsg = errMsg;
      let remedy = 'Ensure your device is powered on, nearby, and in pairing mode.';

      if (errName === 'NotFoundError') {
        userFriendlyMsg = 'Bluetooth pairing was cancelled or no peripheral was selected.';
        remedy = 'Put your earbuds or peripheral into discoverable pairing mode (flashing LED) and tap Scan again.';
        this.addLog({
          stage: 'DEVICE_REQUEST',
          status: 'warning',
          title: 'Picker Cancelled / No Device Selected',
          errorName: errName,
          details: 'The native browser chooser was dismissed without picking a device, or no devices advertised nearby.',
          remedy,
        });
      } else if (errName === 'SecurityError') {
        if (diag.isIframe) {
          userFriendlyMsg =
            'Web Bluetooth access is blocked by the embedded preview iframe permissions policy. Tap "Launch in Direct Tab" below to open GKEDIT AI in a dedicated Chrome tab with full hardware access.';
          remedy = 'Click "Launch in Direct Tab" to bypass iframe permissions restriction.';
        } else {
          userFriendlyMsg =
            'Security restriction: Access to Bluetooth was disallowed. Ensure you tapped the button directly without async delays.';
          remedy = 'Click the Scan button directly.';
        }
        this.addLog({
          stage: 'ERROR',
          status: 'error',
          title: 'SecurityError: Bluetooth Access Disallowed',
          errorName: errName,
          details: errMsg,
          remedy,
        });
      } else if (errName === 'NotSupportedError') {
        userFriendlyMsg =
          'Web Bluetooth is not supported on this platform or browser version. Please switch to Google Chrome on Android or desktop.';
        remedy = 'Use Google Chrome on Android, Windows, Mac, or ChromeOS.';
        this.addLog({
          stage: 'ERROR',
          status: 'error',
          title: 'NotSupportedError: Platform Unsupported',
          errorName: errName,
          details: errMsg,
          remedy,
        });
      } else if (errName === 'NetworkError') {
        userFriendlyMsg =
          'GATT connection to the peripheral failed. Ensure the device is powered on, nearby, and not currently paired exclusively to another host.';
        remedy = 'Disconnect from other phones/computers and put device in pairing mode.';
        this.addLog({
          stage: 'GATT_CONNECT',
          status: 'error',
          title: 'NetworkError: GATT Connection Failed',
          errorName: errName,
          details: errMsg,
          remedy,
        });
      } else {
        this.addLog({
          stage: 'ERROR',
          status: 'error',
          title: `Connection Error: ${errName}`,
          errorName: errName,
          details: errMsg,
          remedy,
        });
      }

      this.state.lastError = userFriendlyMsg;
      this.notify();
      return {
        success: false,
        error: userFriendlyMsg,
      };
    }
  }

  /**
   * Disconnect the active peripheral
   */
  public async disconnectDevice(): Promise<{ success: boolean; message: string }> {
    const prevName = this.state.connectedDevice?.name || 'Device';

    this.addLog({
      stage: 'DISCONNECT',
      status: 'info',
      title: `Disconnecting from ${prevName}...`,
      details: 'Calling nativeDevice.gatt.disconnect()...',
    });

    if (this.nativeDevice && this.nativeDevice.gatt && this.nativeDevice.gatt.connected) {
      try {
        this.nativeDevice.gatt.disconnect();
      } catch (err: any) {
        console.warn('Notice during disconnect:', err);
      }
    }

    this.handleDisconnected();

    this.addLog({
      stage: 'DISCONNECT',
      status: 'success',
      title: `Disconnected from ${prevName}`,
      details: 'GATT connection severed and state reset.',
    });

    return {
      success: true,
      message: `Successfully disconnected from ${prevName}.`,
    };
  }

  /**
   * Refresh/read real battery level for the connected device
   */
  public async getBatteryLevel(): Promise<{
    success: boolean;
    batteryLevel?: number | null;
    batteryServiceAvailable: boolean;
    error?: string;
  }> {
    if (!this.state.connectedDevice || !this.gattServer || !this.gattServer.connected) {
      const errMsg = 'No Bluetooth peripheral currently connected. Connect a device first under Home Device.';
      this.addLog({
        stage: 'TELEMETRY_READ',
        status: 'warning',
        title: 'Battery Query Cancelled: No Connection',
        details: errMsg,
      });
      return {
        success: false,
        batteryServiceAvailable: false,
        error: errMsg,
      };
    }

    this.addLog({
      stage: 'TELEMETRY_READ',
      status: 'running',
      title: 'Refreshing GATT Battery Telemetry...',
      details: 'Querying Primary Service "battery_service" -> Characteristic "battery_level"...',
    });

    try {
      const batteryService = await this.gattServer.getPrimaryService('battery_service');
      const batteryChar = await batteryService.getCharacteristic('battery_level');
      const value = await batteryChar.readValue();
      const batteryLevel = value.getUint8(0);

      if (this.state.connectedDevice) {
        this.state.connectedDevice.batteryLevel = batteryLevel;
        this.state.connectedDevice.batteryServiceAvailable = true;
        this.state.connectedDevice.batteryServiceNote = undefined;
        this.notify();
      }

      this.addLog({
        stage: 'TELEMETRY_READ',
        status: 'success',
        title: `Battery Level Updated: ${batteryLevel}%`,
        details: 'Successfully read 0x2A19 characteristic value.',
      });

      return {
        success: true,
        batteryLevel,
        batteryServiceAvailable: true,
      };
    } catch (err: any) {
      if (this.state.connectedDevice) {
        this.state.connectedDevice.batteryLevel = null;
        this.state.connectedDevice.batteryServiceAvailable = false;
        this.state.connectedDevice.batteryServiceNote =
          'Battery service (0x180F) is not exposed by this hardware.';
        this.notify();
      }

      this.addLog({
        stage: 'TELEMETRY_READ',
        status: 'warning',
        title: 'Battery Read Failed',
        details: `GATT Service 0x180F error: ${err.message}`,
      });

      return {
        success: false,
        batteryLevel: null,
        batteryServiceAvailable: false,
        error: 'Battery service (0x180F) is not exposed by this hardware.',
      };
    }
  }

  public exportLogsAsText(): string {
    const diag = this.computeDiagnostics();
    const header = [
      `=== GKEDIT AI Web Bluetooth Connection & Diagnostic Log ===`,
      `Generated: ${new Date().toISOString()}`,
      `Browser: ${diag.browser} | OS: ${diag.os}`,
      `Secure Context: ${diag.isSecureContext} | Iframe: ${diag.isIframe}`,
      `Permissions Policy Allowed: ${diag.permissionsPolicyAllowed}`,
      `URL: ${diag.directUrl}`,
      `Active Device: ${this.state.connectedDevice ? this.state.connectedDevice.name : 'None'}`,
      `============================================================\n`,
    ].join('\n');

    const logLines = this.state.logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.stage}] [${l.status.toUpperCase()}] ${l.title}${
            l.errorName ? ` (${l.errorName})` : ''
          }${l.details ? `\n  Details: ${l.details}` : ''}${l.remedy ? `\n  Remedy: ${l.remedy}` : ''}`
      )
      .join('\n\n');

    return `${header}${logLines || 'No log entries recorded yet.'}`;
  }

  private handleDisconnected() {
    this.nativeDevice = null;
    this.gattServer = null;
    this.state.isScanning = false;
    this.state.connectedDevice = null;
    this.notify();
  }
}

export const bluetoothService = new RealBluetoothService();
