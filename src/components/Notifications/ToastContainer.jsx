import React from 'react';
import { useOS } from '../../context/OSContext';
import { DynamicIcon } from '../../utils/IconHelper';
import { getAssetPath } from '../../utils/paths';
import { X } from 'lucide-react';

export const ToastContainer = () => {
  const { notifications, dismissNotification } = useOS();

  if (notifications.length === 0) return null;

  return (
    <div className="flora-toast-container" aria-live="polite" role="status">
      {notifications.slice(-3).map(n => (
        <div
          key={n.id}
          className="flora-toast"
          onClick={() => {
            if (n.action) {
              n.action();
              dismissNotification(n.id);
            }
          }}
          style={{
            background: n.isWarning ? 'rgba(30, 14, 20, 0.96)' : 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: n.isWarning ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.06)',
            padding: '14px 16px',
            width: '350px',
            maxWidth: '90vw',
            cursor: n.action ? 'pointer' : 'default'
          }}
        >
          {/* Header Row: System origin + dismiss */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.08)'
              }}>
                {n.icon?.startsWith('/') ? (
                  <img src={getAssetPath(n.icon)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <DynamicIcon name={n.icon || 'Bell'} size={12} color={n.isWarning ? '#ef4444' : 'var(--accent-color, #10b981)'} />
                )}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.2px' }}>
                Système FloraOS • À l'instant
              </span>
            </div>

            <button
              onClick={() => dismissNotification(n.id)}
              title="Fermer"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                borderRadius: '4px',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Toast Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{
              fontSize: '13.5px',
              fontWeight: 600,
              color: n.isWarning ? '#fca5a5' : '#f8fafc',
              letterSpacing: '-0.01em'
            }}>
              {n.title}
            </div>
            <div style={{
              fontSize: '12.5px',
              color: '#cbd5e1',
              lineHeight: 1.45
            }}>
              {n.message}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
