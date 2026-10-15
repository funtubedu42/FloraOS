import React from 'react';
import { useOS } from '../../context/OSContext';
import { APPS } from '../../constants/apps';
import { DynamicIcon } from '../../utils/IconHelper';
import { getAssetPath } from '../../utils/paths';
import { Trash2, Trash } from 'lucide-react';

export const Dock = () => {
  const {
    openApp,
    windows,
    activeWindowId,
    focusWindow,
    minimizeWindow,
    fileSystem,
    emptyTrash,
    openContextMenu,
    toggleStartMenu
  } = useOS();

  const dockApps = Object.values(APPS).filter(app => app.isDockPinned);
  const trashItems = fileSystem.trash?.children || [];
  const hasTrashItems = trashItems.length > 0;

  const handleAppClick = (appId) => {
    const appWindows = windows.filter(w => w.appId === appId);

    if (appWindows.length === 0) {
      openApp(appId);
      return;
    }

    const win = appWindows[0];
    if (win.isMinimized) {
      focusWindow(win.id);
    } else if (activeWindowId === win.id) {
      minimizeWindow(win.id);
    } else {
      focusWindow(win.id);
    }
  };

  const handleTrashClick = () => {
    const trashNode = fileSystem.trash;
    if (trashNode) {
      openApp('explorer', trashNode);
    }
  };

  const handleTrashContextMenu = (e) => {
    openContextMenu(e, 'folder', 'trash', 'root');
  };

  return (
    <nav className="flora-dock" aria-label="Dock des applications">
      {/* Home / Start Menu Launcher icon */}
      <div
        className="dock-item start-menu-trigger"
        onClick={toggleStartMenu}
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '13px'
        }}
      >
        <div className="dock-tooltip">Menu FloraOS</div>
        <img
          src={getAssetPath('/apps/home.png')}
          alt="Home"
          style={{ width: '24px', height: '24px', objectFit: 'contain' }}
        />
      </div>

      {/* Dock divider */}
      <div style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 2px' }} />

      {/* Pinned Applications */}
      {dockApps.map(app => {
        const isOpen = windows.some(w => w.appId === app.id);
        const isActive = windows.some(w => w.appId === app.id && w.id === activeWindowId && !w.isMinimized);

        return (
          <div
            key={app.id}
            className="dock-item"
            onClick={() => handleAppClick(app.id)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              borderRadius: '13px'
            }}
          >
            <div className="dock-tooltip">{app.name}</div>
            {app.iconImg ? (
              <img
                src={getAssetPath(app.iconImg)}
                alt={app.name}
                style={{ width: '25px', height: '25px', objectFit: 'contain' }}
              />
            ) : (
              <DynamicIcon name={app.icon} size={24} color={app.color} />
            )}
            {isOpen && <div className="dock-item-dot" style={{ background: '#ffffff' }} />}
          </div>
        );
      })}

      {/* Dock divider */}
      <div style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 2px' }} />

      {/* Trash */}
      <div
        className="dock-item"
        onClick={handleTrashClick}
        onContextMenu={handleTrashContextMenu}
        style={{
          background: hasTrashItems ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)',
          border: hasTrashItems ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '13px'
        }}
      >
        <div className="dock-tooltip">
          Corbeille {hasTrashItems ? `(${trashItems.length})` : '(Vide)'}
        </div>
        {hasTrashItems ? (
          <Trash2 size={23} color="#f87171" />
        ) : (
          <Trash size={23} color="#94a3b8" />
        )}
        {hasTrashItems && (
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '999px',
              padding: '1px 5px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
            }}
          >
            {trashItems.length}
          </div>
        )}
      </div>
    </nav>
  );
};
