import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { APPS } from '../../constants/apps';
import { ControlCenter } from '../TopBar/ControlCenter';
import { NotificationCenter } from '../Notifications/NotificationCenter';
import {
  Wifi,
  Volume2,
  VolumeX,
  Battery,
  Bluetooth,
  Bell
} from 'lucide-react';

export const TaskBar = () => {
  const {
    windows,
    activeWindowId,
    openApp,
    focusWindow,
    minimizeWindow,
    closeWindow,
    toggleStartMenu,
    isStartMenuOpen,
    toggleNotificationCenter,
    isNotificationCenterOpen,
    notificationHistory,
    settings,
    pinnedAppIds = ['explorer', 'browser', 'store', 'imageViewer', 'videoPlayer', 'textEditor', 'time', 'calendar', 'terminal', 'settings'],
    openContextMenu
  } = useOS();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  const [hoveredAppId, setHoveredAppId] = useState(null);
  const [hoverX, setHoverX] = useState(0);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format full date & time (e.g. "mer. 14 oct. 19:49:36")
  const formattedDateTime = currentTime.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }) + '  ' + currentTime.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Dynamically include any running app that isn't pinned
  const safePinnedApps = Array.isArray(pinnedAppIds) ? pinnedAppIds : [];
  const unpinnedAppIds = [...new Set(windows.map(w => w.appId))].filter(id => !safePinnedApps.includes(id));
  const displayedAppIds = [...safePinnedApps, ...unpinnedAppIds];

  const handleAppClick = (appId) => {
    const appWindows = windows.filter(w => w.appId === appId);
    if (appWindows.length === 0) {
      openApp(appId);
    } else if (appWindows.length === 1) {
      const singleWin = appWindows[0];
      if (singleWin.isMinimized) {
        focusWindow(singleWin.id);
      } else if (activeWindowId === singleWin.id) {
        minimizeWindow(singleWin.id);
      } else {
        focusWindow(singleWin.id);
      }
    } else {
      // Multiple windows: if current active is one of them, minimize it or bring next to focus
      const activeAppWin = appWindows.find(w => w.id === activeWindowId && !w.isMinimized);
      if (activeAppWin) {
        minimizeWindow(activeAppWin.id);
      } else {
        const firstMinOrHidden = appWindows[0];
        focusWindow(firstMinOrHidden.id);
      }
    }
  };

  const handleMouseEnterApp = (e, appId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    setHoverX(centerX);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredAppId(appId);
    }, 120);
  };

  const handleMouseLeaveApp = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredAppId(null);
    }, 240);
  };

  const handleContextMenuApp = (e, appId) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredAppId(null);
    openContextMenu(e, 'app', appId);
  };

  const unreadCount = notificationHistory.length;
  const isMuted = settings.soundVolume === 0;

  // Active hover preview data
  const hoveredApp = hoveredAppId ? APPS[hoveredAppId] : null;
  const hoveredWindows = hoveredAppId ? windows.filter(w => w.appId === hoveredAppId) : [];

  return (
    <>
      <nav
        className={`flora-unified-taskbar ${settings.taskbarStyle === 'floating' ? 'floating-style' : ''}`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '48px',
          background: 'rgba(11, 15, 23, 0.94)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          zIndex: 9999,
          boxShadow: '0 -4px 25px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Left Section: Start Button & App Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* FloraOS Start Menu Trigger (Styled Emblem) */}
          <button
            onClick={toggleStartMenu}
            title="Menu des applications FloraOS (Ctrl)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: isStartMenuOpen
                ? 'var(--accent-glow)'
                : 'rgba(255, 255, 255, 0.08)',
              border: isStartMenuOpen
                ? '1px solid var(--accent-color)'
                : '1px solid rgba(255, 255, 255, 0.14)',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.2s ease',
              marginRight: '6px'
            }}
            onMouseEnter={(e) => {
              if (!isStartMenuOpen) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              if (!isStartMenuOpen) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            {/* FloraOS Start Button OS Icon (with SVG fallback) */}
            <img
              src="/apps/os_icon.png"
              alt="FloraOS"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
              }}
              style={{ width: '22px', height: '22px', objectFit: 'contain' }}
            />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'none' }}>
              <path
                d="M4 14C4 8.47715 8.47715 4 14 4H20V10C20 15.5228 15.5228 20 10 20H4V14Z"
                fill="var(--accent-color)"
                fillOpacity="0.85"
              />
              <path
                d="M20 4L11 13"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Application Launchers & Running Apps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {displayedAppIds.map(appId => {
              const app = APPS[appId];
              if (!app) return null;

              const openWindows = windows.filter(w => w.appId === appId);
              const isOpen = openWindows.length > 0;
              const isAppActive = openWindows.some(w => w.id === activeWindowId && !w.isMinimized);

              return (
                <div
                  key={appId}
                  onClick={() => handleAppClick(appId)}
                  onContextMenu={(e) => handleContextMenuApp(e, appId)}
                  onMouseEnter={(e) => handleMouseEnterApp(e, appId)}
                  onMouseLeave={handleMouseLeaveApp}
                  style={{
                    position: 'relative',
                    width: '38px',
                    height: '38px',
                    borderRadius: '9px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: isAppActive
                      ? 'rgba(255, 255, 255, 0.14)'
                      : isOpen
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Icon */}
                  <img
                    src={app.iconImg || '/apps/default_app.png'}
                    alt={app.title || app.name}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/apps/default_app.png';
                    }}
                    style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                  />

                  {/* Indicator Line / Dot beneath active app */}
                  {isOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        width: isAppActive ? '16px' : '5px',
                        height: '3px',
                        borderRadius: '3px',
                        background: isAppActive ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.45)',
                        boxShadow: isAppActive ? '0 0 6px var(--accent-color)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: System Tray & Clock Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Notifications Trigger */}
          <div
            onClick={toggleNotificationCenter}
            title="Centre de notifications"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '7px',
              cursor: 'pointer',
              color: '#cbd5e1',
              background: isNotificationCenterOpen ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => {
              if (!isNotificationCenterOpen) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  minWidth: '14px',
                  height: '14px',
                  padding: '0 3px',
                  borderRadius: '10px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(0, 0, 0, 0.4)'
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          {/* Quick Controls Cluster (Tray) */}
          <div
            onClick={() => setIsControlCenterOpen(!isControlCenterOpen)}
            title="Paramètres rapides"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '5px 10px',
              borderRadius: '9px',
              background: isControlCenterOpen ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              color: '#e2e8f0',
              fontSize: '12px',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isControlCenterOpen) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              if (!isControlCenterOpen) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <Wifi size={14} style={{ opacity: 0.9 }} />
            <Bluetooth size={14} style={{ opacity: 0.85 }} />
            {isMuted ? <VolumeX size={14} color="#f87171" /> : <Volume2 size={14} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Battery size={15} color="#34d399" />
              <span style={{ fontSize: '11px', fontWeight: 600 }}>100 %</span>
            </div>
          </div>

          {/* Localized Date & Seconds Clock - Clic gauche ouvre le calendrier */}
          <div
            onClick={() => openApp('calendar')}
            onContextMenu={(e) => {
              e.preventDefault();
              openApp('time');
            }}
            title="Clic gauche: Calendrier FloraOS | Clic droit: Horloge & Minuteur"
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.92)',
              letterSpacing: '0.2px',
              padding: '4px 8px',
              borderRadius: '7px',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {formattedDateTime}
          </div>
        </div>
      </nav>

      {/* Taskbar Hover Popover: Window Tabs Thumbnail Preview OR App Title Tooltip */}
      {hoveredApp && hoveredWindows.length === 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '56px',
            left: `${hoverX}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '8px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#f8fafc',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10001,
            animation: 'fadeInUp 0.15s ease'
          }}
        >
          {hoveredApp.title}
        </div>
      )}

      {hoveredApp && hoveredWindows.length > 0 && (
        <div
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeaveApp}
          style={{
            position: 'fixed',
            bottom: '56px',
            left: `${Math.max(100, Math.min(hoverX, window.innerWidth - (hoveredWindows.length * 175) / 2 - 20))}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '12px',
            padding: '8px',
            display: 'flex',
            gap: '8px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
            zIndex: 10001,
            animation: 'fadeInUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {hoveredWindows.map(w => {
            const isFocused = w.id === activeWindowId && !w.isMinimized;
            return (
              <div
                key={w.id}
                onClick={() => {
                  focusWindow(w.id);
                  setHoveredAppId(null);
                }}
                style={{
                  width: '165px',
                  borderRadius: '9px',
                  background: isFocused ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.05)',
                  border: isFocused ? '1px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'}
                onMouseLeave={(e) => e.currentTarget.style.background = isFocused ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.05)'}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '125px' }}>
                    <img
                      src={hoveredApp.iconImg || '/apps/default_app.png'}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/apps/default_app.png';
                      }}
                      style={{ width: '13px', height: '13px', objectFit: 'contain' }}
                    />
                    {w.title || hoveredApp.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeWindow(w.id);
                      if (hoveredWindows.length <= 1) setHoveredAppId(null);
                    }}
                    title="Fermer cette fenêtre"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      padding: '1px 5px',
                      lineHeight: 1,
                      fontSize: '11px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.85)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    ✕
                  </button>
                </div>

                {/* Mini Window Preview Surface */}
                <div style={{
                  height: '82px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '13px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 6px',
                    gap: '3px'
                  }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  </div>

                  <img
                    src={hoveredApp.iconImg || '/apps/default_app.png'}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/apps/default_app.png';
                    }}
                    style={{ width: '28px', height: '28px', objectFit: 'contain', opacity: 0.9, marginTop: '8px' }}
                  />
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', maxWidth: '145px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.isMinimized ? 'Fenêtre réduite' : (w.title || hoveredApp.title)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Control Center Flyout */}
      <ControlCenter
        isOpen={isControlCenterOpen}
        onClose={() => setIsControlCenterOpen(false)}
      />

      {/* Notification Center Drawer */}
      <NotificationCenter />
    </>
  );
};
