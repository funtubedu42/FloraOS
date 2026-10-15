import React, { useState, useEffect, useRef } from 'react';
import { Minus, Square, X, Folder, FileText } from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const RenameModal = () => {
  const { renameModal, closeRenameModal, renameNode, playClickSound, playSuccessSound } = useOS();

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Dialog position (draggable like a real OS window/tab)
  const [position, setPosition] = useState(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const modalRef = useRef(null);

  // Initialize name and select filename without extension
  useEffect(() => {
    if (renameModal) {
      setName(renameModal.name || '');
      setError('');

      const defaultW = 420;
      const defaultH = 220;
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 768;
      setPosition({
        x: Math.max(20, Math.round((screenW - defaultW) / 2)),
        y: Math.max(50, Math.round((screenH - defaultH) / 2) - 40)
      });

      // Select name without extension
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const fullName = renameModal.name || '';
          if (renameModal.type === 'file' && fullName.includes('.')) {
            const lastDotIndex = fullName.lastIndexOf('.');
            if (lastDotIndex > 0) {
              inputRef.current.setSelectionRange(0, lastDotIndex);
              return;
            }
          }
          inputRef.current.select();
        }
      }, 50);
    }
  }, [renameModal]);

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

  if (!renameModal || !position) return null;

  const handleClose = () => {
    playClickSound();
    closeRenameModal();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    if (trimmed.includes('/') || trimmed.includes('\\')) {
      setError('Le nom ne peut pas contenir de barres obliques.');
      return;
    }

    renameNode(renameModal.id, trimmed);
    playSuccessSound();
    closeRenameModal();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const isFolder = renameModal.type === 'folder';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        pointerEvents: 'none'
      }}
    >
      {/* OS Dialog Window (Styled like FloraOS window / Zorin / Windows 11) */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '440px',
          maxWidth: '92vw',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '12px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
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
            {isFolder ? (
              <Folder size={16} color="#38bdf8" />
            ) : (
              <FileText size={16} color="#38bdf8" />
            )}
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#f8fafc',
              letterSpacing: '-0.01em'
            }}>
              {isFolder ? 'Renommer le dossier' : 'Renommer le fichier'}
            </span>
          </div>

          {/* 3 Action Buttons: Minimize, Disabled Maximize, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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

            <button
              className="dialog-action-btn"
              disabled
              title="Agrandissement non disponible pour ce dialogue"
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

        {/* Window Content Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 22px 18px', display: 'flex', flexDirection: 'column' }}>
            <label style={{
              fontSize: '12.5px',
              color: '#94a3b8',
              marginBottom: '8px',
              fontWeight: 500
            }}>
              Nouveau nom pour cet élément :
            </label>

            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '13.5px',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => {
                if (!error) e.target.style.borderColor = 'var(--accent-color, #10b981)';
              }}
              onBlur={(e) => {
                if (!error) e.target.style.borderColor = 'rgba(255, 255, 255, 0.16)';
              }}
            />

            {error && (
              <div style={{ fontSize: '11.5px', color: '#f87171', marginTop: '6px' }}>
                {error}
              </div>
            )}
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
              type="button"
              className="flora-btn flora-btn-secondary"
              onClick={handleClose}
              style={{ minWidth: '96px', height: '36px' }}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="flora-btn flora-btn-primary"
              style={{ minWidth: '104px', height: '36px' }}
            >
              Renommer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;
