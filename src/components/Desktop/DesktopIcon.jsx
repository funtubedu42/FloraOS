import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { DynamicIcon, getFileIconDetails } from '../../utils/IconHelper';

export const DesktopIcon = ({ nodeId, isSelected, onSelect, defaultPos }) => {
  const {
    fileSystem,
    openFile,
    openContextMenu,
    renameNode,
    iconPositions,
    updateIconPosition,
    windows,
    moveNode,
    settings
  } = useOS();

  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState('');

  const node = fileSystem[nodeId];
  if (!node) return null;

  const savedPos = (iconPositions && iconPositions[nodeId]) || defaultPos || { x: 20, y: 46 };
  const [pos, setPos] = useState(savedPos);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const iconStartPos = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Synchronize position whenever saved positions change and not dragging
  useEffect(() => {
    if (!isDragging) {
      const userSavedPos = iconPositions && iconPositions[nodeId];
      if (userSavedPos && userSavedPos.x !== undefined && userSavedPos.y !== undefined) {
        setPos(userSavedPos);
      } else if (defaultPos) {
        setPos(defaultPos);
      }
    }
  }, [iconPositions, nodeId, defaultPos, isDragging]);

  const { iconName, color, imageSrc } = getFileIconDetails(node);

  // Check if open in any window
  const openWindows = (windows || []).filter(w => {
    if (node.type === 'folder' && w.appId === 'explorer' && w.data?.folderId === node.id) return true;
    if (node.type === 'file' && (w.data?.fileId === node.id || w.title === node.name)) return true;
    return false;
  });

  const handlePointerDown = (e) => {
    // Only handle left mouse click
    if (e.button !== 0 || isRenaming) return;
    e.stopPropagation();

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    iconStartPos.current = { ...pos };
    hasMovedRef.current = false;

    const handlePointerMove = (moveEvt) => {
      const dx = moveEvt.clientX - dragStartRef.current.x;
      const dy = moveEvt.clientY - dragStartRef.current.y;

      if (!hasMovedRef.current && Math.hypot(dx, dy) > 4) {
        hasMovedRef.current = true;
        setIsDragging(true);
      }

      if (hasMovedRef.current) {
        moveEvt.preventDefault();
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const newX = Math.max(8, Math.min(iconStartPos.current.x + dx, screenW - 88));
        const newY = Math.max(32, Math.min(iconStartPos.current.y + dy, screenH - 110));
        setPos({ x: newX, y: newY });
      }
    };

    const handlePointerUp = (upEvt) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (hasMovedRef.current) {
        setIsDragging(false);

        // Check if dropped onto a desktop folder
        const dropEl = document.elementFromPoint(upEvt.clientX, upEvt.clientY);
        const folderTarget = dropEl?.closest('[data-folder-target]');
        const targetFolderId = folderTarget?.getAttribute('data-folder-target');

        if (targetFolderId && targetFolderId !== nodeId) {
          moveNode(nodeId, targetFolderId);
          return;
        }

        const dx = upEvt.clientX - dragStartRef.current.x;
        const dy = upEvt.clientY - dragStartRef.current.y;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const finalX = Math.max(8, Math.min(iconStartPos.current.x + dx, screenW - 88));
        const finalY = Math.max(32, Math.min(iconStartPos.current.y + dy, screenH - 110));

        const snap = settings?.snapToGrid !== false;
        const snappedX = snap ? Math.round((finalX - 16) / 92) * 92 + 16 : finalX;
        const snappedY = snap ? Math.round((finalY - 36) / 96) * 96 + 36 : finalY;
        const finalPos = { x: Math.max(16, Math.round(snappedX)), y: Math.max(36, Math.round(snappedY)) };
        setPos(finalPos);
        updateIconPosition(nodeId, finalPos);
      } else {
        onSelect(nodeId, upEvt, false);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    openFile(node);
  };

  const handleContextMenu = (e) => {
    e.stopPropagation();
    onSelect(nodeId, e, true);
    openContextMenu(e, node.type, node.id, node.parentId);
  };

  const handleStartRename = (e) => {
    e.stopPropagation();
    setTempName(node.name);
    setIsRenaming(true);
  };

  const handleFinishRename = () => {
    if (tempName.trim()) {
      renameNode(node.id, tempName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleFinishRename();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
    }
  };

  const tooltipText = openWindows.length > 0
    ? `${node.name} (${openWindows.length} fenêtre${openWindows.length > 1 ? 's' : ''} ouverte${openWindows.length > 1 ? 's' : ''})`
    : node.name;

  return (
    <div
      className={`desktop-icon-item ${isSelected ? 'selected' : ''}`}
      data-desktop-icon-id={nodeId}
      data-folder-target={node.type === 'folder' ? nodeId : undefined}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      title={tooltipText}
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: isDragging ? 99 : (isSelected ? 10 : 2),
        cursor: isDragging ? 'grabbing' : 'pointer',
        transition: isDragging ? 'none' : 'transform 0.15s ease',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      <div className="desktop-icon-visual" style={{ position: 'relative' }}>
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
            style={{
              width: `${settings?.iconSize === 'small' ? 34 : settings?.iconSize === 'large' ? 52 : 42}px`,
              height: `${settings?.iconSize === 'small' ? 34 : settings?.iconSize === 'large' ? 52 : 42}px`,
              objectFit: 'contain'
            }}
          />
        ) : node.url && node.extension && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(node.extension.toLowerCase()) ? (
          <img
            src={node.url}
            alt={node.name}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={{
              width: `${settings?.iconSize === 'small' ? 34 : settings?.iconSize === 'large' ? 52 : 42}px`,
              height: `${settings?.iconSize === 'small' ? 34 : settings?.iconSize === 'large' ? 52 : 42}px`,
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
        ) : (
          <DynamicIcon name={iconName} size={settings?.iconSize === 'small' ? 24 : settings?.iconSize === 'large' ? 38 : 30} color={color} />
        )}

        {/* Shortcut Indicator Badge (curved arrow) */}
        {node.isShortcut && (
          <div
            title="Raccourci"
            style={{
              position: 'absolute',
              bottom: '-2px',
              left: '-2px',
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: 'rgba(15, 23, 42, 0.94)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.45)'
            }}
          >
            <ExternalLink size={10} color="#38bdf8" />
          </div>
        )}

        {/* Small dot indicator if this desktop file has an active window */}
        {openWindows.length > 0 && (
          <span
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-color)',
              boxShadow: '0 0 6px var(--accent-color)',
              border: '1px solid rgba(0,0,0,0.4)'
            }}
          />
        )}
      </div>

      {isRenaming ? (
        <input
          type="text"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleFinishRename}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: '100%',
            fontSize: '11px',
            textAlign: 'center',
            padding: '2px 4px',
            background: 'rgba(0, 0, 0, 0.85)',
            border: '1px solid var(--accent-color)',
            color: '#fff',
            borderRadius: '4px',
            outline: 'none'
          }}
        />
      ) : (
        <span
          className="desktop-icon-label"
          onDoubleClick={(e) => {
            if (isSelected) handleStartRename(e);
          }}
        >
          {node.name}
        </span>
      )}
    </div>
  );
};
