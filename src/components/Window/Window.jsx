import React, { useRef, useEffect, useState } from 'react';
import { useOS } from '../../context/OSContext';
import { DynamicIcon } from '../../utils/IconHelper';
import { FileExplorer } from '../Apps/FileExplorer/FileExplorer';
import { PdfViewer } from '../Apps/PdfViewer/PdfViewer';
import { ImageViewer } from '../Apps/ImageViewer/ImageViewer';
import { VideoPlayer } from '../Apps/VideoPlayer/VideoPlayer';
import { TextEditor } from '../Apps/TextEditor/TextEditor';
import { SettingsApp } from '../Apps/SettingsApp/SettingsApp';
import { Calculator } from '../Apps/Calculator/Calculator';
import { Terminal } from '../Apps/Terminal/Terminal';
import { FloraStore } from '../Apps/FloraStore/FloraStore';
import { TimeApp } from '../Apps/TimeApp/TimeApp';
import { CalendarApp } from '../Apps/CalendarApp/CalendarApp';
import { BrowserApp } from '../Apps/BrowserApp/BrowserApp';
import { Minus, Square, Copy, X } from 'lucide-react';
import { playWarningSound } from '../../utils/audio';
import { getAssetPath } from '../../utils/paths';

const APP_COMPONENTS = {
  explorer: FileExplorer,
  store: FloraStore,
  pdfViewer: PdfViewer,
  imageViewer: ImageViewer,
  videoPlayer: VideoPlayer,
  textEditor: TextEditor,
  settings: SettingsApp,
  calculator: Calculator,
  terminal: Terminal,
  time: TimeApp,
  calendar: CalendarApp,
  browser: BrowserApp
};

