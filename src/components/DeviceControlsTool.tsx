import React, { useState, useEffect } from 'react';
import {
  Flashlight,
  FlashlightOff,
  MapPin,
  MapPinOff,
  ExternalLink,
  Eye,
  Vibrate,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Compass,
  Bluetooth,
  Battery,
  BatteryCharging,
  RefreshCw,
  Unplug,
  Zap,
  Radio,
  Check,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { deviceControls, DeviceControlState } from '../services/deviceControls.ts';
import { bluetoothService, BluetoothServiceState } from '../services/bluetoothService.ts';
import { BluetoothConnectionLog } from './BluetoothConnectionLog.tsx';

export function DeviceControlsTool() {
  const [controls, setControls] = useState<DeviceControlState>(deviceControls.state);
  const [torchLoading, setTorchLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [vibrateStatus, setVibrateStatus] = useState<string | null>(null);

  // Real Web Bluetooth Hardware State
  const [btState, setBtState] = useState<BluetoothServiceState>(bluetoothService.getState());
  const [btLoading, setBtLoading] = useState(false);
  const [batteryRefreshing, setBatteryRefreshing] = useState(false);
  const [btFeedback, setBtFeedback] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  useEffect(() => {
    // Subscribe to device control updates
    const unsubscribeControls = deviceControls.subscribe((newState) => {
      setControls(newState);
    });

    // Subscribe to real Bluetooth hardware updates
    const unsubscribeBt = bluetoothService.subscribe((newBtState) => {
      setBtState(newBtState);
    });

    // Clean up when unmounting (screen closes)
    return () => {
      unsubscribeControls();
      unsubscribeBt();
      // Release camera and location
      deviceControls.turnOffTorch();
      deviceControls.stopLocation();
    };
  }, []);

  const handleToggleTorch = async () => {
    setTorchLoading(true);
    try {
      await deviceControls.toggleTorch();
    } catch {
      // Error is saved in deviceControls.state.torchError
    } finally {
      setTorchLoading(false);
    }
  };

  const handleToggleLocation = async () => {
    if (controls.locationActive) {
      deviceControls.stopLocation();
    } else {
      setLocationLoading(true);
      try {
        await deviceControls.startLocation();
      } catch {
        // Error saved in controls.locationError
      } finally {
        setLocationLoading(false);
      }
    }
  };

  const handleVibrateTest = () => {
    const success = deviceControls.triggerVibration([120, 60, 120, 60, 150]);
    if (success) {
      setVibrateStatus('Vibrated successfully! 📳');
    } else {
      setVibrateStatus('Vibration not supported on this browser/OS.');
    }
    setTimeout(() => setVibrateStatus(null), 3000);
  };

  // Real Web Bluetooth Handlers
  const handleConnectBluetooth = async () => {
    setBtLoading(true);
    setBtFeedback(null);
    try {
      const res = await bluetoothService.connectDevice();
      if (res.success && res.device) {
        if (res.device.batteryLevel !== null) {
          setBtFeedback(`Connected to ${res.device.name}. Live battery: ${res.device.batteryLevel}%.`);
        } else {
          setBtFeedback(
            `Connected to ${res.device.name}. Battery service (0x180F) is not exposed by this device.`
          );
        }
      } else if (res.error) {
        setBtFeedback(res.error);
      }
    } catch (err: any) {
      setBtFeedback(err.message || 'Bluetooth connection failed.');
    } finally {
      setBtLoading(false);
    }
  };

  const handleDisconnectBluetooth = async () => {
    setBtLoading(true);
    try {
      const res = await bluetoothService.disconnectDevice();
      setBtFeedback(res.message);
    } catch (err: any) {
      setBtFeedback(err.message || 'Disconnect failed.');
    } finally {
      setBtLoading(false);
    }
  };

  const handleRefreshBattery = async () => {
    setBatteryRefreshing(true);
    try {
      const res = await bluetoothService.getBatteryLevel();
      if (res.success && res.batteryLevel !== null) {
        setBtFeedback(`Updated battery level: ${res.batteryLevel}%.`);
      } else if (res.error) {
        setBtFeedback(res.error);
      }
    } catch (err: any) {
      setBtFeedback(err.message || 'Battery refresh failed.');
    } finally {
      setBatteryRefreshing(false);
    }
  };

  const device = btState.connectedDevice;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Title & Status */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <span>Home Device & Bluetooth Hub</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Real hardware peripherals, Web Bluetooth (0x180F GATT), flashlight torch & sensor controls.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Hardware Engine
          </span>
        </div>
      </div>

      {/* 1. Real Bluetooth Peripheral Hardware Card (Zero Fake Data) */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#02132b]/95 via-[#030e24]/90 to-[#020a1c] border border-cyan-400/35 shadow-[0_4px_24px_rgba(6,182,212,0.15)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Bluetooth className={`w-5 h-5 ${device?.connected ? 'text-cyan-300 animate-pulse' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Bluetooth Peripheral Manager</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-cyan-300 border border-cyan-500/30">
                  GATT 0x180F
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Connect real earbuds, smartwatch, or accessories via Web Bluetooth API.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {btState.isSupported ? (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                API Supported
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Chrome/Android Only
              </span>
            )}
          </div>
        </div>

        {/* Device Connection State */}
        {device && device.connected ? (
          // Connected Real Device View
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#031535]/80 border border-cyan-400/30 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h4 className="text-base font-bold text-white tracking-wide">{device.name}</h4>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Hardware ID: {device.id}
                  </p>
                </div>

                <button
                  onClick={handleDisconnectBluetooth}
                  disabled={btLoading}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Disconnect Peripheral"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>

              {/* Battery Telemetry Section */}
              <div className="pt-2 border-t border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    {device.batteryLevel !== null ? (
                      <Battery className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    <span>Battery Status (0x180F):</span>
                  </span>

                  {device.batteryLevel !== null ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 font-mono">
                        {device.batteryLevel}%
                      </span>
                      <div className="w-28 h-3 rounded-full bg-slate-900 border border-slate-700 overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, device.batteryLevel))}%`,
                            background:
                              device.batteryLevel > 40
                                ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                                : device.batteryLevel > 20
                                ? '#f59e0b'
                                : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                      Battery service (0x180F) is not exposed by this hardware. The peripheral is active, but does not provide standard GATT battery level telemetry.
                    </p>
                  )}
                </div>

                {device.batteryLevel !== null && (
                  <button
                    onClick={handleRefreshBattery}
                    disabled={batteryRefreshing}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                    title="Read live battery characteristic"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${batteryRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh Telemetry</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Disconnected / Idle State
          <div className="p-4 rounded-2xl bg-[#020a1a]/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-slate-400" />
                <span>No Bluetooth Peripheral Connected</span>
              </span>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                Ready to scan and pair real hardware (earbuds, smartwatch, heart-rate strap, fitness tracker).
                Zero fake data: communicates strictly through your device's Bluetooth radio.
              </p>
            </div>

            <button
              onClick={handleConnectBluetooth}
              disabled={btLoading}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.35)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {btLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning Devices...</span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4" />
                  <span>Scan & Connect Peripheral</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Embedded Iframe Direct Access Action */}
        {btState.diagnostics?.isIframe && (
          <div className="mt-3 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs text-cyan-200">
              <span className="font-bold text-white block">Embedded Preview Detected</span>
              If your browser blocks Bluetooth in the preview iframe, open in a dedicated tab with full OS hardware access.
            </div>
            <a
              href={btState.diagnostics.directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0"
            >
              <span>Launch in Direct Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Live Feedback Toast */}
        {btFeedback && (
          <div className="mt-3 p-3 rounded-2xl bg-cyan-950/70 border border-cyan-400/30 text-xs text-cyan-200 flex items-start justify-between gap-2">
            <span className="flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span className="leading-tight">{btFeedback}</span>
            </span>
            <button
              onClick={() => setBtFeedback(null)}
              className="text-slate-400 hover:text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Troubleshooting & Bluetooth Requirements Checklist */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <button
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-cyan-300 font-semibold cursor-pointer transition"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bluetooth Hardware Access & Troubleshooting Checklist</span>
            </span>
            {showTroubleshooting ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTroubleshooting && (
            <div className="mt-3 p-3.5 rounded-2xl bg-[#020919]/90 border border-cyan-500/20 space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-white">Supported Browser:</strong> Web Bluetooth requires Google Chrome, Microsoft Edge, or Opera on Android, Windows, macOS, or ChromeOS. Apple iOS Safari and Firefox do not support Web Bluetooth.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-white">Turn Bluetooth ON:</strong> Ensure Bluetooth is enabled in your device's OS system settings. On Android, also ensure Location services are active (required by Android for BLE scanning).
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-white">Peripheral Pairing Mode:</strong> Put your earbuds, smartwatch, or sensor in active pairing mode (e.g. hold the pairing button on your earbuds case until the indicator blinks).
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-white">User Gesture Required:</strong> Due to browser security constraints, Bluetooth scanning cannot be initiated silently in the background—it requires you to directly tap "Scan & Connect Peripheral".
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">5</span>
                <div>
                  <strong className="text-white">Zero Fake Data:</strong> Battery percentage is queried strictly from the real peripheral via GATT service <code className="text-cyan-300">0x180F</code> (Characteristic <code className="text-cyan-300">0x2A19</code>).
                </div>
              </div>
            </div>
          )}

          {/* Real-time Connection & Hardware Lifecycle Log */}
          <div className="mt-4">
            <BluetoothConnectionLog
              logs={btState.logs}
              isIframe={btState.diagnostics?.isIframe}
              directUrl={btState.diagnostics?.directUrl}
              defaultExpanded={true}
            />
          </div>
        </div>
      </div>

      {/* Grid: Torch & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Torch (Flashlight) Card */}
        <div className={`p-5 rounded-3xl bg-[#040e24]/90 border transition-all duration-200 ${
          controls.torchOn ? 'border-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.25)]' : 'border-cyan-500/25'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
              controls.torchOn ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-900 text-slate-400'
            }`}>
              {controls.torchOn ? <Flashlight className="w-6 h-6 animate-pulse" /> : <FlashlightOff className="w-6 h-6" />}
            </div>
            {/* Toggle Switch */}
            <button
              onClick={handleToggleTorch}
              disabled={torchLoading}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                controls.torchOn ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
              title="Toggle Rear Flashlight Torch"
            >
              {torchLoading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin mx-auto" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
              )}
            </button>
          </div>

          <h3 className="text-base font-bold text-white">Rear Camera Torch</h3>
          <p className="text-xs text-slate-400 mt-1">
            Uses rear camera environment stream with <code className="text-cyan-300 text-[11px]">torch: true</code> constraint.
          </p>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status:</span>
            <span className={`font-semibold ${controls.torchOn ? 'text-amber-300' : 'text-slate-400'}`}>
              {controls.torchOn ? 'ON (Illuminating)' : 'OFF (Sensor Released)'}
            </span>
          </div>

          {/* Torch Error Message */}
          {controls.torchError && (
            <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{controls.torchError}</span>
            </div>
          )}
        </div>

        {/* 2. Location (GPS Geolocation) Card */}
        <div className={`p-5 rounded-3xl bg-[#040e24]/90 border transition-all duration-200 ${
          controls.locationActive ? 'border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.25)]' : 'border-cyan-500/25'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
              controls.locationActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-400'
            }`}>
              {controls.locationActive ? <MapPin className="w-6 h-6 animate-bounce" /> : <MapPinOff className="w-6 h-6" />}
            </div>
            {/* Toggle Switch */}
            <button
              onClick={handleToggleLocation}
              disabled={locationLoading}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                controls.locationActive ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
              title="Toggle Precision Geolocation"
            >
              {locationLoading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin mx-auto" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
              )}
            </button>
          </div>

          <h3 className="text-base font-bold text-white">Live Geolocation</h3>
          <p className="text-xs text-slate-400 mt-1">
            Streams continuous high-accuracy coordinates via <code className="text-cyan-300 text-[11px]">watchPosition</code>.
          </p>

          {/* Location Coordinates & Open Maps button */}
          {controls.locationData ? (
            <div className="mt-3 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Latitude:</span>
                <span className="font-mono text-cyan-300 font-bold">{controls.locationData.latitude.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Longitude:</span>
                <span className="font-mono text-cyan-300 font-bold">{controls.locationData.longitude.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Accuracy:</span>
                <span className="font-mono text-emerald-400 font-semibold">±{controls.locationData.accuracy} meters</span>
              </div>
              <div className="pt-2">
                <a
                  href={`https://www.google.com/maps?q=${controls.locationData.latitude},${controls.locationData.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold flex items-center justify-center gap-1.5 transition text-xs border border-cyan-500/40"
                >
                  <span>Open on Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">Status:</span>
              <span className="text-slate-400 font-semibold">Inactive (GPS sensor idle)</span>
            </div>
          )}

          {/* Location Error & Instructions */}
          {controls.locationError && (
            <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 space-y-1">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{controls.locationError}</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-6">
                Note: A website cannot toggle the phone's physical GPS master switch. Turn ON Location in phone settings first.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Extras: Wake Lock, Vibration, Fullscreen, Volume & Theme */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>Device Utilities & Extras</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Wake Lock */}
          <div className="p-3.5 rounded-2xl bg-[#03091b] border border-cyan-500/20 flex items-center justify-between">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Keep Screen Awake</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Prevents screen timeout during work.</p>
            </div>
            <button
              onClick={() => deviceControls.toggleWakeLock()}
              className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                controls.wakeLockActive ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Vibration Test */}
          <div className="p-3.5 rounded-2xl bg-[#03091b] border border-cyan-500/20 flex items-center justify-between">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                <Vibrate className="w-4 h-4 text-purple-400" />
                <span>Haptic Vibration Test</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Sends triple pulse to haptic motor.</p>
            </div>
            <button
              onClick={handleVibrateTest}
              className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:bg-purple-900/60 font-semibold cursor-pointer"
            >
              Test Pulse
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#03091b] border border-cyan-500/20 flex items-center justify-between">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                {controls.isFullscreen ? <Minimize className="w-4 h-4 text-emerald-400" /> : <Maximize className="w-4 h-4 text-emerald-400" />}
                <span>Fullscreen Mode</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Immersive view without browser chrome.</p>
            </div>
            <button
              onClick={() => deviceControls.toggleFullscreen()}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 font-semibold cursor-pointer"
            >
              {controls.isFullscreen ? 'Exit' : 'Enter'}
            </button>
          </div>

          {/* Light / Dark Mode Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#03091b] border border-cyan-500/20 flex items-center justify-between">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                {controls.theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <span>Display Theme</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Current: {controls.theme === 'dark' ? 'Liquid Dark' : 'Bright'}</p>
            </div>
            <button
              onClick={() => deviceControls.toggleTheme()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold cursor-pointer"
            >
              Toggle
            </button>
          </div>
        </div>

        {/* Vibration Status Toast */}
        {vibrateStatus && (
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{vibrateStatus}</span>
          </div>
        )}

        {/* App Volume Slider */}
        <div className="p-4 rounded-2xl bg-[#03091b] border border-cyan-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              {controls.appVolume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span>Speech & Sound Volume</span>
            </span>
            <span className="font-mono text-cyan-300 font-bold">{controls.appVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={controls.appVolume}
            onChange={(e) => deviceControls.setAppVolume(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Voice & Chat Commands Reference */}
      <div className="p-4 rounded-3xl bg-blue-950/40 border border-cyan-500/25 text-xs space-y-2">
        <p className="font-bold text-cyan-300 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Home Device & Bluetooth Voice Commands</span>
        </p>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Speak or type these commands in Chat or Live Voice to control peripherals and sensors:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-cyan-500/20 text-cyan-200 font-mono text-center">
            "connect my earbuds"
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-cyan-500/20 text-cyan-200 font-mono text-center">
            "get device battery"
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-cyan-500/20 text-cyan-200 font-mono text-center">
            "turn on torch"
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-cyan-500/20 text-cyan-200 font-mono text-center">
            "start location"
          </span>
        </div>
      </div>
    </div>
  );
}
