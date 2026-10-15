import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  Download,
  Image as ImageIcon,
  Sparkles,
  Info,
  Layers
} from 'lucide-react';
import { useOS } from '../../../context/OSContext';

const FILTERS = [
  { id: 'none', name: 'Original', css: 'none' },
  { id: 'emerald', name: 'Flora Émeraude', css: 'hue-rotate(60deg) saturate(1.4)' },
  { id: 'grayscale', name: 'Noir & Blanc', css: 'grayscale(100%) contrast(1.1)' },
  { id: 'sepia', name: 'Sépia Vintage', css: 'sepia(85%) contrast(1.05)' },
  { id: 'vibrant', name: 'Vibrant', css: 'saturate(1.8) contrast(1.15)' }
];

export const ImageViewer = ({ windowData }) => {
  const { downloadNodeFile, setWallpaperFromImage } = useOS();
  const file = windowData.fileContext;
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const [showInfo, setShowInfo] = useState(false);

  const imageUrl = file?.url || 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=1400&q=80';

  const handleZoomIn = () => setZoom(z => Math.min(z + 20, 250));
  const handleZoomOut = () => setZoom(z => Math.max(z - 20, 40));
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  const handleFlip = () => setFlipped(f => !f);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
    setFlipped(false);
    setActiveFilter('none');
  };

  const setAsWallpaper = () => {
    setWallpaperFromImage(imageUrl, file?.name || 'Image personnalisée');
  };

  const currentFilterObj = FILTERS.find(f => f.id === activeFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0b0f19', color: '#fff' }}>
      {/* Top Toolbar */}
      <div style={{
        height: '46px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: '12px'
      }}>
        {/* Left: Zoom & Transform controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleZoomOut}
            title="Zoom arrière"
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
          >
            <ZoomOut size={15} />
          </button>
          <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 600 }}>{zoom}%</span>
          <button
            onClick={handleZoomIn}
            title="Zoom avant"
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
          >
            <ZoomIn size={15} />
          </button>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

          <button
            onClick={handleRotate}
            title="Pivoter"
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
          >
            <RotateCw size={15} />
          </button>

          <button
            onClick={handleFlip}
            title="Miroir horizontal"
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
          >
            <FlipHorizontal size={15} />
          </button>

          <button
            onClick={handleReset}
            title="Réinitialiser"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#cbd5e1',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Ajuster
          </button>
        </div>

        {/* Center: Filter selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#34d399" />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '6px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {FILTERS.map(f => (
              <option key={f.id} value={f.id} style={{ background: '#0f172a', color: '#fff' }}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Set wallpaper & Download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={setAsWallpaper}
            title="Définir en fond d'écran de FloraOS"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <Layers size={13} color="#38bdf8" /> Fond d'écran
          </button>

          {file && (
            <button
              onClick={() => downloadNodeFile(file.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--accent-color)',
                border: 'none',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={13} />
            </button>
          )}

          <button
            onClick={() => setShowInfo(!showInfo)}
            style={{
              background: showInfo ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#fff',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Info size={15} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)',
        padding: '20px'
      }}>
        <img
          src={imageUrl}
          alt={file?.name || 'Image'}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{
            maxWidth: '90%',
            maxHeight: '90%',
            objectFit: 'contain',
            transform: `scale(${zoom / 100}) rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`,
            filter: currentFilterObj?.css || 'none',
            transition: 'transform 0.18s ease, filter 0.3s ease',
            borderRadius: '8px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}
        />

        {/* Floating Info Card */}
        {showInfo && file && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '14px 18px',
            fontSize: '12px',
            maxWidth: '260px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '6px', color: '#fff' }}>{file.name}</div>
            <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div>Taille : {file.size || 'Inconnue'}</div>
              <div>Type : {file.extension?.toUpperCase() || 'Image'}</div>
              <div>Filtre actif : {currentFilterObj?.name}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
