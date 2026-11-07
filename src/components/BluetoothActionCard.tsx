import React, { useState, useEffect } from 'react';
import {
  Bluetooth,
  Battery,
  AlertTriangle,
  RefreshCw,
  Unplug,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Info,
  HelpCircle,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { bluetoothService, BluetoothServiceState } from '../services/bluetoothService.ts';
import { BluetoothConnectionLog } from './BluetoothConnectionLog.tsx';

interface BluetoothActionCardProps {
  action: {
    action: 'connect_bluetooth_device' | 'disconnect_bluetooth_device' | 'get_device_battery';
    deviceTypeHint?: string;
    deviceId?: string;
    status?: 'pending' | 'success' | 'failed' | 'cancelled';
    deviceName?: string;
    batteryLevel?: number | null;
    batteryServiceAvailable?: boolean;
    error?: string;
  };
  onNavigateToHomeDevice?: () => void;
}

export function BluetoothActionCard({ action, onNavigateToHomeDevice }: BluetoothActionCardProps) {
  const [btState, setBtState] = useState<BluetoothServiceState>(bluetoothService.getState());
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  useEffect(() => {
    return bluetoothService.subscribe((state) => {
      setBtState(state);
    });
  }, []);

  const device = btState.connectedDevice;
  const diag = btState.diagnostics;

  const handleConnect = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await bluetoothService.connectDevice(action.deviceTypeHint);
      if (res.success && res.device) {
        if (res.device.batteryLevel !== null) {
          setFeedback(`Connected to ${res.device.name}. Live battery: ${res.device.batteryLevel}%.`);
        } else {
          setFeedback(
            `Connected to ${res.device.name}. Battery service (0x180F) is not exposed by this hardware.`
          );
        }
      } else if (res.error) {
        setFeedback(res.error);
        setShowTroubleshooting(true);
      }
    } catch (err: any) {
      setFeedback(err.message || 'Connection failed.');
      setShowTroubleshooting(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await bluetoothService.disconnectDevice();
      setFeedback(res.message);
    } catch (err: any) {
      setFeedback(err.message || 'Disconnect failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBattery = async () => {
    setLoading(true);
    try {
      const res = await bluetoothService.getBatteryLevel();
      if (res.success && res.batteryLevel !== null) {
        setFeedback(`Battery level: ${res.batteryLevel}%.`);
      } else if (res.error) {
        setFeedback(res.error);
      }
    } catch (err: any) {
      setFeedback(err.message || 'Could not read battery.');
    } finally {
      setLoading(false);
    }
  };

  const openHomeDeviceTab = () => {
    if (onNavigateToHomeDevice) {
      onNavigateToHomeDevice();
    } else {
      window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'tools' } }));
      window.dispatchEvent(new CustomEvent('gkedit:open_subtool', { detail: { tool: 'device' } }));
    }
  };

  return (
    <div className="mt-3 p-4 rounded-2xl bg-[#03132e]/95 border border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] not-prose text-xs text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
            <Bluetooth className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>Home Device · Bluetooth Controller</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                GATT 0x180F
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Web Bluetooth API • Real hardware telemetry only (Zero Fake Data)
            </div>
          </div>
        </div>

        <button
          onClick={openHomeDeviceTab}
          className="text-[10.5px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition"
          title="Open in Home Device Tab"
        >
          <span>Home Device</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Main Content Area based on connection state & action */}
      {device && device.connected ? (
        // A device is currently connected
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-[#020b1c]/80 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-white text-sm">{device.name}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                Hardware ID: {device.id}
              </span>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <Unplug className="w-3 h-3" />
              <span>Disconnect</span>
            </button>
          </div>

          {/* Battery Status */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/20 flex items-center justify-between">
            <div>
              <span className="text-slate-300 font-semibold flex items-center gap-1 text-[11px]">
                {device.batteryLevel !== null ? (
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Battery Level (0x180F):</span>
              </span>

              {device.batteryLevel !== null ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-bold text-emerald-300 font-mono">
                    {device.batteryLevel}%
                  </span>
                  <div className="w-20 h-2 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      style={{ width: `${Math.min(100, Math.max(0, device.batteryLevel))}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-amber-300/90 mt-0.5 leading-tight">
                  Battery service (0x180F) is not exposed by this hardware.
                </p>
              )}
            </div>

            {device.batteryLevel !== null && (
              <button
                onClick={handleRefreshBattery}
                disabled={loading}
                className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        // No device connected
        <div className="space-y-3">
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {action.action === 'connect_bluetooth_device'
              ? 'Ready to scan and pair your Bluetooth peripheral (earbuds, smartwatch, heart-rate strap) via standard browser Web Bluetooth.'
              : 'No Bluetooth peripheral currently connected. Scan and connect your device to read GATT battery telemetry.'}
          </p>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Opening Hardware Scanner...</span>
              </>
            ) : (
              <>
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Scan & Connect Bluetooth Device</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Embedded Iframe Direct Access Action */}
      {diag.isIframe && (
        <div className="mt-3 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-2">
          <div className="text-[10.5px] text-cyan-200">
            <span className="font-semibold block text-white">Running inside preview iframe</span>
            For unrestricted Bluetooth permissions, open in a direct tab.
          </div>
          <a
            href={diag.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-[10.5px] font-bold flex items-center gap-1 transition shrink-0"
          >
            <span>Open in Tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Feedback Note */}
      {feedback && (
        <div className="mt-2.5 p-2 rounded-lg bg-cyan-950/70 border border-cyan-400/30 text-[11px] text-cyan-200 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span className="leading-tight">{feedback}</span>
        </div>
      )}

      {/* Troubleshooting Collapsible */}
      <div className="mt-3 pt-2 border-t border-white/10">
        <button
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="w-full flex items-center justify-between text-[10px] text-slate-400 hover:text-cyan-300 font-semibold cursor-pointer transition"
        >
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            <span>Bluetooth Access Checklist & Requirements</span>
          </span>
          {showTroubleshooting ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showTroubleshooting && (
          <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-1.5 text-[10.5px] text-slate-300 leading-normal">
            <div className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">1.</span>
              <span><strong>Supported Browser:</strong> Use Google Chrome or Microsoft Edge on Android, Windows, Mac, or ChromeOS. (Safari/iOS and Firefox do not support Web Bluetooth).</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">2.</span>
              <span><strong>System Bluetooth ON:</strong> Enable Bluetooth in your phone or PC system settings. On Android, also ensure Location services are active (required by Android for BLE scanning).</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">3.</span>
              <span><strong>Peripheral Pairing Mode:</strong> Put earbuds or watch into active pairing mode (e.g. hold the pairing button on the case until the LED blinks).</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">4.</span>
              <span><strong>Direct Tap Required:</strong> Web Bluetooth security forbids background scans; you must tap "Scan & Connect" directly.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold">5.</span>
              <span><strong>Zero Fake Data:</strong> Battery percentage is fetched live via standard GATT service <code>0x180F</code> (no fake numbers).</span>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Connection & Hardware Lifecycle Log */}
      <div className="mt-3">
        <BluetoothConnectionLog
          logs={btState.logs}
          isIframe={diag.isIframe}
          directUrl={diag.directUrl}
          defaultExpanded={feedback !== null || Boolean(btState.lastError)}
        />
      </div>
    </div>
  );
}
