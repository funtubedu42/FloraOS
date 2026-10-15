import React, { useEffect, useState } from 'react';
import { OSProvider, useOS } from './context/OSContext';
import { TaskBar } from './components/TaskBar/TaskBar';
import { Desktop } from './components/Desktop/Desktop';
import { Window } from './components/Window/Window';
import { ContextMenu } from './components/ContextMenu/ContextMenu';
import { LockScreen } from './components/LockScreen/LockScreen';
import { ToastContainer } from './components/Notifications/ToastContainer';
import { SetupWizard } from './components/SetupWizard/SetupWizard';
import { StartMenu } from './components/StartMenu/StartMenu';
import { ShortcutsModal } from './components/ShortcutsModal/ShortcutsModal';
import { SystemAlertModal } from './components/Modals/SystemAlertModal';
import { RenameModal } from './components/Modals/RenameModal';
import { PropertiesModal } from './components/Modals/PropertiesModal';
import { CreateShortcutModal } from './components/Modals/CreateShortcutModal';
import { SystemUpdateModal } from './components/Modals/SystemUpdateModal';

const OSContent = () => {
  const {
    isInstalled,
    settings,
    windows,
    activeWindowId,
    isAuthenticated,
    isLocked,
    lockSession,
    openApp,
    closeWindow,
    minimizeWindow,
    focusWindow,
    toggleStartMenu,
    setIsStartMenuOpen,
    createFolder,
    closeContextMenu,
    setActiveWindowId
  } = useOS();

  const [isShortcutsHelperOpen, setIsShortcutsHelperOpen] = useState(false);

  // Apply accent color and glass blur to root document
  useEffect(() => {
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--accent-color', settings.accentColor.value);
      document.documentElement.style.setProperty('--accent-hover', settings.accentColor.hover);
      document.documentElement.style.setProperty('--accent-glow', settings.accentColor.glow);
    }
  }, [settings.accentColor]);

  // Global Context Menu Intercept & Windows-grade Shortcuts
  useEffect(() => {
    let ctrlOnlyPressed = false;

    const handleGlobalContextMenu = (e) => {
      // Prevent browser default right-click context menu everywhere
      e.preventDefault();
    };

    const handleKeyDown = (e) => {
      // Check if user is typing in an input or textarea
      const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable;

      if (e.key === 'Control') {
        ctrlOnlyPressed = true;
      } else {
        ctrlOnlyPressed = false;
      }

      // 1. Start Menu: Ctrl + Space or Ctrl + Escape
      if ((e.ctrlKey && e.code === 'Space') || (e.ctrlKey && e.key === 'Escape')) {
        e.preventDefault();
        toggleStartMenu();
        return;
      }

      // 2. Escape closes start menu / shortcuts modal
      if (e.key === 'Escape') {
        setIsStartMenuOpen(false);
        setIsShortcutsHelperOpen(false);
        return;
      }

      // If typing in input, don't trigger app launcher shortcuts
      if (isInput) return;

      // 3. File Explorer: Ctrl + E
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        openApp('explorer');
        return;
      }

      // 4. Lock session: Ctrl + L
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        lockSession();
        return;
      }

      // 5. Show Desktop: Ctrl + D (Minimizes all windows or restores them)
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const hasOpen = windows.some(w => !w.isMinimized);
        windows.forEach(w => {
          if (hasOpen) minimizeWindow(w.id);
          else focusWindow(w.id);
        });
        return;
      }

      // 6. Terminal: Ctrl + T or Ctrl + Shift + Esc
      if ((e.ctrlKey && e.key.toLowerCase() === 't') || (e.ctrlKey && e.shiftKey && e.key === 'Escape')) {
        e.preventDefault();
        openApp('terminal');
        return;
      }

      // 7. Settings: Ctrl + ,
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        openApp('settings');
        return;
      }

      // 8. FloraStore: Ctrl + K
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openApp('store');
        return;
      }

      // 9. New Folder on Desktop: Ctrl + Shift + N
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createFolder('desktop');
        return;
      }

      // 10. Close active window: Alt + F4 or Ctrl + W
      if ((e.altKey && e.key === 'F4') || (e.ctrlKey && e.key.toLowerCase() === 'w')) {
        if (activeWindowId) {
          e.preventDefault();
          closeWindow(activeWindowId);
        }
        return;
      }

      // 11. Alt + Tab window cycling
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        if (windows.length > 1) {
          const currentIndex = windows.findIndex(w => w.id === activeWindowId);
          const nextIndex = (currentIndex + 1) % windows.length;
          focusWindow(windows[nextIndex].id);
        }
        return;
      }

      // 12. Show Keyboard Shortcuts Guide: Ctrl + /
      if (e.ctrlKey && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        setIsShortcutsHelperOpen(prev => !prev);
        return;
      }
    };

    const handleKeyUp = (e) => {
      // If user tapped and released Control alone, toggle Start Menu
      if (e.key === 'Control' && ctrlOnlyPressed) {
        const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
        if (!isInput) {
          toggleStartMenu();
        }
      }
      ctrlOnlyPressed = false;
    };

    const handleGlobalPointerDown = (e) => {
      // Unfocus windows when clicking on desktop outside windows, taskbar, start menu or modals
      if (
        !e.target.closest('.window-container') &&
        !e.target.closest('.flora-taskbar') &&
        !e.target.closest('.flora-start-menu') &&
        !e.target.closest('.flora-modal-card') &&
        !e.target.closest('.flora-context-menu') &&
        !e.target.closest('.dialog-action-btn')
      ) {
        setActiveWindowId(null);
      }
    };

    window.addEventListener('contextmenu', handleGlobalContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', handleGlobalPointerDown);
    return () => {
      window.removeEventListener('contextmenu', handleGlobalContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
    };
  }, [windows, activeWindowId, openApp, closeWindow, minimizeWindow, focusWindow, toggleStartMenu, lockSession, createFolder, setIsStartMenuOpen, setActiveWindowId]);

  const wallpaperUrl = settings.wallpaper?.url || '/wallpapers/emerald_forest.jpg';

  return (
    <div
      className="flora-os-root"
      data-theme={settings.theme}
      style={{
        backgroundImage: `url("${wallpaperUrl}")`
      }}
      onClick={() => closeContextMenu()}
    >
      {/* Dynamic Brightness Overlay */}
      {settings.brightness < 100 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            opacity: (100 - settings.brightness) / 100 * 0.7,
            pointerEvents: 'none',
            zIndex: 9998
          }}
        />
      )}

      {/* First-time installation / Setup Wizard */}
      {!isInstalled && <SetupWizard />}

      {/* Login & Lock Screen */}
      {isInstalled && (!isAuthenticated || isLocked) && <LockScreen />}

      {/* Main OS Desktop Environment */}
      {isInstalled && isAuthenticated && (
        <>
          {/* Interactive Desktop with Files & Folders */}
          <Desktop />

          {/* Draggable & Resizable App Windows */}
          {windows.map(win => (
            <Window key={win.id} windowData={win} />
          ))}

          {/* Start Menu / App Launcher */}
          <StartMenu />

          {/* Unified Centralized TaskBar (Single Bar as requested) */}
          <TaskBar />

          {/* Context Menu */}
          <ContextMenu />

          {/* Toast Notifications */}
          <ToastContainer />

          {/* Keyboard Shortcuts Helper Modal (Ctrl + /) */}
          <ShortcutsModal
            isOpen={isShortcutsHelperOpen}
            onClose={() => setIsShortcutsHelperOpen(false)}
          />

          {/* System Protection Alert Pop-up Modal */}
          <SystemAlertModal />

          {/* Rename Tab Dialog */}
          <RenameModal />

          {/* Properties Tab Dialog */}
          <PropertiesModal />

          {/* Create Shortcut Tab Dialog */}
          <CreateShortcutModal />

          {/* System Update Fullscreen Animation Dialog */}
          <SystemUpdateModal />
        </>
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FloraOS caught render error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '24px',
          zIndex: 99999
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '36px',
            maxWidth: '520px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌸</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#e2e8f0' }}>
              FloraOS a rencontré une interruption
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}>
              Un élément inattendu s'est produit lors de l'affichage. Vos données personnelles restent intactes.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '11.5px',
                fontFamily: 'monospace',
                textAlign: 'left',
                maxHeight: '100px',
                overflowY: 'auto',
                marginBottom: '20px'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Relancer FloraOS
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Réparer le système
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <OSProvider>
        <OSContent />
      </OSProvider>
    </ErrorBoundary>
  );
}
