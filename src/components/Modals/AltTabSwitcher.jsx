import React from 'react';
import { useOS } from '../../context/OSContext';
import { getAssetPath } from '../../utils/paths';

export const AltTabSwitcher = ({ isOpen, windows, selectedIndex, onSelectWindow }) => {
  if (!isOpen || !windows || windows.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto'
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '20px 24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '90vw',
          animation: 'scaleIn 0.12s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#94a3b8',
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          Basculer entre les applications (Alt + Tab)
        </div>

        {/* Windows List Grid / Flex */}
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          padding: '4px',
          maxWidth: '80vw'
        }}>
          {windows.map((win, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={win.id}
                onClick={() => onSelectWindow(win.id)}
                style={{
                  width: '130px',
                  height: '110px',
                  borderRadius: '14px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? '2px solid var(--accent-color, #38bdf8)' : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  gap: '10px',
                  cursor: 'pointer',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 10px 25px rgba(0, 0, 0, 0.4)' : 'none'
                }}
              >
                <img
                  src={getAssetPath(win.iconImg || '/apps/default_app.png')}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getAssetPath('/apps/default_app.png');
                  }}
                  style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                />
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? '#fff' : '#cbd5e1',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}>
                  {win.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
