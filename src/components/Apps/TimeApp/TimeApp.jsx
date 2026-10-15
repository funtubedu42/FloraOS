import React, { useState, useEffect, useRef } from 'react';
import { Clock, Timer, Hourglass, Bell, Play, Pause, RotateCcw, Plus, Trash2, Flag } from 'lucide-react';
import { useOS } from '../../../context/OSContext';
import { playClickSound, playSuccessSound, playWarningSound } from '../../../utils/audio';

export const TimeApp = () => {
  const [activeTab, setActiveTab] = useState('clock'); // 'clock' | 'stopwatch' | 'timer' | 'alarm'

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Stopwatch state
  const [swTime, setSwTime] = useState(0); // in ms
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const swIntervalRef = useRef(null);

  useEffect(() => {
    if (swRunning) {
      const startTime = Date.now() - swTime;
      swIntervalRef.current = setInterval(() => {
        setSwTime(Date.now() - startTime);
      }, 10);
    } else {
      clearInterval(swIntervalRef.current);
    }
    return () => clearInterval(swIntervalRef.current);
  }, [swRunning]);

  const handleSwToggle = () => {
    playClickSound();
    setSwRunning(!swRunning);
  };

  const handleSwReset = () => {
    playClickSound();
    setSwRunning(false);
    setSwTime(0);
    setLaps([]);
  };

  const handleSwLap = () => {
    if (!swRunning) return;
    playClickSound();
    setLaps(prev => [swTime, ...prev]);
  };

  const formatStopwatch = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

  // Timer state
  const [timerDuration, setTimerDuration] = useState(5 * 60); // default 5 mins
  const [timerRemaining, setTimerRemaining] = useState(5 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            playWarningSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning, playWarningSound]);

  const handleTimerToggle = () => {
    playClickSound();
    if (timerRemaining === 0) {
      setTimerRemaining(timerDuration);
    }
    setTimerRunning(!timerRunning);
  };

  const handleTimerReset = () => {
    playClickSound();
    setTimerRunning(false);
    setTimerRemaining(timerDuration);
  };

  const handleSetTimer = (seconds) => {
    playClickSound();
    setTimerRunning(false);
    setTimerDuration(seconds);
    setTimerRemaining(seconds);
  };

  // Alarms state
  const [alarms, setAlarms] = useState(() => {
    try {
      const saved = localStorage.getItem('flora_alarms');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'al_1', time: '07:30', label: 'Réveil Matin', enabled: true },
      { id: 'al_2', time: '14:00', label: 'Réunion d\'équipe', enabled: false }
    ];
  });
  const [newAlarmTime, setNewAlarmTime] = useState('08:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('Nouvelle alerte');

  useEffect(() => {
    try {
      localStorage.setItem('flora_alarms', JSON.stringify(alarms));
    } catch {}
  }, [alarms]);

  const toggleAlarm = (id) => {
    playClickSound();
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id) => {
    playClickSound();
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  const addAlarm = () => {
    if (!newAlarmTime) return;
    playSuccessSound();
    setAlarms(prev => [
      ...prev,
      {
        id: `al_${Date.now()}`,
        time: newAlarmTime,
        label: newAlarmLabel || 'Alarme',
        enabled: true
      }
    ]);
  };

  // World cities
  const worldCities = [
    { city: 'Paris', zone: 'Europe/Paris' },
    { city: 'Londres', zone: 'Europe/London' },
    { city: 'New York', zone: 'America/New_York' },
    { city: 'Tokyo', zone: 'Asia/Tokyo' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#090d16',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Navigation Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.65)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {[
          { id: 'clock', label: 'Horloge', icon: Clock },
          { id: 'stopwatch', label: 'Chronomètre', icon: Timer },
          { id: 'timer', label: 'Minuteur', icon: Hourglass },
          { id: 'alarm', label: 'Alarmes', icon: Bell }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { playClickSound(); setActiveTab(tab.id); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                border: isActive ? '1px solid var(--accent-color)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} color={isActive ? 'var(--accent-color)' : '#94a3b8'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* 1. HORLOGE MONDIALE */}
        {activeTab === 'clock' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
            {/* Primary Time Display */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 32px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              width: '100%',
              maxWidth: '480px'
            }}>
              <div style={{
                fontSize: '54px',
                fontWeight: 700,
                letterSpacing: '-1px',
                fontVariantNumeric: 'tabular-nums',
                color: '#fff'
              }}>
                {currentTime.toLocaleTimeString('fr-FR')}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'var(--accent-color)',
                fontWeight: 600,
                textTransform: 'capitalize',
                marginTop: '4px'
              }}>
                {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* World Clocks Grid */}
            <div style={{ width: '100%', maxWidth: '580px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                Fuseaux horaires
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {worldCities.map(c => {
                  const cityTime = new Date().toLocaleTimeString('fr-FR', { timeZone: c.zone });
                  return (
                    <div
                      key={c.city}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1' }}>{c.city}</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>
                        {cityTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. CHRONOMETRE */}
        {activeTab === 'stopwatch' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{
              fontSize: '60px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-1px',
              padding: '24px 40px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: swRunning ? 'var(--accent-color)' : '#fff'
            }}>
              {formatStopwatch(swTime)}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '14px' }}>
              <button
                onClick={handleSwToggle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: swRunning ? '#ef4444' : 'var(--accent-color)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                {swRunning ? <Pause size={16} /> : <Play size={16} />}
                {swRunning ? 'Arrêter' : 'Démarrer'}
              </button>

              <button
                onClick={handleSwLap}
                disabled={!swRunning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: swRunning ? '#fff' : '#64748b',
                  fontSize: '13px',
                  cursor: swRunning ? 'pointer' : 'not-allowed'
                }}
              >
                <Flag size={15} />
                Tour
              </button>

              <button
                onClick={handleSwReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={15} />
                Effacer
              </button>
            </div>

            {/* Laps List */}
            {laps.length > 0 && (
              <div style={{ width: '100%', maxWidth: '380px', marginTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Tours enregistrés</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {laps.map((lap, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        fontSize: '12px',
                        color: '#cbd5e1',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      <span>Tour {laps.length - index}</span>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{formatStopwatch(lap)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. MINUTEUR */}
        {activeTab === 'timer' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{
              fontSize: '60px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-1px',
              padding: '24px 44px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: timerRemaining === 0 ? '#ef4444' : (timerRunning ? 'var(--accent-color)' : '#fff')
            }}>
              {String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:{String(timerRemaining % 60).padStart(2, '0')}
            </div>

            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { label: '1 min', sec: 60 },
                { label: '3 min', sec: 180 },
                { label: '5 min', sec: 300 },
                { label: '10 min', sec: 600 },
                { label: '15 min', sec: 900 },
                { label: '30 min', sec: 1800 }
              ].map(preset => (
                <button
                  key={preset.sec}
                  onClick={() => handleSetTimer(preset.sec)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: timerDuration === preset.sec ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    border: timerDuration === preset.sec ? '1px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: timerDuration === preset.sec ? 'var(--accent-color)' : '#cbd5e1',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Timer Controls */}
            <div style={{ display: 'flex', gap: '14px' }}>
              <button
                onClick={handleTimerToggle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: timerRunning ? '#ef4444' : 'var(--accent-color)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {timerRunning ? <Pause size={16} /> : <Play size={16} />}
                {timerRunning ? 'Pause' : 'Lancer'}
              </button>

              <button
                onClick={handleTimerReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={15} />
                Réinitialiser
              </button>
            </div>
          </div>
        )}

        {/* 4. ALARMES */}
        {activeTab === 'alarm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px', margin: '0 auto' }}>
            {/* Add New Alarm */}
            <div style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                type="time"
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                placeholder="Nom du réveil"
                value={newAlarmLabel}
                onChange={(e) => setNewAlarmLabel(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
              <button
                onClick={addAlarm}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: 'var(--accent-color)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {/* Alarms list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alarms.map(alarm => (
                <div
                  key={alarm.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: alarm.enabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: alarm.enabled ? 1 : 0.6
                  }}
                >
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {alarm.time}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {alarm.label}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => toggleAlarm(alarm.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: alarm.enabled ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {alarm.enabled ? 'Activé' : 'Désactivé'}
                    </button>

                    <button
                      onClick={() => deleteAlarm(alarm.id)}
                      title="Supprimer"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
