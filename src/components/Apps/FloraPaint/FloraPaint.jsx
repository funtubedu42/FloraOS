import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../../context/OSContext';
import {
  Paintbrush,
  Eraser,
  Square,
  Circle,
  Minus,
  RotateCcw,
  RotateCw,
  Download,
  Save,
  Trash2,
  Type,
  Eye
} from 'lucide-react';

export const FloraPaint = ({ windowData, registerUnsavedHandler }) => {
  const { createFile, openApp, notify, playSuccessSound, currentUser, getActiveDesktopId } = useOS();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const [tool, setTool] = useState('brush'); // brush, eraser, line, rect, circle
  const [color, setColor] = useState('#38bdf8');
  const [lineWidth, setLineWidth] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const snapshot = useRef(null);

  const colorPalette = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#f59e0b',
    '#10b981', '#06b6d4', '#38bdf8', '#8b5cf6', '#ec4899'
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 900;
    canvas.height = 600;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    contextRef.current = ctx;

    // Save initial state
    const initialData = canvas.toDataURL();
    setHistory([initialData]);
    setHistoryStep(0);
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newStep = historyStep + 1;
    const newHistory = history.slice(0, newStep);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newStep);
    setHasUnsaved(true);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      restoreHistoryStep(prevStep);
      setHistoryStep(prevStep);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      restoreHistoryStep(nextStep);
      setHistoryStep(nextStep);
    }
  };

  const restoreHistoryStep = (step) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx || !history[step]) return;

    const img = new Image();
    img.src = history[step];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    const pos = getCanvasCoords(e);
    startPos.current = pos;
    setIsDrawing(true);

    snapshot.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'eraser' ? lineWidth * 2.5 : lineWidth;
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const pos = getCanvasCoords(e);

    if (tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      // Restore previous frame for shape dragging
      ctx.putImageData(snapshot.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.fillStyle = color;

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.current.x, startPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        const w = pos.x - startPos.current.x;
        const h = pos.y - startPos.current.y;
        ctx.strokeRect(startPos.current.x, startPos.current.y, w, h);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(pos.x - startPos.current.x, 2) + Math.pow(pos.y - startPos.current.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPos.current.x, startPos.current.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    contextRef.current?.closePath();
    saveToHistory();
  };

  const clearCanvas = () => {
    if (window.confirm('Voulez-vous effacer tout le dessin ?')) {
      const ctx = contextRef.current;
      const canvas = canvasRef.current;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  };

  // Download locally
  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `dessin_floraos_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    playSuccessSound();
  };

  // Hook into OS window closing confirmation
  useEffect(() => {
    if (registerUnsavedHandler) {
      registerUnsavedHandler(hasUnsaved, saveToOS);
    }
  }, [hasUnsaved, registerUnsavedHandler]);

  // Save directly to FloraOS virtual filesystem
  const saveToOS = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const fileName = `Dessin_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}_${Date.now().toString().slice(-4)}.png`;

    const targetFolder = getActiveDesktopId();
    const newFileId = createFile(targetFolder, fileName, dataUrl);
    setHasUnsaved(false);
    playSuccessSound();
    notify(
      'FloraPaint',
      `« ${fileName} » enregistré. Cliquez pour ouvrir dans Photos.`,
      '/apps/paint_app.png',
      () => openApp('imageViewer', { id: newFileId, name: fileName, content: dataUrl })
    );
    return newFileId;
  };

  const openInPhotos = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    openApp('imageViewer', { id: null, name: 'Aperçu FloraPaint', content: dataUrl });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0f172a',
      color: '#f8fafc',
      userSelect: 'none'
    }}>
      {/* Top Toolbar */}
      <div style={{
        padding: '10px 14px',
        background: 'rgba(30, 41, 59, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[
            { id: 'brush', icon: Paintbrush, label: 'Pinceau' },
            { id: 'eraser', icon: Eraser, label: 'Gomme' },
            { id: 'line', icon: Minus, label: 'Ligne' },
            { id: 'rect', icon: Square, label: 'Rectangle' },
            { id: 'circle', icon: Circle, label: 'Cercle' }
          ].map(t => {
            const Icon = t.icon;
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                title={t.label}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  border: active ? '1px solid var(--accent-color, #38bdf8)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: active ? 'var(--accent-color, #38bdf8)' : 'rgba(255, 255, 255, 0.05)',
                  color: active ? '#fff' : '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        {/* Thickness slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Épaisseur</span>
          <input
            type="range"
            min="1"
            max="40"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            style={{ width: '80px', accentColor: 'var(--accent-color, #38bdf8)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '11px', fontWeight: 600, minWidth: '24px' }}>{lineWidth}px</span>
        </div>

        {/* Palette */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {colorPalette.map(c => (
            <div
              key={c}
              onClick={() => {
                setColor(c);
                if (tool === 'eraser') setTool('brush');
              }}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: c,
                border: color === c ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: color === c ? '0 0 8px rgba(255, 255, 255, 0.5)' : 'none',
                cursor: 'pointer',
                transform: color === c ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.1s ease'
              }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              if (tool === 'eraser') setTool('brush');
            }}
            title="Couleur personnalisée"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent'
            }}
          />
        </div>

        {/* Actions: Undo / Redo / Clear / Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            title="Annuler (Ctrl+Z)"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: historyStep <= 0 ? '#475569' : '#cbd5e1',
              cursor: historyStep <= 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            title="Rétablir (Ctrl+Y)"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: historyStep >= history.length - 1 ? '#475569' : '#cbd5e1',
              cursor: historyStep >= history.length - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <RotateCw size={14} />
          </button>

          <button
            onClick={clearCanvas}
            title="Tout effacer"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={saveToOS}
            title="Enregistrer sur FloraOS"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-color, #10b981)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Save size={14} /> Enregistrer
          </button>

          <button
            onClick={openInPhotos}
            title="Ouvrir dans la visionneuse de photos"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <Eye size={14} /> Photos
          </button>

          <button
            onClick={downloadDrawing}
            title="Télécharger l'image"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Workspace Container */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: '#090d16'
      }}>
        <div style={{
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
          borderRadius: '4px',
          overflow: 'hidden',
          background: '#fff'
        }}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            style={{
              display: 'block',
              cursor: tool === 'eraser' ? 'cell' : 'crosshair',
              touchAction: 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
};
