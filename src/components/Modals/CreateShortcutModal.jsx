import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Minus, Square, X, Link, Globe, Folder, FileText, Sparkles, Check } from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const CreateShortcutModal = () => {
  const {
    shortcutModal,
    closeShortcutModal,
    fileSystem,
    createWebShortcut,
    createShortcutOnDesktop,
    getActiveDesktopId,
    setFileSystem,
    playClickSound,
    playSuccessSound
  } = useOS();

  const [target, setTarget] = useState('https://');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [position, setPosition] = useState(null);

  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const modalRef = useRef(null);

  const parentFolderId = shortcutModal?.parentId || 'desktop';

  // Center window on open
  useEffect(() => {
    if (shortcutModal) {
      setTarget('https://');
      setName('');
      setError('');
      const defaultW = 460;
      const defaultH = 430;
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 768;
      setPosition({
        x: Math.max(20, Math.round((screenW - defaultW) / 2)),
        y: Math.max(40, Math.round((screenH - defaultH) / 2) - 30)
      });
    }
  }, [shortcutModal]);

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

  // Adaptive detection of shortcut target type & icon
  const detectedTarget = useMemo(() => {
    const trimmed = (target || '').trim();
    if (!trimmed) {
      return { type: 'unknown', icon: '/apps/web.png', label: 'Cible non définie', node: null };
    }

    // 1. Web URL pattern
    const isWeb = /^(https?:\/\/|www\.)/i.test(trimmed) ||
                  /\.(com|org|net|fr|io|dev|app|edu|gov|co|info)(\/|$)/i.test(trimmed);
    if (isWeb) {
      let cleanDomain = trimmed.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      return {
        type: 'web',
        icon: '/apps/web.png',
        label: 'Lien Web Internet',
        suggestedName: cleanDomain ? cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1) : 'Site Web',
        url: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
      };
    }

    // 2. Direct Node ID or name match in FileSystem
    const allNodes = Object.values(fileSystem || {});
    // Exact ID match
    let matchedNode = fileSystem[trimmed];
    // Or match by name (case-insensitive)
    if (!matchedNode) {
      matchedNode = allNodes.find(n => n.name && n.name.toLowerCase() === trimmed.toLowerCase());
    }

    if (matchedNode) {
      const isFolder = matchedNode.type === 'folder';
      let icon = matchedNode.iconImg;
      if (!icon) {
        if (isFolder) icon = '/apps/folder.png';
        else if (matchedNode.extension === 'txt') icon = '/apps/text_editor.png';
        else if (['jpg', 'png', 'jpeg'].includes(matchedNode.extension)) icon = '/apps/image_viewer.png';
        else if (matchedNode.extension === 'pdf') icon = '/apps/pdf_viewer.png';
        else icon = '/apps/default_app.png';
      }

      return {
        type: isFolder ? 'folder' : 'file',
        icon,
        label: isFolder ? `Dossier (${matchedNode.name})` : `Fichier (${matchedNode.name})`,
        suggestedName: `${matchedNode.name} — Raccourci`,
        node: matchedNode
      };
    }

    // Fallback: assume web if it has dots or characters
    return {
      type: 'web',
      icon: '/apps/web.png',
      label: 'Lien Web Internet',
      suggestedName: trimmed.replace(/^https?:\/\//, '') || 'Nouveau raccourci',
      url: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    };
  }, [target, fileSystem]);

  if (!shortcutModal || !position) return null;

  const handleClose = () => {
    playClickSound();
    closeShortcutModal();
  };

  const handleQuickSelect = (nodeId) => {
    const node = fileSystem[nodeId];
    if (node) {
      setTarget(node.name);
      setName(`${node.name} — Raccourci`);
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalTarget = (target || '').trim();
    if (!finalTarget) {
      setError('Veuillez spécifier une cible pour le raccourci.');
      return;
    }

    const finalName = (name || '').trim() || detectedTarget.suggestedName || 'Raccourci';

    if (detectedTarget.type === 'web') {
      const finalUrl = detectedTarget.url || finalTarget;
      createWebShortcut(parentFolderId, finalName, finalUrl);
      playSuccessSound();
      closeShortcutModal();
      return;
    }

    if (detectedTarget.node) {
      const targetNode = detectedTarget.node;
      const targetDeskId = (!parentFolderId || parentFolderId === 'desktop') ? getActiveDesktopId() : parentFolderId;
      const shortcutId = `shortcut_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

      const newShortcut = {
        id: shortcutId,
        name: finalName,
        type: targetNode.type,
        isShortcut: true,
        targetId: targetNode.id,
        extension: targetNode.extension || '',
        iconImg: detectedTarget.icon,
        parentId: targetDeskId,
        createdAt: Date.now()
      };

      setFileSystem(prev => {
        const dest = prev[targetDeskId] || { children: [] };
        return {
          ...prev,
          [shortcutId]: newShortcut,
          [targetDeskId]: {
            ...dest,
            children: [...(dest.children || []), shortcutId]
          }
        };
      });

      playSuccessSound();
      closeShortcutModal();
      return;
    }

    // Fallback as web shortcut
    createWebShortcut(parentFolderId, finalName, finalTarget.startsWith('http') ? finalTarget : `https://${finalTarget}`);
    playSuccessSound();
    closeShortcutModal();
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
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '460px',
          maxWidth: '94vw',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '12px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
          animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Titlebar Header with 3 Action Buttons */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link size={16} color="#38bdf8" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
              Créer un raccourci
            </span>
          </div>

          {/* 3 Action Buttons: Minimize, Maximize (Disabled), Close */}
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

            {/* 2. Maximize (Disabled) */}
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

        {/* Content Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 22px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
              Indiquez l'adresse d'un site web ou le nom d'un élément (dossier ou fichier) de votre système.
            </div>

            {/* Target Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                Cible du raccourci (Lien web, chemin ou dossier/fichier) :
              </label>
              <input
                type="text"
                value={target}
                placeholder="https://... ou nom de dossier/fichier"
                onChange={(e) => {
                  setTarget(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Quick Suggestions Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Accès rapide dans FloraOS :</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['documents', 'images', 'music', 'videos', 'downloads'].map(fId => {
                  const fNode = fileSystem[fId];
                  if (!fNode) return null;
                  return (
                    <button
                      key={fId}
                      type="button"
                      onClick={() => handleQuickSelect(fId)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#cbd5e1',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      <Folder size={11} color="#38bdf8" />
                      {fNode.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Adaptive Icon Preview Card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 14px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)'
              }}>
                <img
                  src={detectedTarget.icon}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/apps/web.png';
                  }}
                  style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {detectedTarget.label}
                  </span>
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#f8fafc',
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {name || detectedTarget.suggestedName || 'Aperçu du raccourci'}
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                Nom affiché pour le raccourci (facultatif) :
              </label>
              <input
                type="text"
                value={name}
                placeholder={detectedTarget.suggestedName || 'Nom du raccourci'}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {error && (
              <div style={{ fontSize: '12px', color: '#f87171' }}>
                {error}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
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
              style={{ minWidth: '92px', height: '36px' }}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="flora-btn flora-btn-primary"
              style={{ minWidth: '120px', height: '36px' }}
            >
              Créer le raccourci
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShortcutModal;
