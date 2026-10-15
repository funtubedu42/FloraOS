import React, { useState, useEffect, useRef } from 'react';
import { Minus, Square, X, Copy, Check, Lock, Info, Folder, FileText, Globe, ExternalLink } from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const PropertiesModal = () => {
  const {
    propertiesModal,
    closePropertiesModal,
    fileSystem,
    playClickSound,
    isProtectedSystemNode
  } = useOS();

  const [position, setPosition] = useState(null);
  const [copied, setCopied] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const modalRef = useRef(null);

  const node = propertiesModal?.nodeId ? fileSystem[propertiesModal.nodeId] : propertiesModal?.node;

  useEffect(() => {
    if (propertiesModal && node) {
      const defaultW = 440;
      const defaultH = 460;
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 768;
      setPosition({
        x: Math.max(20, Math.round((screenW - defaultW) / 2)),
        y: Math.max(40, Math.round((screenH - defaultH) / 2) - 20)
      });
      setCopied(false);
    }
  }, [propertiesModal, node]);

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

  if (!propertiesModal || !node || !position) return null;

  const handleClose = () => {
    playClickSound();
    closePropertiesModal();
  };

  // Calculate full breadcrumbs path string
  const getPathString = () => {
    const segments = [node.name];
    let curr = node.parentId ? fileSystem[node.parentId] : null;
    while (curr) {
      segments.unshift(curr.name || curr.id);
      curr = curr.parentId ? fileSystem[curr.parentId] : null;
    }
    return 'FloraOS / ' + segments.join(' / ');
  };

  const fullPath = getPathString();

  const handleCopyPath = () => {
    navigator.clipboard.writeText(fullPath);
    setCopied(true);
    playClickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  // Node details calculation
  const isFolder = node.type === 'folder';
  const isWeb = Boolean(node.isWebShortcut || node.type === 'url' || (node.extension || '').toLowerCase() === 'url');
  const isShortcut = Boolean(node.isShortcut || isWeb);
  const isSystem = Boolean(isProtectedSystemNode && isProtectedSystemNode(node));

  // Determine type label
  let typeLabel = 'Fichier';
  if (isFolder) typeLabel = 'Dossier de fichiers';
  else if (isWeb) typeLabel = 'Raccourci Internet (.url)';
  else if (isShortcut) typeLabel = 'Raccourci vers un élément';
  else if (node.extension) {
    const ext = node.extension.toUpperCase();
    if (['TXT', 'MD', 'LOG'].includes(ext)) typeLabel = `Document texte (.${node.extension})`;
    else if (['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].includes(ext)) typeLabel = `Image (.${node.extension})`;
    else if (['MP4', 'WEBM'].includes(ext)) typeLabel = `Vidéo (.${node.extension})`;
    else if (['PDF'].includes(ext)) typeLabel = `Document PDF (.pdf)`;
    else typeLabel = `Fichier .${node.extension}`;
  }

  // Determine size
  let sizeLabel = node.size || '0 octet';
  if (!node.size && node.content) {
    const bytes = new Blob([node.content]).size;
    sizeLabel = bytes < 1024 ? `${bytes} octets` : `${(bytes / 1024).toFixed(1)} Ko`;
  }

  // Count children if folder
  const childrenCount = isFolder ? (node.children || []).length : null;

  // Formatted date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Non renseigné';
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date inconnue';
    }
  };

  const iconSrc = node.iconImg || (
    isFolder ? '/apps/folder.png' :
    isWeb ? '/apps/web.png' :
    node.extension === 'txt' ? '/apps/text_editor.png' :
    node.extension === 'pdf' ? '/apps/pdf_viewer.png' :
    '/apps/default_app.png'
  );

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
          width: '450px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <Info size={16} color="#38bdf8" />
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#f8fafc',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              Propriétés de {node.name}
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

            {/* 2. Maximize (Disabled for dialogs as requested) */}
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
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top header: Icon and Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <img
              src={iconSrc}
              alt=""
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = isFolder ? '/apps/folder.png' : '/apps/default_app.png';
              }}
              style={{ width: '44px', height: '44px', objectFit: 'contain' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#f8fafc',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {node.name}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {typeLabel}
              </div>
            </div>
          </div>

          {/* Metadata Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '12.5px' }}>
            {/* Type */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Type d'élément :</span>
              <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{typeLabel}</span>
            </div>

            {/* Path with Copy Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Chemin d'accès :</span>
                <button
                  type="button"
                  onClick={handleCopyPath}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    color: copied ? '#34d399' : '#38bdf8',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copié !' : 'Copier le chemin'}
                </button>
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#cbd5e1',
                fontSize: '11.5px',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={fullPath}
              >
                {fullPath}
              </div>
            </div>

            {/* Size */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Taille :</span>
              <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{sizeLabel}</span>
            </div>

            {/* Folder contents */}
            {isFolder && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Contenu :</span>
                <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                  {childrenCount} élément{childrenCount > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Shortcut target */}
            {isWeb && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#94a3b8' }}>URL cible :</span>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#38bdf8',
                  fontSize: '11.5px',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {node.url || 'https://duckduckgo.com'}
                </div>
              </div>
            )}

            {/* Created date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Créé le :</span>
              <span style={{ color: '#cbd5e1' }}>{formatDate(node.createdAt)}</span>
            </div>

            {/* Attributes */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Attributs système :</span>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'default', color: isSystem ? '#f87171' : '#94a3b8' }}>
                  <input type="checkbox" checked={isSystem} readOnly disabled style={{ accentColor: '#ef4444' }} />
                  {isSystem ? 'Lecture seule (Protégé)' : 'Modifiable'}
                </label>
                {isSystem && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    <Lock size={10} /> Système
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            className="flora-btn flora-btn-primary"
            onClick={handleClose}
            autoFocus
            style={{ minWidth: '92px', height: '36px' }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesModal;
