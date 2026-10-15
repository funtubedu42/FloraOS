import React, { useRef, useEffect, useState } from 'react';
import { useOS } from '../../context/OSContext';
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Wifi,
  Lock,
  Settings as SettingsIcon,
  Bluetooth,
  BellOff,
  Bell,
  Maximize2,
  Minimize2,
  Battery,
  BatteryCharging,
  Sparkles
} from 'lucide-react';

export const ControlCenter = ({ isOpen, onClose }) => {
  const { settings, setSettings, lockSession, openApp, playClickSound } = useOS();
  const panelRef = useRef(null);

  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [bluetoothActive, setBluetoothActive] = useState(true);
  const [wifiActive, setWifiActive] = useState(true);
  const [dndActive, setDndActive] = useState(false);

  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);
        battery.addEventListener('levelchange', () => setBatteryLevel(Math.round(battery.level * 100)));
        battery.addEventListener('chargingchange', () => setIsCharging(battery.charging));
      }).catch(() => {});
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleTheme = () => {
    playClickSound();
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const toggleSoundEffects = () => {
    playClickSound();
    setSettings(prev => ({
      ...prev,
      soundEffectsEnabled: prev.soundEffectsEnabled === false ? true : false
    }));
  };

  const toggleFullscreen = () => {
    playClickSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: '58px',
        right: '12px',
        width: '320px',
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(36px)',
        WebkitBackdropFilter: 'blur(36px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        padding: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        color: '#fff',
        animation: 'fadeIn 0.15s ease'
      }}
    >
      {/* Header Info: User / Battery */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
          <Sparkles size={14} color="var(--accent-color, #38bdf8)" />
          <span>Centre de Contrôle</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
          {isCharging ? <BatteryCharging size={14} color="#10b981" /> : <Battery size={14} color="#38bdf8" />}
          <span>{batteryLevel}%</span>
        </div>
      </div>

      {/* Quick Action Tiles (Grid 2x2 or 3x2) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Wifi tile */}
        <div
          onClick={() => {
            playClickSound();
            setWifiActive(prev => !prev);
          }}
          style={{
            background: wifiActive ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.05)',
            border: wifiActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Wifi size={16} color={wifiActive ? '#38bdf8' : '#64748b'} />
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 600 }}>Wi-Fi</div>
            <div style={{ fontSize: '10px', color: wifiActive ? '#94a3b8' : '#64748b' }}>
              {wifiActive ? 'Connecté' : 'Désactivé'}
            </div>
          </div>
        </div>

        {/* Bluetooth tile */}
        <div
          onClick={() => {
            playClickSound();
            setBluetoothActive(prev => !prev);
          }}
          style={{
            background: bluetoothActive ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.05)',
            border: bluetoothActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Bluetooth size={16} color={bluetoothActive ? '#38bdf8' : '#64748b'} />
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 600 }}>Bluetooth</div>
            <div style={{ fontSize: '10px', color: bluetoothActive ? '#94a3b8' : '#64748b' }}>
              {bluetoothActive ? 'Activé' : 'Désactivé'}
            </div>
          </div>
        </div>

        {/* Theme tile */}
        <div
          onClick={toggleTheme}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {settings.theme === 'dark' ? <Moon size={16} color="#a5b4fc" /> : <Sun size={16} color="#f59e0b" />}
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 600 }}>Thème</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              {settings.theme === 'dark' ? 'Sombre' : 'Clair'}
            </div>
          </div>
        </div>

        {/* Fullscreen tile */}
        <div
          onClick={toggleFullscreen}
          style={{
            background: isFullscreen ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.05)',
            border: isFullscreen ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {isFullscreen ? <Minimize2 size={16} color="#10b981" /> : <Maximize2 size={16} color="#cbd5e1" />}
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 600 }}>Plein Écran</div>
            <div style={{ fontSize: '10px', color: isFullscreen ? '#34d399' : '#94a3b8' }}>
              {isFullscreen ? 'Actif' : 'Fenêtré'}
            </div>
          </div>
        </div>
      </div>

      {/* Sliders: Luminosité & Volume */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Luminosité */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px', color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sun size={13} color="#f59e0b" /> Luminosité
            </span>
            <span style={{ fontWeight: 600 }}>{settings.brightness}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={settings.brightness}
            onChange={(e) => setSettings(prev => ({ ...prev, brightness: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: 'var(--accent-color, #38bdf8)', cursor: 'pointer' }}
          />
        </div>

        {/* Volume */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px', color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {settings.soundVolume === 0 ? <VolumeX size={13} color="#ef4444" /> : <Volume2 size={13} color="#38bdf8" />} Volume
            </span>
            <span style={{ fontWeight: 600 }}>{settings.soundVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.soundVolume}
            onChange={(e) => setSettings(prev => ({ ...prev, soundVolume: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: 'var(--accent-color, #38bdf8)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => {
            lockSession();
            onClose();
          }}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            fontSize: '11.5px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Lock size={13} /> Verrouiller
        </button>

        <button
          onClick={() => {
            openApp('settings');
            onClose();
          }}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            fontSize: '11.5px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <SettingsIcon size={13} /> Paramètres
        </button>
      </div>
    </div>
  );
};
