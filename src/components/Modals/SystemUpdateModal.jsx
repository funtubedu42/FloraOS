import React from 'react';
import { useOS } from '../../context/OSContext';
import { getAssetPath } from '../../utils/paths';
import { RefreshCw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export const SystemUpdateModal = () => {
  const { updateModal, updateState } = useOS();

  if (!updateModal?.isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.99))',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      userSelect: 'none',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '36px 30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle glow highlight */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '240px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Animated OS Icon */}
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '22px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          position: 'relative'
        }}>
          <img
            src={getAssetPath('/apps/os_icon.png')}
            alt="FloraOS"
            style={{ width: '56px', height: '56px', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
            }}
          />
          <span style={{ display: 'none', fontSize: '36px' }}>🌿</span>

          {/* Mini revolving badge */}
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'var(--accent-color, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
          }}>
            {updateModal.isComplete ? (
              <CheckCircle2 size={15} color="#fff" />
            ) : (
              <RefreshCw size={13} color="#fff" className="animate-spin" />
            )}
          </div>
        </div>

        {/* Title & Target Version */}
        <h2 style={{
          fontSize: '22px',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
          marginBottom: '6px',
          color: '#f8fafc'
        }}>
          {updateModal.isComplete ? 'Installation terminée' : 'Mise à niveau de FloraOS'}
        </h2>
        <div style={{
          fontSize: '13px',
          color: 'var(--accent-color, #34d399)',
          fontWeight: 600,
          marginBottom: '26px'
        }}>
          FloraOS v{updateState.latestVersion || '1.3.0'} • Evergreen
        </div>

        {/* Progress Bar Container */}
        <div style={{ width: '100%', marginBottom: '14px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            marginBottom: '8px',
            color: '#94a3b8'
          }}>
            <span>Progression globale</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{updateModal.progress}%</span>
          </div>

          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              height: '100%',
              width: `${updateModal.progress}%`,
              background: 'linear-gradient(90deg, #10b981, #06b6d4)',
              borderRadius: '999px',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.6)'
            }} />
          </div>
        </div>

        {/* Current status description */}
        <p style={{
          fontSize: '12.5px',
          color: '#cbd5e1',
          minHeight: '20px',
          margin: '0 0 20px 0',
          lineHeight: 1.4
        }}>
          {updateModal.statusText || 'Vérification des composants...'}
        </p>

        {/* Security badge footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#64748b',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '6px 12px',
          borderRadius: '999px'
        }}>
          <ShieldCheck size={13} color="#10b981" />
          <span>Intégrité VFS protégée • Redémarrage automatique</span>
        </div>
      </div>
    </div>
  );
};

export default SystemUpdateModal;
