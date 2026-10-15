import React, { useState } from 'react';
import { useOS } from '../../../context/OSContext';
import {
  Search,
  DownloadCloud,
  Check,
  Star,
  Sparkles,
  Music,
  CloudSun,
  Palette,
  Gamepad2,
  FileCode,
  ShieldCheck,
  Trash2
} from 'lucide-react';

const STORE_CATALOG = [
  {
    id: 'flora_music',
    name: 'Flora Music',
    category: 'Multimédia',
    icon: Music,
    color: '#ec4899',
    rating: 4.9,
    size: '4.2 MB',
    description: 'Lecteur audio avec ambiances lo-fi, sons de pluie et musique relaxante pour travailler.'
  },
  {
    id: 'flora_weather',
    name: 'Flora Météo',
    category: 'Outils',
    icon: CloudSun,
    color: '#0ea5e9',
    rating: 4.8,
    size: '1.8 MB',
    description: 'Prévisions météo mondiales en direct avec animations de ciel et températures ressenties.'
  },
  {
    id: 'studio_pixel',
    name: 'Studio Pixel',
    category: 'Créativité',
    icon: Palette,
    color: '#8b5cf6',
    rating: 4.7,
    size: '6.5 MB',
    description: 'Logiciel de dessin, retouche photo et création graphique avec calques et pinceaux.'
  },
  {
    id: 'flora_arcade',
    name: 'Flora Arcade 2048',
    category: 'Jeux',
    icon: Gamepad2,
    color: '#f59e0b',
    rating: 4.9,
    size: '850 KB',
    description: 'Mini-jeux de réflexion et de détente intégrés directement dans FloraOS.'
  },
  {
    id: 'markdown_pro',
    name: 'Markdown Pro',
    category: 'Productivité',
    icon: FileCode,
    color: '#10b981',
    rating: 4.9,
    size: '3.1 MB',
    description: 'Éditeur de documentation avancé avec rendu en direct, tableaux et export PDF.'
  },
  {
    id: 'flora_guard',
    name: 'Flora Guard',
    category: 'Sécurité',
    icon: ShieldCheck,
    color: '#3b82f6',
    rating: 5.0,
    size: '2.4 MB',
    description: 'Chiffrement renforcé de vos fichiers locaux et surveillance de la session active.'
  }
];

export const FloraStore = () => {
  const { installedStoreApps, setInstalledStoreApps, notify } = useOS();
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const [searchQuery, setSearchQuery] = useState('');
  const [installingId, setInstallingId] = useState(null);

  const categories = ['Tout', 'Multimédia', 'Outils', 'Créativité', 'Jeux', 'Productivité', 'Sécurité'];

  const filteredApps = STORE_CATALOG.filter(app => {
    const matchesCat = selectedCategory === 'Tout' || app.category === selectedCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleInstall = (app) => {
    setInstallingId(app.id);
    setTimeout(() => {
      setInstalledStoreApps(prev => [...prev, app]);
      setInstallingId(null);
      notify('Installation réussie', `"${app.name}" a été ajouté à vos applications !`, 'DownloadCloud');
    }, 900);
  };

  const handleUninstall = (appId) => {
    setInstalledStoreApps(prev => prev.filter(a => a.id !== appId));
    notify('Désinstallation', 'L\'application a été retirée de votre FloraOS.', 'Trash2');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0b1120', color: '#f8fafc' }}>
      {/* Store Header Banner */}
      <div style={{
        padding: '24px 30px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/apps/store.png" alt="FloraStore" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)', margin: 0 }}>
              FloraStore
            </h1>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '3px 0 0' }}>
              Découvrez et ajoutez de nouvelles applications et extensions à votre bureau
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '240px' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Rechercher une application..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 32px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(0, 0, 0, 0.3)',
              color: '#fff',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Category Pills Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 30px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(15, 23, 42, 0.5)'
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: selectedCategory === cat ? 600 : 400,
              background: selectedCategory === cat ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.06)',
              color: selectedCategory === cat ? '#fff' : '#cbd5e1',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 30px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '18px'
        }}>
          {filteredApps.map(app => {
            const IconComp = app.icon;
            const isInstalled = installedStoreApps.some(a => a.id === app.id);
            const isBusy = installingId === app.id;

            return (
              <div
                key={app.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${app.color}25, ${app.color}45)`,
                      border: `1px solid ${app.color}60`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComp size={24} color={app.color} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14.5px', fontWeight: 600, margin: 0, color: '#fff' }}>
                        {app.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{app.category}</span>
                        <span style={{ color: '#64748b' }}>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: '#f59e0b' }}>
                          <Star size={11} fill="#f59e0b" /> {app.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.45, margin: 0 }}>
                    {app.description}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{app.size}</span>

                  {isInstalled ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        <Check size={12} /> Installé
                      </span>
                      <button
                        onClick={() => handleUninstall(app.id)}
                        title="Désinstaller"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          borderRadius: '8px',
                          padding: '5px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInstall(app)}
                      disabled={isBusy}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--accent-color)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: isBusy ? 'wait' : 'pointer'
                      }}
                    >
                      {isBusy ? 'Installation...' : (
                        <>
                          <DownloadCloud size={13} /> Obtenir
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
