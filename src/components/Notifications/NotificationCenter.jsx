import React, { useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { DynamicIcon } from '../../utils/IconHelper';
import { getAssetPath } from '../../utils/paths';
import { Bell, Trash2, X, Calendar as CalendarIcon, Clock } from 'lucide-react';

export const NotificationCenter = () => {
  const {
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    notificationHistory,
    dismissNotification,
    clearAllNotifications,
    openApp
  } = useOS();

  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest('.notification-trigger')) {
        setIsNotificationCenterOpen(false);
      }
    };
    if (isNotificationCenterOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationCenterOpen, setIsNotificationCenterOpen]);

  if (!isNotificationCenterOpen) return null;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Récemment';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: '58px',
        right: '12px',
        width: '340px',
        maxHeight: '480px',
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(36px)',
        WebkitBackdropFilter: 'blur(36px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
        zIndex: 10000,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      role="region"
      aria-label="Centre de notifications"
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600 }}>
          <Bell size={15} color="var(--accent-color)" />
          <span>Notifications</span>
          {notificationHistory.length > 0 && (
            <span style={{
              background: 'var(--accent-color)',
              color: '#fff',
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '999px',
              fontWeight: 700
            }}>
              {notificationHistory.length}
            </span>
          )}
        </div>

        {notificationHistory.length > 0 && (
          <button
            onClick={clearAllNotifications}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <Trash2 size={12} /> Tout effacer
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notificationHistory.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            color: '#64748b',
            textAlign: 'center',
            gap: '8px'
          }}>
            <Bell size={32} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: '13px', fontWeight: 500 }}>Aucune notification</div>
            <div style={{ fontSize: '11px' }}>Vos alertes et messages système apparaîtront ici.</div>
          </div>
        ) : (
          notificationHistory.map(notif => (
            <div
              key={notif.id}
              style={{
                position: 'relative',
                background: notif.isWarning ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                border: notif.isWarning ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                transition: 'background 0.15s ease'
              }}
            >
              {/* Icon / Image */}
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: notif.isWarning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {notif.icon?.startsWith('/') ? (
                  <img src={getAssetPath(notif.icon)} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                ) : (
                  <DynamicIcon
                    name={notif.icon || 'Bell'}
                    size={16}
                    color={notif.isWarning ? '#ef4444' : 'var(--accent-color)'}
                  />
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: notif.isWarning ? '#fca5a5' : '#fff' }}>
                    {notif.title}
                  </div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {formatTimestamp(notif.timestamp)}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '2px', lineHeight: 1.35 }}>
                  {notif.message}
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => dismissNotification(notif.id)}
                title="Supprimer"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                <X size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Quick App Launchers */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <button
          onClick={() => {
            openApp('calendar');
            setIsNotificationCenterOpen(false);
          }}
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#e2e8f0',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          <CalendarIcon size={13} style={{ color: '#38bdf8' }} />
          Calendrier
        </button>

        <button
          onClick={() => {
            openApp('time');
            setIsNotificationCenterOpen(false);
          }}
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#e2e8f0',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          <Clock size={13} style={{ color: '#06b6d4' }} />
          Horloge
        </button>
      </div>
    </div>
  );
};
