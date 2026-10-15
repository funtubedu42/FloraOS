import React, { useState, useEffect, useRef } from 'react';
import { Minus, Square, X, ShieldAlert } from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const SystemAlertModal = () => {
  const { systemAlertModal, closeSystemAlertModal, playClickSound } = useOS();

  // Dialog position (draggable like a real OS window/tab)
  const [position, setPosition] = useState(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const modalRef = useRef(null);

  // Center window on open
  useEffect(() => {
    if (systemAlertModal) {
      const defaultW = 460;
      const defaultH = 260;
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 768;
      setPosition({
        x: Math.max(20, Math.round((screenW - defaultW) / 2)),
        y: Math.max(50, Math.round((screenH - defaultH) / 2) - 40)
      });
    }
  }, [systemAlertModal]);

  // Keyboard shortcut: Escape or Enter closes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        if (systemAlertModal) {
          closeSystemAlertModal();
        }
      }
    };
    if (systemAlertModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [systemAlertModal, closeSystemAlertModal]);

  // Window drag handlers
  const handleHeaderMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('.dialog-action-btn')) return;
    isDragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position?.x || 0,
      startY: position?.y || 0
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const nextX = Math.max(10, Math.min(dragStart.current.startX + dx, screenW - 120));
      const nextY = Math.max(30, Math.min(dragStart.current.startY + dy, screenH - 80));
      setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!systemAlertModal || !position) return null;

  const handleClose = () => {
    playClickSound();
    closeSystemAlertModal();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        pointerEvents: 'none'
      }}
    >
      {/* OS Dialog Window (Windows style floating dialog without desktop dimming) */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '460px',
          maxWidth: '92vw',
          background: 'rgba(18, 24, 38, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '10px',
          boxShadow: '0 16px 44px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
          animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Window Titlebar Header */}
        <div
          onMouseDown={handleHeaderMouseDown}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px 0 14px',
            height: '42px',
            background: 'rgba(15, 23, 42, 0.98)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'move',
            userSelect: 'none'
          }}
        >
          {/* Title & Icon (matching FloraOS window standard) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <img
              src="/apps/warning.png"
              alt=""
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/apps/system_file.png';
              }}
              style={{ width: '16px', height: '16px', objectFit: 'contain' }}
            />
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#f8fafc',
              letterSpacing: '-0.01em'
            }}>
              {systemAlertModal.title || 'Avertissement système'}
            </span>
          </div>

          {/* 3 Action Buttons: Minimize, Disabled Maximize, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* 1. Minimize */}
            <button
              className="dialog-action-btn"
              onClick={handleClose}
              title="Réduire"
              style={{
                width: '32px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <Minus size={14} />
            </button>

            {/* 2. Maximize (Disabled for error/alert pop-ups as requested) */}
            <button
              className="dialog-action-btn"
              disabled
              title="Agrandissement non disponible pour les alertes d'erreur"
              style={{
                width: '32px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                opacity: 0.35,
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Square size={13} />
            </button>

            {/* 3. Close */}
            <button
              className="dialog-action-btn"
              onClick={handleClose}
              title="Fermer"
              style={{
                width: '32px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e11d48';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Window Content Body (Cleaned from redundant details) */}
        <div style={{ padding: '22px 22px 18px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Warning Icon Badge */}
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img
              src="/apps/warning.png"
              alt="Avertissement"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/apps/shield.png';
              }}
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
            />
          </div>

          {/* Clean Message without useless clutter */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#f8fafc',
              lineHeight: 1.35,
              marginBottom: '6px'
            }}>
              {systemAlertModal.title || 'Action non autorisée'}
            </div>

            <p style={{
              fontSize: '13px',
              color: '#cbd5e1',
              lineHeight: 1.55,
              margin: 0
            }}>
              {systemAlertModal.message || systemAlertModal.detail}
            </p>
          </div>
        </div>

        {/* Pro OS Action Button Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          padding: '12px 20px',
          background: 'rgba(10, 15, 24, 0.75)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            className="flora-btn flora-btn-primary"
            onClick={handleClose}
            autoFocus
            style={{
              minWidth: '108px',
              height: '36px',
              fontSize: '13.5px'
            }}
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemAlertModal;
