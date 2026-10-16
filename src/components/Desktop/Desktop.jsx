import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { DesktopIcon } from './DesktopIcon';

export const Desktop = () => {
  const {
    fileSystem,
    getActiveDesktopId,
    openContextMenu,
    closeContextMenu,
    uploadRealFile,
    clipboard,
    copyNode,
    cutNode,
    pasteNode,
    deleteNode,
    createShortcutOnDesktop,
    updateIconPosition,
    settings,
    setActiveWindowId
  } = useOS();
  const [selectedIds, setSelectedIds] = useState([]);
  const [marquee, setMarquee] = useState(null);
  const isDraggingMarquee = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const activeDesktopId = getActiveDesktopId ? getActiveDesktopId() : 'desktop';
  const desktopFolder = fileSystem[activeDesktopId] || fileSystem.desktop || { children: [] };
  const desktopChildren = desktopFolder ? desktopFolder.children || [] : [];

  // Desktop keyboard shortcuts (Ctrl+A, Ctrl+C, Ctrl+X, Ctrl+V, Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedIds([...desktopChildren]);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedIds.length > 0) {
        copyNode(selectedIds);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x' && selectedIds.length > 0) {
        cutNode(selectedIds);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboard) {
        pasteNode(activeDesktopId);
      } else if (e.key === 'Delete' && selectedIds.length > 0) {
        deleteNode(selectedIds);
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, clipboard, activeDesktopId, desktopChildren, copyNode, cutNode, pasteNode, deleteNode]);

  // Marquee selection handlers
  const handleMouseDown = (e) => {
    // Only handle primary left click
    if (e.button !== 0) return;

    // Do not start marquee if user clicked on an icon, a window, taskbar, start menu, context menu or modal
    if (
      e.target.closest('[data-desktop-icon-id]') ||
      e.target.closest('.flora-window') ||
      e.target.closest('.flora-taskbar') ||
      e.target.closest('.flora-start-menu') ||
      e.target.closest('.flora-context-menu') ||
      e.target.closest('.flora-modal-card')
    ) {
      return;
    }

    // Crucial: prevent browser native text selection & native drag so mouse dragging is reliable
    e.preventDefault();

    closeContextMenu();
    setActiveWindowId(null);

    const isMulti = e.ctrlKey || e.metaKey;
    const initialSelection = isMulti ? [...selectedIds] : [];
    if (!isMulti) {
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

    const handleWindowMouseMove = (moveEvt) => {
      if (!isDraggingMarquee.current) return;
      const currentX = moveEvt.clientX;
      const currentY = moveEvt.clientY;

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

        const iconElements = document.querySelectorAll('[data-desktop-icon-id]');
        const matched = [];

        iconElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          const intersects = !(
            rect.right < mLeft ||
            rect.left > mRight ||
            rect.bottom < mTop ||
            rect.top > mBottom
          );
          if (intersects) {
            const id = el.getAttribute('data-desktop-icon-id');
            if (id) matched.push(id);
          }
        });

        if (isMulti) {
          setSelectedIds(Array.from(new Set([...initialSelection, ...matched])));
        } else {
          setSelectedIds(matched);
        }
      }
    };

    const handleWindowMouseUp = () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      if (isDraggingMarquee.current) {
        isDraggingMarquee.current = false;
        setMarquee(null);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  // Host OS file drag-and-drop onto FloraOS desktop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Host OS file drag-and-drop onto FloraOS desktop
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        uploadRealFile(activeDesktopId, file);
      });
      return;
    }

    // 2. Dragged item from FileExplorer onto FloraOS desktop
    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (raw) {
        const nodeIds = JSON.parse(raw);
        if (Array.isArray(nodeIds) && nodeIds.length > 0) {
          const deskNode = fileSystem[activeDesktopId] || { children: [] };
          const dropX = e.clientX;
          const dropY = e.clientY;

          nodeIds.forEach((id, idx) => {
            const node = fileSystem[id];
            if (!node) return;

            // If the item is already on the desktop, move it to the drop point
            if (deskNode.children?.includes(id)) {
              const snap = settings?.snapToGrid !== false;
              const posX = snap ? Math.round((dropX - 16) / 92) * 92 + 16 : dropX;
              const posY = snap ? Math.round((dropY - 36) / 96) * 96 + 36 : dropY;
              updateIconPosition(id, { x: Math.max(16, posX + idx * 24), y: Math.max(36, posY) });
            } else {
              // Otherwise, create a desktop shortcut placed right where dropped!
              createShortcutOnDesktop(id, { x: dropX + idx * 24, y: dropY });
            }
          });
        }
      }
    } catch (err) {
      console.debug('Desktop drop parse error', err);
    }
  };

  const handleContextMenu = (e) => {
    if (!e.target.closest('[data-desktop-icon-id]')) {
      openContextMenu(e, 'desktop', null, activeDesktopId);
    }
  };

  const handleIconSelect = (nodeId, evt, isRightClick = false) => {
    if (isRightClick) {
      if (!selectedIds.includes(nodeId)) {
        setSelectedIds([nodeId]);
      }
      return;
    }

    if (evt && (evt.ctrlKey || evt.metaKey)) {
      setSelectedIds(prev => prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]);
    } else if (evt && evt.shiftKey && selectedIds.length > 0) {
      const last = selectedIds[selectedIds.length - 1];
      const idx1 = desktopChildren.indexOf(last);
      const idx2 = desktopChildren.indexOf(nodeId);
      if (idx1 !== -1 && idx2 !== -1) {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        const range = desktopChildren.slice(start, end + 1);
        setSelectedIds(Array.from(new Set([...selectedIds, ...range])));
      } else {
        setSelectedIds([nodeId]);
      }
    } else {
      setSelectedIds([nodeId]);
    }
  };

  // Calculate default grid position based on screen height
  const itemsPerCol = 6;

  return (
    <div
      className="desktop-bg-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Selection Marquee Box */}
      {marquee && (
        <div
          className="selection-marquee"
          style={{
            position: 'absolute',
            left: `${marquee.x}px`,
            top: `${marquee.y}px`,
            width: `${marquee.width}px`,
            height: `${marquee.height}px`,
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
      )}

      {/* Freely Placed / Draggable Icons on Desktop */}
      {desktopChildren.map((childId, idx) => {
        const col = Math.floor(idx / itemsPerCol);
        const row = idx % itemsPerCol;
        const defaultPos = {
          x: 24 + col * 96,
          y: 48 + row * 104
        };

        return (
          <DesktopIcon
            key={childId}
            nodeId={childId}
            defaultPos={defaultPos}
            isSelected={selectedIds.includes(childId)}
            onSelect={handleIconSelect}
          />
        );
      })}
    </div>
  );
};
