import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'ou', 'Ctrl + Espace'], action: 'Ouvrir le Menu Démarrer' },
  { keys: ['Ctrl + E'], action: 'Ouvrir le Gestionnaire de Fichiers' },
  { keys: ['Ctrl + D'], action: 'Afficher le Bureau (réduire / restaurer)' },
  { keys: ['Ctrl + L'], action: 'Verrouiller la session instantanément' },
  { keys: ['Ctrl + T'], action: 'Ouvrir le Terminal FloraOS' },
  { keys: ['Ctrl + K'], action: 'Ouvrir le FloraStore' },
  { keys: ['Ctrl + ,'], action: 'Ouvrir les Paramètres du système' },
  { keys: ['Ctrl + Shift + N'], action: 'Créer un nouveau dossier sur le bureau' },
  { keys: ['Ctrl + W', 'ou', 'Alt + F4'], action: 'Fermer la fenêtre active' },
  { keys: ['Alt + Tab'], action: 'Basculer entre les fenêtres ouvertes' },
  { keys: ['Ctrl + /'], action: 'Afficher ce guide des raccourcis' },
  { keys: ['Échap'], action: 'Fermer les menus et fenêtres contextuelles' }
];

export const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="flora-modal-backdrop"
      onClick={onClose}
      style={{ zIndex: 10002 }}
    >
      <div
        className="flora-modal-card"
        style={{ maxWidth: '520px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--accent-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--accent-color)'
            }}>
              <Keyboard size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff' }}>
                Raccourcis Clavier FloraOS
              </h3>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '2px 0 0' }}>
                Commandes rapides avec la touche Contrôle
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '380px',
          overflowY: 'auto',
          paddingRight: '6px'
        }}>
          {SHORTCUTS.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)'
              }}
            >
              <span style={{ fontSize: '12.5px', color: '#e2e8f0' }}>{item.action}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {item.keys.map((k, ki) => (
                  k === 'ou' ? (
                    <span key={ki} style={{ fontSize: '10.5px', color: '#64748b' }}>ou</span>
                  ) : (
                    <kbd
                      key={ki}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        color: 'var(--accent-color)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      {k}
                    </kbd>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11.5px',
          color: '#94a3b8'
        }}>
          <span>Astuce : Appuyez sur <kbd style={{ color: 'var(--accent-color)', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: '4px' }}>Ctrl + /</kbd> à tout moment</span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'var(--accent-color)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
