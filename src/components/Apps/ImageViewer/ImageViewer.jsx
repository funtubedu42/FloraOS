import React, { useState, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  Download,
  Image as ImageIcon,
  Sparkles,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  Paintbrush,
  FolderOpen
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
  const { fileSystem, openApp, downloadNodeFile, setWallpaperFromImage } = useOS();
  const file = windowData?.fileContext;

  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const [showInfo, setShowInfo] = useState(false);
  const [activeImageId, setActiveImageId] = useState(file?.id || null);

  // Discover all images in VFS
  const allImages = useMemo(() => {
    return Object.values(fileSystem || {})
      .filter(node => {
        if (!node || node.type !== 'file' || node.parentId === 'trash') return false;
        const ext = (node.name || '').split('.').pop().toLowerCase();
        return ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext);
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [fileSystem]);

  // Determine current image node
  const activeNode = useMemo(() => {
    if (activeImageId && fileSystem[activeImageId]) {
      return fileSystem[activeImageId];
    }
    if (file && (file.content || file.url)) {
      return file;
    }
    if (allImages.length > 0) {
      return allImages[0];
    }
    return null;
  }, [activeImageId, file, fileSystem, allImages]);

  const currentIndex = allImages.findIndex(img => img.id === activeNode?.id);

  const handlePrevImage = () => {
    if (allImages.length > 1 && currentIndex > 0) {
      setActiveImageId(allImages[currentIndex - 1].id);
      handleReset();
    }
  };

  const handleNextImage = () => {
    if (allImages.length > 1 && currentIndex < allImages.length - 1) {
      setActiveImageId(allImages[currentIndex + 1].id);
      handleReset();
    }
  };

  const imageUrl = activeNode?.content || activeNode?.url || null;

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
    if (imageUrl) {
      setWallpaperFromImage(imageUrl, activeNode?.name || 'Image personnalisée');
    }
  };

  const currentFilterObj = FILTERS.find(f => f.id === activeFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0b0f19', color: '#fff', userSelect: 'none' }}>
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
          {allImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                disabled={currentIndex <= 0}
                title="Image précédente"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: currentIndex <= 0 ? '#475569' : '#fff',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {currentIndex + 1} / {allImages.length}
              </span>
              <button
                onClick={handleNextImage}
                disabled={currentIndex >= allImages.length - 1}
                title="Image suivante"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: currentIndex >= allImages.length - 1 ? '#475569' : '#fff',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: currentIndex >= allImages.length - 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronRight size={15} />
              </button>
              <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            </>
          )}

          {imageUrl && (
            <>
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
                title="Pivoter de 90°"
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
                title="Réinitialiser zoom et rotation"
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
            </>
          )}
        </div>

        {/* Center: Filter selector */}
        {imageUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#34d399" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11.5px',
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
        )}

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {imageUrl && (
            <>
              <button
                onClick={setAsWallpaper}
                title="Définir en fond d'écran"
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

              {activeNode?.id && (
                <button
                  onClick={() => downloadNodeFile(activeNode.id)}
                  title="Télécharger l'image sur votre appareil"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--accent-color, #38bdf8)',
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
                title="Détails de l'image"
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
            </>
          )}
        </div>
      </div>

      {/* Main Image Stage or Empty State */}
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
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={activeNode?.name || 'Image'}
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
            {showInfo && activeNode && (
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
                <div style={{ fontWeight: 600, marginBottom: '6px', color: '#fff' }}>{activeNode.name}</div>
                <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div>Emplacement : {activeNode.parentId === 'desktop' ? 'Bureau' : 'Système de fichiers'}</div>
                  <div>Type : {(activeNode.name || '').split('.').pop()?.toUpperCase() || 'Image PNG'}</div>
                  <div>Filtre actif : {currentFilterObj?.name}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            color: '#94a3b8',
            textAlign: 'center',
            padding: '24px'
          }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
            }}>
              <ImageIcon size={34} color="#64748b" />
            </div>

            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                Aucune image sélectionnée
              </div>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', maxWidth: '340px', lineHeight: 1.5 }}>
                Créez une illustration avec FloraPaint ou ouvrez une image enregistrée depuis l'Explorateur.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => openApp('paint')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--accent-color, #38bdf8)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
                }}
              >
                <Paintbrush size={14} /> Dessiner dans FloraPaint
              </button>

              <button
                onClick={() => openApp('explorer')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <FolderOpen size={14} /> Ouvrir l'Explorateur
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
