import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { ControlCenter } from './ControlCenter';
import { NotificationCenter } from '../Notifications/NotificationCenter';
import {
  Wifi,
  Battery,
  Bell
} from 'lucide-react';

export const TopBar = () => {
  const {
    windows,
    activeWindowId,
    toggleStartMenu,
    isStartMenuOpen,
    toggleNotificationCenter,
    isNotificationCenterOpen,
    notificationHistory
  } = useOS();

  const [time, setTime] = useState(new Date());
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeWindow = windows.find(w => w.id === activeWindowId && !w.isMinimized);

  const formattedTime = time.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedDate = time.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const unreadCount = notificationHistory.length;

  return (
    <header className="flora-topbar">
      {/* Left: Brand Button (opens Start Menu) & Active Window */}
      <div className="topbar-left">
        <div
          className="topbar-item start-menu-trigger"
          style={{
            fontWeight: 600,
            gap: '6px',
            background: isStartMenuOpen ? 'rgba(255, 255, 255, 0.15)' : 'transparent'
          }}
          onClick={toggleStartMenu}
          title="Ouvrir le menu d'applications FloraOS"
        >
          <span>🌿</span>
          <span>FloraOS</span>
        </div>

        {activeWindow && (
          <div
            className="topbar-item"
            style={{
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '12px'
            }}
          >
            {activeWindow.title.split('—')[0].trim()}
          </div>
        )}
      </div>

      {/* Right: Clean minimal status cluster & Notifications */}
      <div className="topbar-right">
        {/* Notifications Bell */}
        <div
          className="topbar-item notification-trigger"
          onClick={toggleNotificationCenter}
          title="Centre de notifications"
          style={{
            position: 'relative',
            background: isNotificationCenterOpen ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            padding: '4px 7px'
          }}
        >
          <Bell size={13} style={{ opacity: 0.9 }} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#ef4444'
            }} />
          )}
        </div>

        {/* Status cluster (Wifi, Battery, Date & Time) */}
        <div
          className="topbar-item"
          onClick={() => setIsControlCenterOpen(!isControlCenterOpen)}
          title="Centre de contrôle"
          style={{
            gap: '10px',
            padding: '3px 10px',
            borderRadius: '8px',
            background: isControlCenterOpen ? 'rgba(255, 255, 255, 0.15)' : 'transparent'
          }}
        >
          <Wifi size={13} style={{ opacity: 0.85 }} />
          <Battery size={13} style={{ opacity: 0.85 }} />
          <span style={{ fontSize: '11px', opacity: 0.75 }}>{formattedDate}</span>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>{formattedTime}</span>
        </div>
      </div>

      {/* Control Center Flyout */}
      <ControlCenter
        isOpen={isControlCenterOpen}
        onClose={() => setIsControlCenterOpen(false)}
      />

      {/* Notification Center Drawer */}
      <NotificationCenter />
    </header>
  );
};
