import React, { useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import {
  Sun,
  Moon,
  Volume2,
  Wifi,
  Lock,
  Settings as SettingsIcon
} from 'lucide-react';

export const ControlCenter = ({ isOpen, onClose }) => {
  const { settings, setSettings, lockSession, openApp } = useOS();
  const panelRef = useRef(null);

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
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: '58px',
        right: '12px',
        width: '290px',
        background: 'rgba(18, 24, 38, 0.92)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '14px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        color: '#fff',
        animation: 'fadeIn 0.15s ease'
      }}
    >
      {/* Quick Action Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Wifi tile */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Wifi size={15} color="var(--accent-color)" />
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 600 }}>Wi-Fi</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Connecté</div>
          </div>
        </div>

        {/* Theme tile */}
        <div
          onClick={toggleTheme}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
        >
          {settings.theme === 'dark' ? <Moon size={15} color="#cbd5e1" /> : <Sun size={15} color="#f59e0b" />}
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 600 }}>Thème</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              {settings.theme === 'dark' ? 'Sombre' : 'Clair'}
            </div>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Luminosité */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '4px', color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sun size={12} color="#f59e0b" /> Luminosité
            </span>
            <span>{settings.brightness}%</span>
          </div>
          <input
            type="range"
            min="30"
            max="100"
            value={settings.brightness}
            onChange={(e) => setSettings(prev => ({ ...prev, brightness: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
        </div>

        {/* Volume */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '4px', color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Volume2 size={12} color="#38bdf8" /> Volume
            </span>
            <span>{settings.soundVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.soundVolume}
            onChange={(e) => setSettings(prev => ({ ...prev, soundVolume: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
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
            padding: '7px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Lock size={12} /> Verrouiller
        </button>

        <button
          onClick={() => {
            openApp('settings');
            onClose();
          }}
          style={{
            flex: 1,
            padding: '7px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <SettingsIcon size={12} /> Paramètres
        </button>
      </div>
    </div>
  );
};
