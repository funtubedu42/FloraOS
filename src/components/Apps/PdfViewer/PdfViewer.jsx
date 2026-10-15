import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileText,
  Printer,
  Maximize2
} from 'lucide-react';
import { useOS } from '../../../context/OSContext';

export const PdfViewer = ({ windowData }) => {
  const { downloadNodeFile } = useOS();
  const file = windowData.fileContext;
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const pages = file?.pdfPages || [
    {
      pageNumber: 1,
      title: file?.name || 'Document PDF',
      subtitle: 'Aperçu du document FloraOS',
      sections: [
        {
          heading: 'Contenu du Document',
          text: 'Ce document PDF a été ouvert avec le lecteur natif FloraOS. Vous pouvez utiliser les boutons de la barre d\'outils pour zoomer, faire pivoter les pages, ou télécharger le document.'
        }
      ]
    }
  ];

  const totalPages = pages.length;

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 15, 180));
  const handleZoomOut = () => setZoom(z => Math.max(z - 15, 60));
  const handleRotate = () => setRotation(r => (r + 90) % 360);

  const activePageData = pages[currentPage - 1] || pages[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e293b', color: '#fff' }}>
      {/* PDF Toolbar */}
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
        {/* Left: Page navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: currentPage <= 1 ? '#64748b' : '#fff',
              padding: '6px',
              borderRadius: '6px',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontWeight: 500 }}>
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: currentPage >= totalPages ? '#64748b' : '#fff',
              padding: '6px',
              borderRadius: '6px',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Center: Zoom & Rotate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleZoomOut}
            title="Zoom arrière"
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
          >
            <ZoomOut size={15} />
          </button>
          <span style={{ minWidth: '45px', textAlign: 'center', fontWeight: 600 }}>{zoom}%</span>
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
            title="Pivoter à 90°"
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
          >
            <RotateCw size={15} />
          </button>
        </div>

        {/* Right: Download & print */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <Download size={13} /> Télécharger
            </button>
          )}
        </div>
      </div>

      {/* PDF Document Canvas / Preview */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px',
        background: '#0f172a'
      }}>
        {/* If user uploaded real PDF with real data url */}
        {file?.url && file.url.startsWith('data:application/pdf') ? (
          <iframe
            src={file.url}
            title={file.name}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
              background: '#fff'
            }}
          />
        ) : (
          /* Rendered beautiful PDF Document page */
          <div
            style={{
              width: `${560 * (zoom / 100)}px`,
              minHeight: `${780 * (zoom / 100)}px`,
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '4px',
              boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
              padding: '48px',
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease, width 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-sans)',
              boxSizing: 'border-box'
            }}
          >
            {/* Header of PDF Page */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2px solid #10b981',
                paddingBottom: '16px',
                marginBottom: '28px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#10b981', fontWeight: 700 }}>
                    FloraOS Documentation Officielle
                  </div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#0f172a', marginTop: '4px' }}>
                    {activePageData.title}
                  </h1>
                </div>
                <div style={{ fontSize: '28px' }}>🌿</div>
              </div>

              {activePageData.subtitle && (
                <p style={{ fontSize: '14px', color: '#475569', fontStyle: 'italic', marginBottom: '24px' }}>
                  {activePageData.subtitle}
                </p>
              )}

              {/* Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {activePageData.sections?.map((sec, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                      {sec.heading}
                    </h3>
                    <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-line' }}>
                      {sec.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer of PDF Page */}
            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '16px',
              marginTop: '40px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: '#94a3b8'
            }}>
              <span>FloraOS Web Engine • Sécurisé & Haute Performance</span>
              <span style={{ fontWeight: 600 }}>Page {currentPage} / {totalPages}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