export const Window = ({ windowData }) => {
  const {
    activeWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize
  } = useOS();

  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const unsavedStateRef = useRef({ hasUnsaved: false, saveHandler: null });

  const registerUnsavedHandler = (hasUnsaved, saveHandler) => {
    unsavedStateRef.current = { hasUnsaved, saveHandler };
  };

  const handleCloseAttempt = (e) => {
    if (e) e.stopPropagation();
    if (unsavedStateRef.current.hasUnsaved) {
      playWarningSound();
      setUnsavedModalOpen(true);
    } else {
      closeWindow(windowData.id);
    }
  };

  const handleConfirmSaveAndClose = async () => {
    if (unsavedStateRef.current.saveHandler) {
      await unsavedStateRef.current.saveHandler();
    }
    setUnsavedModalOpen(false);
    closeWindow(windowData.id);
  };

  const handleDiscardAndClose = () => {
    setUnsavedModalOpen(false);
    closeWindow(windowData.id);
  };

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const isActive = activeWindowId === windowData.id;

  // Drag handlers
  const handleHeaderMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('.window-action-btn')) return;
    if (windowData.isMaximized) return;

    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - windowData.position.x,
      y: e.clientY - windowData.position.y
    };
    focusWindow(windowData.id);
  };

  // Resize handler
  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (windowData.isMaximized) return;

    isResizing.current = true;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: windowData.size.width,
      height: windowData.size.height
    };
    focusWindow(windowData.id);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging.current) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const newX = Math.max(-windowData.size.width + 100, Math.min(e.clientX - dragOffset.current.x, screenW - 100));
        const newY = Math.max(32, Math.min(e.clientY - dragOffset.current.y, screenH - 100));
        updateWindowPosition(windowData.id, { x: newX, y: newY });
      }

      if (isResizing.current) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        const newWidth = Math.max(340, resizeStart.current.width + deltaX);
        const newHeight = Math.max(240, resizeStart.current.height + deltaY);
        updateWindowSize(windowData.id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [windowData.id, windowData.size, updateWindowPosition, updateWindowSize]);

  const AppComponent = APP_COMPONENTS[windowData.appId] || FileExplorer;

  return (
    <div
      className={`flora-window ${isActive ? 'active' : ''} ${windowData.isMinimized ? 'minimized' : ''} ${windowData.isMaximized ? 'maximized' : ''}`}
      style={{
        left: windowData.isMaximized ? 0 : `${windowData.position.x}px`,
        top: windowData.isMaximized ? 0 : `${windowData.position.y}px`,
        width: windowData.isMaximized ? '100vw' : `${windowData.size.width}px`,
        height: windowData.isMaximized ? 'calc(100vh - 48px)' : `${windowData.size.height}px`,
        borderRadius: windowData.isMaximized ? 0 : undefined,
        border: windowData.isMaximized ? 'none' : undefined,
        boxShadow: windowData.isMaximized ? 'none' : undefined,
        zIndex: windowData.zIndex,
        transition: isDragging.current || isResizing.current ? 'none' : 'transform 0.16s ease, width 0.16s ease, height 0.16s ease, top 0.16s ease, left 0.16s ease'
      }}
      onPointerDown={() => focusWindow(windowData.id)}
    >
      {/* Titlebar Header */}
      <div
        className="window-header"
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={() => maximizeWindow(windowData.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px 0 10px',
          height: '42px',
          background: isActive ? 'rgba(18, 26, 38, 0.95)' : 'rgba(13, 19, 28, 0.92)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Left: Window Tab Pill style */}
        <div
          className="window-tab-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '8px',
            background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            border: isActive ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
            maxWidth: 'calc(100% - 120px)',
            transition: 'all 0.15s ease'
          }}
        >
          <img
            src={getAssetPath(windowData.iconImg || '/apps/default_app.png')}
            alt=""
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getAssetPath('/apps/default_app.png');
            }}
            style={{ width: '18px', height: '18px', objectFit: 'contain' }}
          />
          <span style={{
            fontSize: '12.5px',
            fontWeight: 600,
            color: isActive ? '#f8fafc' : '#94a3b8',
            letterSpacing: '-0.1px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {windowData.title}
          </span>
        </div>

        {/* Right: Accessible Window Control Buttons (Windows 11 style) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {/* Minimize button */}
          <button
            className="window-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(windowData.id);
            }}
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
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <Minus size={14} />
          </button>

          {/* Maximize / Restore button */}
          <button
            className="window-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              maximizeWindow(windowData.id);
            }}
            title={windowData.isMaximized ? 'Niveau inférieur' : 'Agrandir'}
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
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            {windowData.isMaximized ? <Copy size={12} /> : <Square size={12} />}
          </button>

          {/* Close button */}
          <button
            className="window-action-btn"
            onClick={handleCloseAttempt}
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
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e11d48';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Window Application Body */}
      <div className="window-content" style={{ position: 'relative' }}>
        <AppComponent
          windowData={windowData}
          registerUnsavedHandler={registerUnsavedHandler}
        />

        {/* Modal Pop-up on Unsaved Changes */}
        {unsavedModalOpen && (
          <div
            className="flora-modal-backdrop"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(3px)'
            }}
          >
            <div
              className="flora-modal-card"
              style={{
                width: '430px',
                maxWidth: '92%',
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
                overflow: 'hidden',
                padding: 0
              }}
            >
              {/* Titlebar Header with 3 Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px 0 14px',
                height: '38px',
                background: 'rgba(15, 23, 42, 0.98)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                userSelect: 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={getAssetPath('/apps/warning.png')}
                    alt=""
                    style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f8fafc' }}>
                    {windowData.title?.split('—')[1]?.trim() || windowData.title || 'Avertissement'}
                  </span>
                </div>

                {/* 3 Action Buttons: Minimize, Disabled Maximize, Close */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <button
                    onClick={() => setUnsavedModalOpen(false)}
                    title="Réduire"
                    style={{
                      width: '28px',
                      height: '24px',
                      borderRadius: '5px',
                      border: 'none',
                      background: 'transparent',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Minus size={13} />
                  </button>

                  <button
                    disabled
                    title="Agrandissement non disponible pour ce dialogue"
                    style={{
                      width: '28px',
                      height: '24px',
                      borderRadius: '5px',
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
                    <Square size={12} />
                  </button>

                  <button
                    onClick={() => setUnsavedModalOpen(false)}
                    title="Fermer"
                    style={{
                      width: '28px',
                      height: '24px',
                      borderRadius: '5px',
                      border: 'none',
                      background: 'transparent',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '20px 22px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img
                  src={getAssetPath('/apps/warning.png')}
                  alt="Avertissement"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  style={{ width: '44px', height: '44px', objectFit: 'contain', flexShrink: 0 }}
                />
                <div>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                    Enregistrer les modifications ?
                  </h3>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '6px 0 0', lineHeight: 1.45 }}>
                    Voulez-vous enregistrer les modifications apportées à « {windowData.fileContext?.name || 'Fichier sans nom'} » avant de fermer ?
                  </p>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                padding: '12px 18px',
                background: 'rgba(10, 15, 24, 0.75)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button
                  type="button"
                  onClick={() => setUnsavedModalOpen(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleDiscardAndClose}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Ne pas enregistrer
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSaveAndClose}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent-color, #10b981)',
                    color: '#fff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px var(--accent-glow, rgba(16, 185, 129, 0.3))'
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle (Bottom-Right) */}
      {!windowData.isMaximized && (
        <div
          className="resize-handle resize-se"
          onMouseDown={handleResizeMouseDown}
          title="Redimensionner"
        />
      )}
    </div>
  );
};
