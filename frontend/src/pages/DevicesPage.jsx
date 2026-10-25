import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Watch,
  Activity,
  Heart,
  Wind,
  Thermometer,
  Smartphone,
  Bluetooth,
  Gauge,
  BatteryMedium,
  CheckCircle2,
  RefreshCw,
  Plus,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';

const DEFAULT_DEVICES = [
  {
    id: 'dev_watch',
    name: 'VitaBridge Smartwatch V3',
    type: 'smartwatch',
    manufacturer: 'VitaBridge Health',
    status: 'connected',
    batteryLevel: 86,
    lastSync: '1 min ago',
    availableSignals: ['Heart Rate (PPG)', 'HRV (RMSSD)', 'SpO2', 'Skin Temp', 'Steps', 'Sleep Stages'],
    icon: Watch,
  },
  {
    id: 'dev_band',
    name: 'BioTrack Continuous Band',
    type: 'fitness_band',
    manufacturer: 'BioTrack Systems',
    status: 'connected',
    batteryLevel: 72,
    lastSync: '4 mins ago',
    availableSignals: ['Movement Intensity', 'Daily Steps', 'Caloric Burn', 'Resting Pulse'],
    icon: Activity,
  },
  {
    id: 'dev_oximeter',
    name: 'OxyPulse BLE Oximeter',
    type: 'pulse_oximeter',
    manufacturer: 'PulseTech Medical',
    status: 'connected',
    batteryLevel: 94,
    lastSync: '12 mins ago',
    availableSignals: ['SpO2 Saturation', 'Pulse Rate', 'Perfusion Index'],
    icon: Wind,
  },
  {
    id: 'dev_bp',
    name: 'CardioGrip Blood Pressure Cuff',
    type: 'bp_monitor',
    manufacturer: 'CardioGrip Inc.',
    status: 'connected',
    batteryLevel: 65,
    lastSync: '35 mins ago',
    availableSignals: ['Systolic Pressure', 'Diastolic Pressure', 'Mean Arterial Pressure'],
    icon: Gauge,
  },
  {
    id: 'dev_temp',
    name: 'ThermoCore Infrared Sensor',
    type: 'temp_sensor',
    manufacturer: 'ThermoCore Labs',
    status: 'connected',
    batteryLevel: 88,
    lastSync: '18 mins ago',
    availableSignals: ['Tympanic Temp', 'Continuous Surface Temp'],
    icon: Thermometer,
  },
  {
    id: 'dev_phone',
    name: 'Smartphone Internal Sensors',
    type: 'smartphone',
    manufacturer: 'Apple / Google',
    status: 'connected',
    batteryLevel: 81,
    lastSync: 'Just now',
    availableSignals: ['Optical Camera rPPG', 'Microphone Acoustics', 'Accelerometer Movement', 'GPS Routine'],
    icon: Smartphone,
  },
  {
    id: 'dev_bluetooth',
    name: 'Acoustic Chest Sensor (BLE)',
    type: 'bluetooth',
    manufacturer: 'AcuBio Medical',
    status: 'standby',
    batteryLevel: 55,
    lastSync: '2 hours ago',
    availableSignals: ['Respiratory Cadence', 'Tracheal Acoustic Events', 'Heart Sounds'],
    icon: Bluetooth,
  },
];

export default function DevicesPage() {
  const [devicesList, setDevicesList] = useState(DEFAULT_DEVICES);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const handleSimulateSync = async (deviceId) => {
    setIsSyncing(true);
    setSyncStatus(`Synchronizing telemetry stream from ${deviceId}...`);

    setTimeout(() => {
      setDevicesList((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, lastSync: 'Just now', status: 'connected' } : d))
      );
      setIsSyncing(false);
      setSyncStatus('Synchronization complete. All biometric packets verified and ingested.');
      setTimeout(() => setSyncStatus(null), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Hardware Ecosystem
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Section 18 Sensor Integration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Connected Devices & Biometric Sensors
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Architecture for Smartwatch, Fitness Band, Pulse Oximeter, Blood Pressure Monitor, Temperature Sensor, Bluetooth telemetry, and Smartphone sensors.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-teal-200 bg-teal-950/80 px-4 py-2.5 rounded-2xl border border-teal-700/50 self-start sm:self-auto">
            <Radio className="w-4 h-4 text-emerald-400 live-pulse shrink-0" />
            <span>Multi-Device Synchronization Active</span>
          </div>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Devices Grid per Section 18 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devicesList.map((device) => {
          const Icon = device.icon;
          const isConnected = device.status === 'connected';

          return (
            <div
              key={device.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card transition-all hover:shadow-md flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Top Row: Icon, Name, Connection Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{device.name}</h3>
                      <p className="text-[11px] text-slate-400 capitalize">{device.manufacturer}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isConnected ? 'bg-emerald-500 live-indicator' : 'bg-slate-400'}`}></span>
                    {isConnected ? 'Connected' : 'Standby'}
                  </span>
                </div>

                {/* Telemetry info: Battery & Last Sync */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <BatteryMedium className="w-4 h-4 text-slate-400" />
                    <span>Battery: <strong className="text-slate-900">{device.batteryLevel}%</strong></span>
                  </div>
                  <div className="text-right text-slate-500 text-[11px]">
                    Sync: <strong className="text-slate-700">{device.lastSync}</strong>
                  </div>
                </div>

                {/* Available Signals Tags */}
                <div className="pt-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Available Signals
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {device.availableSignals.map((sig, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-700"
                      >
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Bluetooth LE Encrypted</span>
                <button
                  type="button"
                  onClick={() => handleSimulateSync(device.id)}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Simulate Sync</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
