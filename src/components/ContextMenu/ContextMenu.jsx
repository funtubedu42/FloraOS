import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { getAssetPath } from '../../utils/paths';
import {
  FolderPlus,
  FilePlus,
  Image,
  RefreshCw,
  Settings,
  Trash,
  Trash2,
  FolderOpen,
  Edit2,
  Download,
  Eye,
  Info,
  Grid,
  Pin,
  PinOff,
  ExternalLink,
  XCircle,
  Copy,
  Scissors,
  Clipboard,
  Lock,
  Check,
  Globe
} from 'lucide-react';
import { APPS } from '../../constants/apps';

export const ContextMenu = () => {
  const {
    contextMenu,
    closeContextMenu,
    createFolder,
    createFile,
    createWebShortcut,
    openFile,
    renameNode,
    openRenameModal,
    deleteNode,
    emptyTrash,
    downloadNodeFile,
    fileSystem,
    openApp,
    resetIconPositions,
    reorganizeDesktopIcons,
    createShortcutOnDesktop,
    settings,
    setSettings,
    setWallpaperFromImage,
    pinApp,
    unpinApp,
    isAppPinned,
    closeAllWindows,
    windows,
    clipboard,
    copyNode,
    cutNode,
    pasteNode,
    isProtectedSystemNode,
    openPropertiesModal,
    openShortcutModal,
    copyNodePath
  } = useOS();

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeContextMenu();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeContextMenu();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeContextMenu]);

  const x = contextMenu?.x || 0;
  const y = contextMenu?.y || 0;
  const type = contextMenu?.type;
  const targetNodeId = contextMenu?.targetNodeId;
  const parentId = contextMenu?.parentId;

  const [menuPos, setMenuPos] = useState({ x, y });

  useLayoutEffect(() => {
    if (!contextMenu || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    let posX = x;
    let posY = y;

    // Shift left if overflowing viewport
    if (posX + rect.width > screenW - 12) {
      posX = Math.max(10, screenW - rect.width - 12);
    }

    // Shift upwards if overflowing bottom (e.g. taskbar right-click!)
    if (posY + rect.height > screenH - 52) {
      posY = Math.max(10, posY - rect.height);
    }

    setMenuPos({ x: posX, y: posY });
  }, [x, y, contextMenu]);

  if (!contextMenu) return null;

  const targetNode = targetNodeId ? fileSystem[targetNodeId] : null;

  const getAppForNode = (node) => {
    if (!node) return null;
    if (node.type === 'folder') return 'explorer';
    const ext = node.extension?.toLowerCase();
    if (['txt', 'md', 'json', 'js', 'html', 'css'].includes(ext)) return 'textEditor';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'imageViewer';
    if (['mp4', 'webm', 'ogg'].includes(ext)) return 'videoPlayer';
    if (['pdf'].includes(ext)) return 'pdfReader';
    return null;
  };

  const handleAction = (callback) => {
    callback();
    closeContextMenu();
  };

  return (
    <div
      ref={menuRef}
      className="flora-context-menu"
      style={{
        left: `${menuPos.x}px`,
        top: `${menuPos.y}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Desktop background context */}
      {type === 'desktop' && (
        <>
          <div
            className="context-menu-item"
            onClick={() => handleAction(() => createFolder('desktop'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderPlus size={15} color="#38bdf8" />
              Nouveau dossier
            </span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => createFile('desktop', 'Document_Sans_Titre.txt'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FilePlus size={15} color="#f59e0b" />
              Nouveau fichier texte
            </span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => openShortcutModal('desktop'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={15} color="#3b82f6" />
              Créer un raccourci
            </span>
          </div>

          {clipboard && (
            <div
              className="context-menu-item"
              onClick={() => handleAction(() => pasteNode('desktop'))}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clipboard size={15} color="#34d399" />
                Coller
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Ctrl+V</span>
            </div>
          )}

          <div className="context-menu-divider" />

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => {
              setSettings(prev => ({ ...prev, snapToGrid: prev.snapToGrid === false ? true : false }));
            })}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Grid size={15} color="#34d399" />
              Aligner sur la grille
            </span>
            {settings?.snapToGrid !== false && <Check size={14} color="var(--accent-color, #10b981)" />}
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => reorganizeDesktopIcons())}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={15} color="#38bdf8" />
              Réorganiser les icônes
            </span>
          </div>

          <div className="context-menu-divider" />

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => openApp('settings'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image size={15} color="#10b981" />
              Changer le fond d'écran
            </span>
          </div>

          <div className="context-menu-divider" />

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => openApp('settings'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={15} color="#94a3b8" />
              Paramètres du système
            </span>
          </div>
        </>
      )}

      {/* 2. File context */}
      {type === 'file' && targetNode && (
        <>
          <div
            className="context-menu-item"
            style={{ fontWeight: 600 }}
            onClick={() => handleAction(() => openFile(targetNode))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(targetNode.isWebShortcut || targetNode.type === 'url' || (targetNode.extension || '').toLowerCase() === 'url') ? (
                <>
                  <Globe size={15} color="#3b82f6" />
                  Ouvrir dans le navigateur
                </>
              ) : (
                <>
                  <Eye size={15} color="#10b981" />
                  Ouvrir le fichier
                </>
              )}
            </span>
          </div>

          <div className="context-menu-divider" />

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => copyNode(targetNode.id))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Copy size={15} color="#38bdf8" />
              Copier
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Ctrl+C</span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => cutNode(targetNode.id))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scissors size={15} color="#f59e0b" />
              Couper
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Ctrl+X</span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => copyNodePath(targetNode.id))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Copy size={15} color="#38bdf8" />
              Copier le chemin d'accès
            </span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => createShortcutOnDesktop(targetNode.id))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={15} color="#38bdf8" />
              Créer un raccourci sur le bureau
            </span>
          </div>

          {/* Set as wallpaper if image file */}
          {targetNode.extension && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(targetNode.extension.toLowerCase()) && (
            <div
              className="context-menu-item"
              onClick={() => handleAction(() => setWallpaperFromImage(targetNode.url || targetNode.content, targetNode.name))}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image size={15} color="#38bdf8" />
                Définir comme fond d'écran
              </span>
            </div>
          )}

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => downloadNodeFile(targetNode.id))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={15} color="#38bdf8" />
              Télécharger sur l'ordinateur
            </span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => openRenameModal(targetNode.id))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit2 size={15} color="#f59e0b" />
              Renommer
            </span>
          </div>

          {(() => {
            const appId = getAppForNode(targetNode);
            if (!appId || !APPS[appId]) return null;
            const pinned = isAppPinned(appId);
            const appTitle = APPS[appId].title || APPS[appId].name;
            return (
              <div
                className="context-menu-item"
                onClick={() => handleAction(() => pinned ? unpinApp(appId) : pinApp(appId))}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {pinned ? <PinOff size={15} color="#cbd5e1" /> : <Pin size={15} color="#38bdf8" />}
                  {pinned ? `Détacher ${appTitle} de la barre` : `Épingler ${appTitle} à la barre`}
                </span>
              </div>
            );
          })()}

          <div className="context-menu-divider" />

          {/* Properties option */}
          <div
            className="context-menu-item"
            onClick={() => handleAction(() => openPropertiesModal(targetNode.id))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={15} color="#38bdf8" />
              Propriétés
            </span>
          </div>

          <div className="context-menu-divider" />

          {isProtectedSystemNode && isProtectedSystemNode(targetNode) ? (
            <div
              className="context-menu-item"
              style={{ color: '#cbd5e1' }}
              onClick={() => handleAction(() => deleteNode(targetNode.id))}
              title="Fichier système verrouillé"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={15} color="#f87171" />
                Supprimer (Protégé)
              </span>
            </div>
          ) : (
            <div
              className="context-menu-item danger"
              onClick={() => handleAction(() => deleteNode(targetNode.id))}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={15} color="#ef4444" />
                Supprimer
              </span>
            </div>
          )}
        </>
      )}

      {/* 3. Folder context */}
      {type === 'folder' && targetNode && (
        <>
          <div
            className="context-menu-item"
            style={{ fontWeight: 600 }}
            onClick={() => handleAction(() => openApp('explorer', targetNode))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={15} color="#38bdf8" />
              Ouvrir le dossier
            </span>
          </div>

          <div className="context-menu-divider" />

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => copyNode(targetNode.id))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Copy size={15} color="#38bdf8" />
              Copier le dossier
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Ctrl+C</span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => cutNode(targetNode.id))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scissors size={15} color="#f59e0b" />
              Couper le dossier
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Ctrl+X</span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => copyNodePath(targetNode.id))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Copy size={15} color="#38bdf8" />
              Copier le chemin d'accès
            </span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => createShortcutOnDesktop(targetNode.id))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={15} color="#38bdf8" />
              Créer un raccourci sur le bureau
            </span>
          </div>

          {clipboard && (
            <div
              className="context-menu-item"
              onClick={() => handleAction(() => pasteNode(targetNode.id))}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clipboard size={15} color="#34d399" />
                Coller dans ce dossier
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Ctrl+V</span>
            </div>
          )}

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => isAppPinned('explorer') ? unpinApp('explorer') : pinApp('explorer'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isAppPinned('explorer') ? <PinOff size={15} color="#cbd5e1" /> : <Pin size={15} color="#38bdf8" />}
              {isAppPinned('explorer') ? "Détacher l'Explorateur de la barre" : "Épingler l'Explorateur à la barre"}
            </span>
          </div>

          {targetNode.id === 'trash' ? (
            <div
              className="context-menu-item danger"
              onClick={() => handleAction(() => emptyTrash())}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash size={15} color="#ef4444" />
                Vider la corbeille
              </span>
            </div>
          ) : (
            <>
              <div
                className="context-menu-item"
                onClick={() => handleAction(() => createFolder(targetNode.id))}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderPlus size={15} color="#10b981" />
                  Nouveau sous-dossier
                </span>
              </div>

              <div
                className="context-menu-item"
                onClick={() => handleAction(() => openRenameModal(targetNode.id))}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit2 size={15} color="#f59e0b" />
                  Renommer
                </span>
              </div>

              <div className="context-menu-divider" />

              {/* Properties option on folder */}
              <div
                className="context-menu-item"
                onClick={() => handleAction(() => openPropertiesModal(targetNode.id))}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={15} color="#38bdf8" />
                  Propriétés
                </span>
              </div>

              <div className="context-menu-divider" />

              {isProtectedSystemNode && isProtectedSystemNode(targetNode) ? (
                <div
                  className="context-menu-item"
                  style={{ color: '#cbd5e1' }}
                  onClick={() => handleAction(() => deleteNode(targetNode.id))}
                  title="Dossier système verrouillé"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={15} color="#f87171" />
                    Supprimer (Protégé)
                  </span>
                </div>
              ) : (
                <div
                  className="context-menu-item danger"
                  onClick={() => handleAction(() => deleteNode(targetNode.id))}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trash2 size={15} color="#ef4444" />
                    Supprimer le dossier
                  </span>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 4. Inside Explorer background */}
      {type === 'explorer' && (
        <>
          <div
            className="context-menu-item"
            onClick={() => handleAction(() => createFolder(parentId || 'desktop'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderPlus size={15} color="#38bdf8" />
              Nouveau dossier ici
            </span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => createFile(parentId || 'desktop', 'Nouveau_document.txt'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FilePlus size={15} color="#f59e0b" />
              Nouveau fichier texte
            </span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => openShortcutModal(parentId || 'desktop'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={15} color="#3b82f6" />
              Créer un raccourci
            </span>
          </div>

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => copyNodePath(parentId || 'desktop'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Copy size={15} color="#38bdf8" />
              Copier le chemin d'accès
            </span>
          </div>

          <div className="context-menu-divider" />

          <div
            className="context-menu-item"
            onClick={() => handleAction(() => openPropertiesModal(parentId || 'desktop'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={15} color="#38bdf8" />
              Propriétés
            </span>
          </div>

          {clipboard && (
            <div
              className="context-menu-item"
              onClick={() => handleAction(() => pasteNode(parentId || 'desktop'))}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clipboard size={15} color="#34d399" />
                Coller
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Ctrl+V</span>
            </div>
          )}
        </>
      )}

      {/* 5. Application context (Taskbar, Desktop or Start Menu) */}
      {type === 'app' && targetNodeId && (
        <>
          {(() => {
            const appId = targetNodeId;
            const app = APPS[appId];
            if (!app) return null;
            const openWindows = (windows || []).filter(w => w.appId === appId);
            const isPinned = isAppPinned(appId);
            const appTitle = app.title || app.name;

            return (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '4px'
                  }}
                >
                  {app.iconImg ? (
                    <img src={getAssetPath(app.iconImg)} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  ) : null}
                  <span style={{ fontWeight: 600, fontSize: '12px', color: '#f1f5f9' }}>
                    {appTitle}
                  </span>
                </div>

                <div
                  className="context-menu-item"
                  onClick={() => handleAction(() => openApp(appId))}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExternalLink size={15} color="#10b981" />
                    Nouvelle fenêtre
                  </span>
                </div>

                <div
                  className="context-menu-item"
                  onClick={() => handleAction(() => isPinned ? unpinApp(appId) : pinApp(appId))}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isPinned ? (
                      <>
                        <PinOff size={15} color="#cbd5e1" />
                        Détacher de la barre des tâches
                      </>
                    ) : (
                      <>
                        <Pin size={15} color="#38bdf8" />
                        Épingler à la barre des tâches
                      </>
                    )}
                  </span>
                </div>

                {openWindows.length > 0 && (
                  <>
                    <div className="context-menu-divider" />
                    <div
                      className="context-menu-item danger"
                      onClick={() => handleAction(() => closeAllWindows(appId))}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <XCircle size={15} color="#ef4444" />
                        Fermer toutes les fenêtres ({openWindows.length})
                      </span>
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
};
