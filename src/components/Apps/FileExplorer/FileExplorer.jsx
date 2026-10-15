import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Search,
  Grid,
  List,
  FolderPlus,
  FilePlus,
  UploadCloud,
  Trash2,
  Trash,
  Folder,
  FolderOpen,
  Eye,
  Download,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { useOS } from '../../../context/OSContext';
import { DynamicIcon, getFileIconDetails } from '../../../utils/IconHelper';

export const FileExplorer = ({ windowData }) => {
  const {
    user,
    fileSystem,
    getActiveDesktopId,
    openFile,
    createFolder,
    createFile,
    deleteNode,
    uploadRealFile,
    emptyTrash,
    openContextMenu,
    downloadNodeFile,
    playClickSound,
    clipboard,
    copyNode,
    cutNode,
    pasteNode,
    moveNode
  } = useOS();

  const defaultFolderId = windowData.fileContext?.id || (getActiveDesktopId ? getActiveDesktopId() : 'root');
  const [currentFolderId, setCurrentFolderId] = useState(() => {
    if (fileSystem[defaultFolderId]) return defaultFolderId;
    const desktopId = getActiveDesktopId ? getActiveDesktopId() : null;
    if (desktopId && fileSystem[desktopId]) return desktopId;
    return 'root';
  });
  const [history, setHistory] = useState([defaultFolderId]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedIds, setSelectedIds] = useState([]);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);
  const [marquee, setMarquee] = useState(null);
  const [copiedPath, setCopiedPath] = useState(false);

  const fileInputRef = useRef(null);
  const contentPaneRef = useRef(null);
  const isDraggingMarquee = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const currentFolder = fileSystem[currentFolderId] || fileSystem[getActiveDesktopId ? getActiveDesktopId() : ''] || fileSystem.root || { children: [] };
  const childrenIds = currentFolder.children || [];

  // Filter children by search query
  const filteredChildren = childrenIds
    .map(cid => fileSystem[cid])
    .filter(Boolean)
    .filter(node => node.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Keyboard shortcuts (Ctrl+A, Ctrl+C, Ctrl+X, Ctrl+V, Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedIds(filteredChildren.map(n => n.id));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedIds.length > 0) {
        copyNode(selectedIds);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x' && selectedIds.length > 0) {
        cutNode(selectedIds);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboard) {
        pasteNode(currentFolderId);
      } else if (e.key === 'Delete' && selectedIds.length > 0) {
        deleteNode(selectedIds);
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, clipboard, currentFolderId, filteredChildren, copyNode, cutNode, pasteNode, deleteNode]);

  // Navigate to folder
  const navigateTo = (folderId) => {
    if (!fileSystem[folderId]) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(folderId);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentFolderId(folderId);
    setSelectedIds([]);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentFolderId(history[historyIndex - 1]);
      setSelectedIds([]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentFolderId(history[historyIndex + 1]);
      setSelectedIds([]);
    }
  };

  const handleUp = () => {
    if (currentFolder.parentId && fileSystem[currentFolder.parentId]) {
      navigateTo(currentFolder.parentId);
    }
  };

  // Item click handler (single, Ctrl/Cmd toggle, Shift range)
  const handleItemClick = (node, e) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => prev.includes(node.id) ? prev.filter(id => id !== node.id) : [...prev, node.id]);
    } else if (e.shiftKey && selectedIds.length > 0) {
      const last = selectedIds[selectedIds.length - 1];
      const allIds = filteredChildren.map(n => n.id);
      const idx1 = allIds.indexOf(last);
      const idx2 = allIds.indexOf(node.id);
      if (idx1 !== -1 && idx2 !== -1) {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        const range = allIds.slice(start, end + 1);
        setSelectedIds(Array.from(new Set([...selectedIds, ...range])));
      } else {
        setSelectedIds([node.id]);
      }
    } else {
      setSelectedIds([node.id]);
    }
  };

  const handleItemContextMenu = (node, e) => {
    e.stopPropagation();
    if (!selectedIds.includes(node.id)) {
      setSelectedIds([node.id]);
    }
    openContextMenu(e, node.type, node.id, currentFolderId);
  };

  // Marquee selection in content pane
  const handlePaneMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('[data-explorer-item-id]') || e.target.closest('button') || e.target.closest('input')) {
      return;
    }

    if (!e.ctrlKey && !e.metaKey) {
      setSelectedIds([]);
    }

    isDraggingMarquee.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    setMarquee({
      x: e.clientX,
      y: e.clientY,
      width: 0,
      height: 0
    });
  };

  const handlePaneMouseMove = (e) => {
    if (!isDraggingMarquee.current) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const x = Math.min(startPos.current.x, currentX);
    const y = Math.min(startPos.current.y, currentY);
    const width = Math.abs(currentX - startPos.current.x);
    const height = Math.abs(currentY - startPos.current.y);

    setMarquee({ x, y, width, height });

    if (width > 3 || height > 3) {
      const mLeft = x;
      const mTop = y;
      const mRight = x + width;
      const mBottom = y + height;

      const itemEls = contentPaneRef.current?.querySelectorAll('[data-explorer-item-id]');
      if (itemEls) {
        const matched = [];
        itemEls.forEach(el => {
          const rect = el.getBoundingClientRect();
          const intersects = !(
            rect.right < mLeft ||
            rect.left > mRight ||
            rect.bottom < mTop ||
            rect.top > mBottom
          );
          if (intersects) {
            const id = el.getAttribute('data-explorer-item-id');
            if (id) matched.push(id);
          }
        });
        setSelectedIds(matched);
      }
    }
  };

  const handlePaneMouseUp = () => {
    if (isDraggingMarquee.current) {
      isDraggingMarquee.current = false;
      setMarquee(null);
    }
  };

  // Upload handler
  const handleUploadChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        uploadRealFile(currentFolderId, file);
      });
      e.target.value = '';
    }
  };


  // Breadcrumbs calculation
  const getBreadcrumbs = () => {
    const crumbs = [];
    let curr = currentFolder;
    while (curr) {
      crumbs.unshift(curr);
      curr = curr.parentId ? fileSystem[curr.parentId] : null;
    }
    return crumbs;
  };

  const handleCopyCurrentPath = () => {
    const fullPath = 'FloraOS / ' + getBreadcrumbs().map(b => b.name || b.id).join(' / ');
    navigator.clipboard.writeText(fullPath);
    setCopiedPath(true);
    if (playClickSound) playClickSound();
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const isTrash = currentFolderId === 'trash';

  const userHomeId = `user_${user?.id || 'u_master'}`;
  const desktopId = `desktop_${user?.id || 'u_master'}`;
  const documentsId = `documents_${user?.id || 'u_master'}`;
  const imagesId = `images_${user?.id || 'u_master'}`;
  const musicId = `music_${user?.id || 'u_master'}`;
  const downloadsId = `downloads_${user?.id || 'u_master'}`;
  const videosId = `videos_${user?.id || 'u_master'}`;

  const sidebarLinks = [
    { id: fileSystem[userHomeId] ? userHomeId : (fileSystem.home ? 'home' : 'root'), label: 'Dossier personnel', iconImg: '/apps/home.png' },
    { id: fileSystem[desktopId] ? desktopId : 'desktop', label: 'Bureau', iconImg: '/apps/computer.png' },
    { id: fileSystem[documentsId] ? documentsId : 'documents', iconImg: '/apps/doc_file.png', label: 'Documents' },
    { id: fileSystem[imagesId] ? imagesId : 'images', iconImg: '/apps/photos.png', label: 'Images' },
    { id: fileSystem[musicId] ? musicId : 'music', iconImg: '/apps/music_files.png', label: 'Musique' },
    { id: fileSystem[downloadsId] ? downloadsId : 'downloads', iconImg: '/apps/compressed_file.png', label: 'Téléchargements' },
    { id: fileSystem[videosId] ? videosId : 'videos', iconImg: '/apps/video.png', label: 'Vidéos' },
    { id: 'root', label: 'Système FloraOS', iconImg: '/apps/disk.png' },
    { id: 'trash', label: 'Corbeille', iconImg: '/apps/bin.png' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0b1120', color: '#e2e8f0' }}>
      {/* Hidden file input for native file imports */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleUploadChange}
        style={{ display: 'none' }}
      />

      {/* Top Header & Toolbar */}
      <div style={{
        height: '50px',
        background: 'rgba(15, 23, 42, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        gap: '12px'
      }}>
        {/* Navigation buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleBack}
            disabled={historyIndex <= 0}
            style={{
              background: 'transparent',
              border: 'none',
              color: historyIndex <= 0 ? '#475569' : '#fff',
              padding: '6px',
              borderRadius: '6px',
              cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            style={{
              background: 'transparent',
              border: 'none',
              color: historyIndex >= history.length - 1 ? '#475569' : '#fff',
              padding: '6px',
              borderRadius: '6px',
              cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronRight size={17} />
          </button>
          <button
            onClick={handleUp}
            disabled={!currentFolder.parentId}
            title="Dossier parent"
            style={{
              background: 'transparent',
              border: 'none',
              color: !currentFolder.parentId ? '#475569' : '#fff',
              padding: '6px',
              borderRadius: '6px',
              cursor: !currentFolder.parentId ? 'not-allowed' : 'pointer'
            }}
          >
            <ArrowUp size={16} />
          </button>
        </div>

        {/* Breadcrumb Path & Copy Button */}
        <div style={{
          flex: 1,
          maxWidth: '430px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          padding: '3px 8px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {getBreadcrumbs().map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                {idx > 0 && <span style={{ color: '#64748b' }}>/</span>}
                <span
                  onClick={() => navigateTo(crumb.id)}
                  style={{
                    cursor: 'pointer',
                    color: idx === getBreadcrumbs().length - 1 ? '#34d399' : '#cbd5e1',
                    fontWeight: idx === getBreadcrumbs().length - 1 ? 600 : 400
                  }}
                >
                  {crumb.name}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Copy path action button */}
          <button
            type="button"
            onClick={handleCopyCurrentPath}
            title={copiedPath ? "Chemin d'accès copié !" : "Copier le chemin d'accès"}
            style={{
              background: copiedPath ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '5px',
              padding: '3px 7px',
              color: copiedPath ? '#34d399' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
          >
            {copiedPath ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedPath ? 'Copié' : 'Copier'}</span>
          </button>
        </div>

        {/* Search bar */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '180px'
        }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '8px' }} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '5px 8px 5px 28px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              background: 'rgba(0, 0, 0, 0.25)',
              color: '#fff',
              fontSize: '11.5px',
              outline: 'none'
            }}
          />
        </div>

        {/* Action Buttons: New Folder, New File, Upload, Empty trash */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isTrash ? (
            <button
              onClick={emptyTrash}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Trash size={13} /> Vider
            </button>
          ) : (
            <>
              <button
                onClick={() => createFolder(currentFolderId)}
                title="Nouveau dossier"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                <FolderPlus size={14} color="#38bdf8" /> Dossier
              </button>

              <button
                onClick={() => createFile(currentFolderId, 'Nouveau_Document.txt')}
                title="Nouveau document texte"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                <FilePlus size={14} color="#f59e0b" /> Fichier
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                title="Importer un fichier depuis votre ordinateur"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'var(--accent-color)',
                  border: 'none',
                  color: '#fff',
                  padding: '5px 11px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <UploadCloud size={14} /> Importer
              </button>
            </>
          )}

          {/* View Mode Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title={viewMode === 'grid' ? 'Vue Liste' : 'Vue Grille'}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#cbd5e1',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {viewMode === 'grid' ? <List size={15} /> : <Grid size={15} />}
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <div style={{
          width: '185px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b', padding: '4px 8px', fontWeight: 700 }}>
            Emplacements
          </div>
          {sidebarLinks.map(link => {
            const isActive = currentFolderId === link.id;
            return (
              <div
                key={link.id}
                onClick={() => navigateTo(link.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#064e3b' : '#cbd5e1',
                  background: isActive ? '#bbf7d0' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {link.iconImg ? (
                  <img src={link.iconImg} alt="" style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
                ) : (
                  <DynamicIcon name={link.icon} size={15} color={isActive ? '#064e3b' : '#94a3b8'} />
                )}
                <span>{link.label}</span>
              </div>
            );
          })}
        </div>

        {/* Right Content View */}
        <div
          ref={contentPaneRef}
          style={{ flex: 1, overflowY: 'auto', padding: '16px', position: 'relative', userSelect: 'none' }}
          onMouseDown={handlePaneMouseDown}
          onMouseMove={handlePaneMouseMove}
          onMouseUp={handlePaneMouseUp}
          onContextMenu={(e) => {
            if (!e.target.closest('[data-explorer-item-id]')) {
              openContextMenu(e, 'explorer', null, currentFolderId);
            }
          }}
        >
          {/* Marquee selection box inside file explorer */}
          {marquee && (
            <div
              className="selection-marquee"
              style={{
                position: 'fixed',
                left: `${marquee.x}px`,
                top: `${marquee.y}px`,
                width: `${marquee.width}px`,
                height: `${marquee.height}px`,
                pointerEvents: 'none',
                zIndex: 9999
              }}
            />
          )}

          {filteredChildren.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#64748b',
                textAlign: 'center',
                gap: '12px',
                cursor: 'default'
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openContextMenu(e, 'explorer', null, currentFolderId);
              }}
            >
              <FolderOpen size={48} color="#475569" />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Ce dossier est vide</div>
              <div style={{ fontSize: '12px', maxWidth: '300px', lineHeight: 1.4 }}>
                Faites un clic-droit pour créer un fichier ou sous-dossier, ou utilisez le bouton ci-dessous.
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => createFolder(currentFolderId)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  + Nouveau dossier
                </button>
                <button
                  onClick={() => createFile(currentFolderId, 'Document.txt')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'var(--accent-glow)',
                    border: '1px solid var(--accent-color)',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  + Nouveau document
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
              gap: '14px'
            }}>
              {filteredChildren.map(node => {
                const { iconName, color, imageSrc } = getFileIconDetails(node);
                const isSelected = selectedIds.includes(node.id);
                const isDragTarget = dragOverFolderId === node.id;

                return (
                  <div
                    key={node.id}
                    data-explorer-item-id={node.id}
                    draggable={true}
                    onDragStart={(e) => {
                      const idsToDrag = selectedIds.includes(node.id) ? selectedIds : [node.id];
                      e.dataTransfer.setData('text/plain', JSON.stringify(idsToDrag));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      if (node.type === 'folder') {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverFolderId(node.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverFolderId === node.id) setDragOverFolderId(null);
                    }}
                    onDrop={(e) => {
                      if (node.type === 'folder') {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverFolderId(null);
                        const raw = e.dataTransfer.getData('text/plain');
                        let draggedIds = [];
                        try {
                          const parsed = JSON.parse(raw);
                          draggedIds = Array.isArray(parsed) ? parsed : [raw];
                        } catch {
                          draggedIds = [raw];
                        }
                        const validIds = draggedIds.filter(id => id && id !== node.id);
                        if (validIds.length > 0) {
                          moveNode(validIds, node.id);
                        }
                      }
                    }}
                    onClick={(e) => handleItemClick(node, e)}
                    onDoubleClick={() => {
                      if (node.type === 'folder') {
                        navigateTo(node.id);
                      } else {
                        openFile(node);
                      }
                    }}
                    onContextMenu={(e) => handleItemContextMenu(node, e)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '10px 8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: isDragTarget
                        ? '1px dashed var(--accent-color)'
                        : isSelected
                        ? '1px solid var(--accent-color)'
                        : '1px solid transparent',
                      background: isDragTarget
                        ? 'rgba(16, 185, 129, 0.3)'
                        : isSelected
                        ? 'rgba(16, 185, 129, 0.22)'
                        : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{
                      width: '52px',
                      height: '52px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      marginBottom: '6px'
                    }}>
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={node.name}
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/apps/default_app.png';
                          }}
                          style={{ width: '42px', height: '42px', objectFit: 'contain' }}
                        />
                      ) : node.url && node.extension && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(node.extension.toLowerCase()) ? (
                        <img
                          src={node.url}
                          alt={node.name}
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                      ) : (
                        <DynamicIcon name={iconName} size={30} color={color} />
                      )}
                    </div>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 500,
                      textAlign: 'center',
                      wordBreak: 'break-word',
                      maxHeight: '32px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.3
                    }}>
                      {node.name}
                    </span>
                    {node.size && (
                      <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                        {node.size}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 80px',
                padding: '6px 12px',
                fontSize: '11px',
                color: '#64748b',
                fontWeight: 600,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <span>Nom</span>
                <span>Type</span>
                <span>Taille</span>
                <span>Actions</span>
              </div>
              {filteredChildren.map(node => {
                const { iconName, color, imageSrc } = getFileIconDetails(node);
                const isSelected = selectedIds.includes(node.id);
                const isDragTarget = dragOverFolderId === node.id;

                return (
                  <div
                    key={node.id}
                    data-explorer-item-id={node.id}
                    draggable={true}
                    onDragStart={(e) => {
                      const idsToDrag = selectedIds.includes(node.id) ? selectedIds : [node.id];
                      e.dataTransfer.setData('text/plain', JSON.stringify(idsToDrag));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      if (node.type === 'folder') {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverFolderId(node.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverFolderId === node.id) setDragOverFolderId(null);
                    }}
                    onDrop={(e) => {
                      if (node.type === 'folder') {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverFolderId(null);
                        const raw = e.dataTransfer.getData('text/plain');
                        let draggedIds = [];
                        try {
                          const parsed = JSON.parse(raw);
                          draggedIds = Array.isArray(parsed) ? parsed : [raw];
                        } catch {
                          draggedIds = [raw];
                        }
                        const validIds = draggedIds.filter(id => id && id !== node.id);
                        if (validIds.length > 0) {
                          moveNode(validIds, node.id);
                        }
                      }
                    }}
                    onClick={(e) => handleItemClick(node, e)}
                    onDoubleClick={() => {
                      if (node.type === 'folder') {
                        navigateTo(node.id);
                      } else {
                        openFile(node);
                      }
                    }}
                    onContextMenu={(e) => handleItemContextMenu(node, e)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 80px',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      border: isDragTarget
                        ? '1px dashed var(--accent-color)'
                        : isSelected
                        ? '1px solid var(--accent-color)'
                        : '1px solid transparent',
                      background: isDragTarget
                        ? 'rgba(16, 185, 129, 0.3)'
                        : isSelected
                        ? 'rgba(16, 185, 129, 0.22)'
                        : 'transparent',
                      color: isSelected ? '#fff' : '#cbd5e1',
                      transition: 'background 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt=""
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/apps/default_app.png';
                          }}
                          style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                        />
                      ) : (
                        <DynamicIcon name={iconName} size={18} color={color} />
                      )}
                      {node.name}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>
                      {node.type === 'folder' ? 'Dossier' : node.extension?.toUpperCase() || 'Fichier'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>
                      {node.size || '—'}
                    </span>
                    <span style={{ display: 'flex', gap: '6px' }}>
                      {node.type === 'file' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadNodeFile(node.id);
                          }}
                          title="Télécharger"
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        >
                          <Download size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                        title="Supprimer"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
