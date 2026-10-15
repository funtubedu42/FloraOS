import React, { useState, useEffect } from 'react';
import {
  Save,
  Download,
  Copy,
  Check,
  FileText,
  Type,
  Eye,
  Edit3,
  Lock
} from 'lucide-react';
import { useOS } from '../../../context/OSContext';

export const TextEditor = ({ windowData, registerUnsavedHandler }) => {
  const { fileSystem, saveFileContent, createFile, downloadNodeFile, isProtectedSystemNode, playWarningSound } = useOS();
  const file = windowData.fileContext ? fileSystem[windowData.fileContext.id] : null;

  const isReadOnly = Boolean(
    windowData.fileContext?.isReadOnly || 
    (file && isProtectedSystemNode && isProtectedSystemNode(file))
  );

  const [content, setContent] = useState(file?.content || '// Nouveau document FloraOS\n');
  const [fontSize, setFontSize] = useState(13);
  const [isCopied, setIsCopied] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const handleSave = () => {
    if (isReadOnly) {
      if (playWarningSound) playWarningSound();
      return;
    }
    if (file) {
      saveFileContent(file.id, content);
      setHasUnsaved(false);
    } else {
      // Create new file on desktop with default name "Fichier sans nom.txt"
      const defaultName = windowData.fileContext?.name
        ? (windowData.fileContext.name.endsWith('.txt') ? windowData.fileContext.name : `${windowData.fileContext.name}.txt`)
        : 'Fichier sans nom.txt';
      const newId = createFile('desktop', defaultName, content, 'txt');
      setHasUnsaved(false);
    }
  };

  useEffect(() => {
    if (registerUnsavedHandler) {
      registerUnsavedHandler(hasUnsaved, handleSave);
    }
  }, [hasUnsaved, content, file?.id, registerUnsavedHandler]);

  useEffect(() => {
    if (file && file.content !== undefined) {
      setContent(file.content);
      setHasUnsaved(false);
    }
  }, [file?.id]);

  const handleChange = (e) => {
    if (isReadOnly) return;
    setContent(e.target.value);
    setHasUnsaved(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  // Keyboard shortcut Ctrl+S or Cmd+S
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const linesCount = content.split('\n').length;
  const wordsCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const isMarkdown = file?.extension === 'md';

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f172a', color: '#e2e8f0' }}
      onKeyDown={handleKeyDown}
    >
      {/* Editor Toolbar */}
      <div style={{
        height: '44px',
        background: 'rgba(30, 41, 59, 0.75)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: '12px'
      }}>
        {/* Left: Save & File Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isReadOnly ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              padding: '5px 12px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '11.5px',
              userSelect: 'none'
            }}>
              <Lock size={12} /> Journal Système (Lecture seule)
            </div>
          ) : (
            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: hasUnsaved ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
            >
              <Save size={14} /> {hasUnsaved ? 'Enregistrer *' : 'Enregistré'}
            </button>
          )}

          {isMarkdown && (
            <button
              onClick={() => setIsPreview(!isPreview)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isPreview ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '5px 10px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
              {isPreview ? 'Éditer' : 'Aperçu'}
            </button>
          )}

          <span style={{ color: '#94a3b8', fontSize: '11px' }}>
            {file ? file.name : 'Nouveau fichier'}
          </span>
        </div>

        {/* Right: Stats, Font Size, Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Font size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Type size={14} color="#94a3b8" />
            <button
              onClick={() => setFontSize(s => Math.max(10, s - 1))}
              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontWeight: 700 }}
            >
              -
            </button>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{fontSize}px</span>
            <button
              onClick={() => setFontSize(s => Math.min(22, s + 1))}
              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontWeight: 700 }}
            >
              +
            </button>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          {/* Copy all */}
          <button
            onClick={handleCopy}
            title="Copier tout le texte"
            style={{ background: 'none', border: 'none', color: isCopied ? '#34d399' : '#cbd5e1', cursor: 'pointer' }}
          >
            {isCopied ? <Check size={15} /> : <Copy size={15} />}
          </button>

          {/* Download */}
          {file && (
            <button
              onClick={() => downloadNodeFile(file.id)}
              title="Télécharger sur l'ordinateur"
              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
            >
              <Download size={15} />
            </button>
          )}

          {/* Status Counter */}
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {linesCount}L • {wordsCount}M • {charCount}C
          </div>
        </div>
      </div>

      {/* Editor Body */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
        {isPreview && isMarkdown ? (
          /* Rendered Markdown Preview */
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            lineHeight: 1.7,
            fontSize: `${fontSize + 1}px`,
            fontFamily: 'var(--font-sans)',
            color: '#f1f5f9'
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              {content.split('\n').map((line, idx) => {
                if (line.startsWith('# ')) return <h1 key={idx} style={{ fontSize: '26px', color: '#34d399', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>{line.slice(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={idx} style={{ fontSize: '20px', color: '#38bdf8', margin: '20px 0 10px 0' }}>{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={idx} style={{ fontSize: '16px', color: '#a78bfa', margin: '16px 0 8px 0' }}>{line.slice(4)}</h3>;
                if (line.startsWith('- ')) return <li key={idx} style={{ marginLeft: '20px', color: '#cbd5e1' }}>{line.slice(2)}</li>;
                if (!line.trim()) return <div key={idx} style={{ height: '10px' }} />;
                return <p key={idx} style={{ marginBottom: '8px', color: '#cbd5e1' }}>{line}</p>;
              })}
            </div>
          </div>
        ) : (
          /* Monospace Raw Textarea */
          <textarea
            value={content}
            onChange={handleChange}
            readOnly={isReadOnly}
            spellCheck={false}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              padding: '16px 20px',
              background: isReadOnly ? 'rgba(0, 0, 0, 0.15)' : 'transparent',
              color: '#f8fafc',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: `${fontSize}px`,
              lineHeight: 1.6,
              fontFamily: 'var(--font-mono)',
              cursor: isReadOnly ? 'default' : 'text'
            }}
          />
        )}
      </div>
    </div>
  );
};
