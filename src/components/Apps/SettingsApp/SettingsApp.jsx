import React, { useState, useRef, useEffect } from 'react';
import {
  Image,
  Palette,
  User,
  Users,
  HardDrive,
  Info,
  Check,
  Upload,
  Lock,
  Moon,
  Sun,
  RotateCcw,
  Plus,
  Trash2,
  Shield,
  Grid,
  Volume2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Key,
  Bell,
  AlertTriangle,
  MousePointer,
  Cpu,
  Database,
  Download
} from 'lucide-react';
import { useOS } from '../../../context/OSContext';
import { WALLPAPERS, ACCENT_COLORS } from '../../../constants/wallpapers';
import { playSuccessSound, playWindowOpenSound, playWarningSound, playClickSound, playNotificationSound } from '../../../utils/audio';
import { getAssetPath } from '../../../utils/paths';

const AVATAR_OPTIONS = [
  { id: 'real_user', src: getAssetPath('/apps/user.png'), label: 'Flora' },
  { id: 'leaf', emoji: '🌿', label: 'Nature' },
  { id: 'flower', emoji: '🌸', label: 'Fleur' },
  { id: 'fox', emoji: '🦊', label: 'Renard' },
  { id: 'gem', emoji: '💎', label: 'Diamant' },
  { id: 'bolt', emoji: '⚡', label: 'Éclair' },
  { id: 'astro', emoji: '🚀', label: 'Espace' },
  { id: 'code', emoji: '💻', label: 'Dev' }
];

export const SettingsApp = () => {
  const {
    settings,
    setSettings,
    user,
    users,
    addUser,
    deleteUser,
    switchUser,
    fileSystem,
    emptyTrash,
    resetToFactory,
    reorganizeDesktopIcons,
    notify,
    CURRENT_FLORA_VERSION,
    FLORA_CODENAME,
    updateState,
    checkForUpdates,
    installSystemUpdate,
    simulateUpdateAvailable
  } = useOS();

  const [activeTab, setActiveTab] = useState('wallpapers');
  const [customUrl, setCustomUrl] = useState('');
  const wallpaperInputRef = useRef(null);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserHasPassword, setNewUserHasPassword] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Utilisateur');
  const [newUserAvatar, setNewUserAvatar] = useState('/apps/user.png');
  const [userError, setUserError] = useState('');

  // Count files & folders
  const allNodes = Object.values(fileSystem || {});
  const filesCount = allNodes.filter(n => n?.type === 'file').length;
  const foldersCount = allNodes.filter(n => n?.type === 'folder').length;

  // Real browser storage quota & host PC metrics
  const [storageMetrics, setStorageMetrics] = useState({
    quota: null,
    usage: null,
    isPersisted: false,
    ram: null,
    cores: null
  });

  const fetchStorageMetrics = async () => {
    let quota = null;
    let usage = null;
    let isPersisted = false;

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota || null;
        usage = estimate.usage || null;
      } catch {}
    }

    if (navigator.storage && navigator.storage.persisted) {
      try {
        isPersisted = await navigator.storage.persisted();
      } catch {}
    }

    const ram = navigator.deviceMemory || null;
    const cores = navigator.hardwareConcurrency || null;

    setStorageMetrics({ quota, usage, isPersisted, ram, cores });
  };

  useEffect(() => {
    fetchStorageMetrics();
  }, [fileSystem]);

  const handleRequestPersist = async () => {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const granted = await navigator.storage.persist();
        setStorageMetrics(prev => ({ ...prev, isPersisted: granted }));
        if (granted) {
          playSuccessSound();
          if (notify) notify('Stockage persistant', 'Protection permanente accordée par le navigateur.', 'check');
        } else {
          playClickSound();
        }
      } catch {}
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 octet';
    const k = 1024;
    const sizes = ['octets', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Apply Wallpaper
  const handleSelectWallpaper = (wp) => {
    setSettings(prev => ({ ...prev, wallpaper: wp }));
    playClickSound();
  };

  const handleApplyCustomUrl = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    const newWp = {
      id: `custom_${Date.now()}`,
      name: 'Image Web Personnalisée',
      url: customUrl.trim()
    };
    setSettings(prev => ({ ...prev, wallpaper: newWp }));
    setCustomUrl('');
    playSuccessSound();
  };

  const handleUploadWallpaper = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newWp = {
          id: `upload_${Date.now()}`,
          name: file.name,
          url: event.target.result
        };
        setSettings(prev => ({ ...prev, wallpaper: newWp }));
        playSuccessSound();
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply Accent Color
  const handleSelectAccent = (colorObj) => {
    setSettings(prev => ({ ...prev, accentColor: colorObj }));
    document.documentElement.style.setProperty('--accent-color', colorObj.value);
    document.documentElement.style.setProperty('--accent-hover', colorObj.hover);
    document.documentElement.style.setProperty('--accent-glow', colorObj.glow);
    playClickSound();
  };

  // Handle Add User
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      playWarningSound();
      setUserError('Veuillez saisir un nom pour l\'utilisateur.');
      return;
    }
    if (newUserHasPassword && newUserPassword.trim().length < 4) {
      playWarningSound();
      setUserError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    const success = addUser({
      name: newUserName.trim(),
      hasPassword: newUserHasPassword,
      pin: newUserHasPassword ? newUserPassword.trim() : '',
      role: newUserRole,
      avatar: newUserAvatar
    });

    if (success) {
      setNewUserName('');
      setNewUserPassword('');
      setNewUserHasPassword(false);
      setUserError('');
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden'
    }}>
      {/* Settings Navigation Sidebar */}
      <div style={{
        width: '240px',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(10, 15, 24, 0.85)',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flexShrink: 0
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '6px 10px 10px'
        }}>
          Paramètres
        </div>

        <button
          onClick={() => setActiveTab('wallpapers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: activeTab === 'wallpapers' ? 600 : 400,
            background: activeTab === 'wallpapers' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'wallpapers' ? '#fff' : '#cbd5e1',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease'
          }}
        >
          <Image size={16} /> Fonds & Bureau
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: activeTab === 'appearance' ? 600 : 400,
            background: activeTab === 'appearance' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'appearance' ? '#fff' : '#cbd5e1',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease'
          }}
        >
          <Palette size={16} /> Apparence
        </button>

        <button
          onClick={() => setActiveTab('sound')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: activeTab === 'sound' ? 600 : 400,
            background: activeTab === 'sound' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'sound' ? '#fff' : '#cbd5e1',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease'
          }}
        >
          <Volume2 size={16} /> Sons & Effets
        </button>

        <button
          onClick={() => setActiveTab('users')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: activeTab === 'users' ? 600 : 400,
            background: activeTab === 'users' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'users' ? '#fff' : '#cbd5e1',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease'
          }}
        >
          <Users size={16} /> Utilisateurs ({users.length}/5)
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: activeTab === 'storage' ? 600 : 400,
            background: activeTab === 'storage' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'storage' ? '#fff' : '#cbd5e1',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease'
          }}
        >
          <HardDrive size={16} /> Stockage & Système
        </button>

        <button
          onClick={() => setActiveTab('updates')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: activeTab === 'updates' ? 600 : 400,
            background: activeTab === 'updates' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'updates' ? '#fff' : '#cbd5e1',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease',
            position: 'relative'
          }}
        >
          <RefreshCw size={16} className={updateState.isChecking ? 'animate-spin' : ''} />
          <span>Mises à jour</span>
          {updateState.hasUpdate && (
            <span style={{
              marginLeft: 'auto',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f59e0b',
              boxShadow: '0 0 8px #f59e0b'
            }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('about')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: activeTab === 'about' ? 600 : 400,
            background: activeTab === 'about' ? 'var(--accent-color)' : 'transparent',
            color: activeTab === 'about' ? '#fff' : '#cbd5e1',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.12s ease'
          }}
        >
          <Info size={16} /> À propos
        </button>
      </div>

      {/* Main Settings Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 30px' }}>
        
        {/* 1. WALLPAPERS & DESKTOP GRID TAB */}
        {activeTab === 'wallpapers' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
              Fonds d'écran & Bureau
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '22px' }}>
              Personnalisez l'arrière-plan et le comportement d'affichage de la grille du bureau.
            </p>

            {/* Current Wallpaper Preview Banner */}
            <div style={{
              height: '140px',
              borderRadius: '14px',
              backgroundImage: `url(${settings.wallpaper?.url || '/wallpapers/floraos_default.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative',
              marginBottom: '24px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, textTransform: 'uppercase' }}>
                    Fond d'écran actuel
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                    {settings.wallpaper?.name || 'FloraOS Par Défaut'}
                  </div>
                </div>
              </div>
            </div>

            {/* Wallpapers Gallery */}
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Galerie officielle FloraOS</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '12px',
              marginBottom: '26px'
            }}>
              {WALLPAPERS.map(wp => {
                const isSelected = settings.wallpaper?.id === wp.id || settings.wallpaper?.url === wp.url;
                return (
                  <div
                    key={wp.id}
                    onClick={() => handleSelectWallpaper(wp)}
                    style={{
                      height: '84px',
                      borderRadius: '10px',
                      backgroundImage: `url(${wp.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: isSelected ? '2px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.12)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'transform 0.15s ease, border-color 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px var(--accent-color)' : 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'var(--accent-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={12} color="#fff" />
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '4px 6px',
                      background: 'rgba(0,0,0,0.65)',
                      fontSize: '10.5px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {wp.name}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Wallpaper Upload & URL */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              marginBottom: '26px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Importer une image</div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '12px' }}>
                  Depuis votre ordinateur local
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={wallpaperInputRef}
                  onChange={handleUploadWallpaper}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="flora-btn flora-btn-secondary"
                  onClick={() => wallpaperInputRef.current?.click()}
                  style={{ width: '100%', height: '34px' }}
                >
                  <Upload size={14} /> Choisir un fichier
                </button>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Image depuis une URL</div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '12px' }}>
                  Lien direct vers une photo en ligne
                </div>
                <form onSubmit={handleApplyCustomUrl} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    className="flora-btn flora-btn-primary"
                    style={{ minWidth: '70px', height: '32px' }}
                  >
                    OK
                  </button>
                </form>
              </div>
            </div>

            {/* Desktop Grid System Settings (NEW!) */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Grid size={18} color="var(--accent-color)" />
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Disposition de la grille du bureau</h3>
              </div>

              {/* Snap to grid switch */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Aligner les icônes sur la grille</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Aimante automatiquement les icônes sur des coordonnées nettes</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({ ...prev, snapToGrid: prev.snapToGrid === false ? true : false }));
                    playClickSound();
                  }}
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '14px',
                    background: settings.snapToGrid !== false ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: settings.snapToGrid !== false ? '25px' : '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }} />
                </button>
              </div>

              {/* Icon sizes */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Taille des icônes du bureau</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Ajustez l'échelle des éléments visibles</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { key: 'small', label: 'Petites (34px)' },
                    { key: 'medium', label: 'Moyennes (42px)' },
                    { key: 'large', label: 'Grandes (52px)' }
                  ].map(sz => (
                    <button
                      key={sz.key}
                      type="button"
                      onClick={() => {
                        setSettings(prev => ({ ...prev, iconSize: sz.key }));
                        playClickSound();
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: (settings.iconSize || 'medium') === sz.key ? '1px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: (settings.iconSize || 'medium') === sz.key ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.06)',
                        color: '#fff',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reorganize Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Réorganiser les icônes</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Rassemble et réaligne toutes les icônes du bureau en colonnes</div>
                </div>
                <button
                  type="button"
                  className="flora-btn flora-btn-secondary"
                  onClick={() => reorganizeDesktopIcons()}
                  style={{ height: '34px' }}
                >
                  <RefreshCw size={14} /> Réorganiser maintenant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. APPEARANCE & THEME TAB */}
        {activeTab === 'appearance' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
              Apparence & Thème
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '22px' }}>
              Personnalisez l'atmosphère visuelle, les couleurs et les effets de verre de FloraOS.
            </p>

            {/* Dark / Light Mode Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '18px',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Mode du système</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div
                  onClick={() => {
                    setSettings(prev => ({ ...prev, theme: 'dark' }));
                    playClickSound();
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: settings.theme === 'dark' ? '2px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: settings.theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <Moon size={20} color="#38bdf8" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Mode Sombre</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Recommandé pour FloraOS</div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSettings(prev => ({ ...prev, theme: 'light' }));
                    playClickSound();
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: settings.theme === 'light' ? '2px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: settings.theme === 'light' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <Sun size={20} color="#f59e0b" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Mode Clair</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Style lumineux épuré</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accent Colors Palette */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '18px',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Couleur d'accentuation</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                Teinte globale appliquée aux boutons, fenêtres et indicateurs.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {ACCENT_COLORS.map(c => {
                  const isSelected = settings.accentColor?.name === c.name || settings.accentColor?.value === c.value;
                  return (
                    <div
                      key={c.name}
                      onClick={() => handleSelectAccent(c)}
                      title={c.name}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: c.value,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isSelected ? '3px solid #fff' : '2px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: isSelected ? `0 0 14px ${c.glow}` : 'none',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {isSelected && <Check size={16} color="#fff" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Glass Intensity Slider */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Flou acrylique du verre (Backdrop Filter)</h3>
                <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600 }}>{settings.glassBlur}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="36"
                value={settings.glassBlur}
                onChange={(e) => setSettings(prev => ({ ...prev, glassBlur: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* 3. SOUND & EFFECTS TAB */}
        {activeTab === 'sound' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
              Sons & Effets
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '22px' }}>
              Gérez les alertes auditives, carillons et retours sonores du système.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              {/* Volume Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Volume principal des effets</span>
                  <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>{settings.soundVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.soundVolume}
                  onChange={(e) => setSettings(prev => ({ ...prev, soundVolume: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                />
              </div>

              {/* Sound Effects Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Effets sonores des fenêtres et onglets</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Joue un micro-carillon discret à l'ouverture</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({ ...prev, soundEffectsEnabled: prev.soundEffectsEnabled === false ? true : false }));
                    playClickSound();
                  }}
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '14px',
                    background: settings.soundEffectsEnabled !== false ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: settings.soundEffectsEnabled !== false ? '25px' : '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s ease'
                  }} />
                </button>
              </div>

              {/* Test audio sound profiles */}
              <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                  Tester les effets sonores du système :
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    className="flora-btn flora-btn-secondary"
                    onClick={() => playClickSound((settings.soundVolume || 80) / 100)}
                    style={{ height: '32px', fontSize: '12px' }}
                    title="Son d'action ordinaire (clic rapide, menu, bascule)"
                  >
                    <MousePointer size={13} color="#94a3b8" /> Clic d'action
                  </button>

                  <button
                    type="button"
                    className="flora-btn flora-btn-secondary"
                    onClick={() => playNotificationSound((settings.soundVolume || 80) / 100)}
                    style={{ height: '32px', fontSize: '12px' }}
                    title="Son de notification (carillon cristallin ascendant)"
                  >
                    <Bell size={13} color="#38bdf8" /> Notification
                  </button>

                  <button
                    type="button"
                    className="flora-btn flora-btn-secondary"
                    onClick={() => playWarningSound((settings.soundVolume || 80) / 100)}
                    style={{ height: '32px', fontSize: '12px' }}
                    title="Son d'erreur / avertissement (accord grave et percutant)"
                  >
                    <AlertTriangle size={13} color="#f87171" /> Erreur / Alerte
                  </button>

                  <button
                    type="button"
                    className="flora-btn flora-btn-secondary"
                    onClick={() => playWindowOpenSound((settings.soundVolume || 80) / 100)}
                    style={{ height: '32px', fontSize: '12px' }}
                    title="Son d'ouverture d'onglet ou fenêtre"
                  >
                    <Volume2 size={13} color="#34d399" /> Ouverture fenêtre
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. USER PROFILES & SECURITY TAB */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', margin: 0 }}>
                Comptes & Utilisateurs
              </h2>
              <span style={{
                background: users.length >= 5 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                color: users.length >= 5 ? '#f87171' : '#34d399',
                border: users.length >= 5 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {users.length} / 5 utilisateurs
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '22px' }}>
              Chaque utilisateur dispose d'un bureau, de documents et de préférences isolés.
            </p>

            {/* Existing Users List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '26px' }}>
              {users.map(u => {
                const isActive = u.id === user.id;
                return (
                  <div
                    key={u.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: isActive ? '1px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        overflow: 'hidden'
                      }}>
                        {u.avatar?.startsWith('/') ? (
                          <img src={u.avatar} alt="avatar" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                        ) : (
                          u.avatar || '🌿'
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{u.role || 'Utilisateur'}</span>
                          <span>•</span>
                          <span style={{ color: u.hasPassword || u.pin ? '#38bdf8' : '#34d399' }}>
                            {u.hasPassword || u.pin ? 'Protégé par mot de passe' : 'Sans mot de passe'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isActive ? (
                        <span style={{
                          fontSize: '11.5px',
                          color: '#34d399',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.12)'
                        }}>
                          Session active
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="flora-btn flora-btn-secondary"
                          onClick={() => switchUser(u.id)}
                          style={{ minWidth: '80px', height: '32px', fontSize: '12px' }}
                        >
                          Basculer
                        </button>
                      )}

                      {!isActive && users.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Supprimer définitivement l'utilisateur « ${u.name} » et son espace de fichiers ?`)) {
                              deleteUser(u.id);
                            }
                          }}
                          title="Supprimer cet utilisateur"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '6px'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create New User Section */}
            {users.length >= 5 ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <img src={getAssetPath('/apps/warning.png')} alt="Warning" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fca5a5' }}>
                    Limite de 5 utilisateurs atteinte
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
                    Supprimez l'un des profils existants pour en créer un nouveau.
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '18px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Plus size={16} color="var(--accent-color)" /> Créer un nouvel utilisateur
                </h3>

                {/* Avatar selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', fontWeight: 500 }}>
                    Choisir un avatar
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {AVATAR_OPTIONS.map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setNewUserAvatar(opt.src || opt.emoji)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: (newUserAvatar === opt.src || newUserAvatar === opt.emoji) ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.src ? (
                          <img src={getAssetPath(opt.src)} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                        ) : (
                          opt.emoji
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Name & Role */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Sophie"
                      value={newUserName}
                      onChange={(e) => {
                        setNewUserName(e.target.value);
                        if (userError) setUserError('');
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(0,0,0,0.35)',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                      Rôle du compte
                    </label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(15, 23, 42, 0.95)',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="Utilisateur">Utilisateur Standard</option>
                      <option value="Administrateur">Administrateur</option>
                    </select>
                  </div>
                </div>

                {/* Password / No Password Choice (NEW!) */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', fontWeight: 500 }}>
                    Mode de protection
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div
                      onClick={() => {
                        setNewUserHasPassword(false);
                        setNewUserPassword('');
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: !newUserHasPassword ? '2px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: !newUserHasPassword ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.25)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: !newUserHasPassword ? '5px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.4)',
                        background: '#fff'
                      }} />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Sans mot de passe</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Connexion directe en 1 clic</div>
                      </div>
                    </div>

                    <div
                      onClick={() => setNewUserHasPassword(true)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: newUserHasPassword ? '2px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: newUserHasPassword ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.25)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: newUserHasPassword ? '5px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.4)',
                        background: '#fff'
                      }} />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Avec mot de passe</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Code PIN ou mot de passe</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password field if required */}
                {newUserHasPassword && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                      Définir le mot de passe / code PIN
                    </label>
                    <input
                      type="password"
                      placeholder="Ex: 1234 ou mot de passe"
                      value={newUserPassword}
                      onChange={(e) => {
                        setNewUserPassword(e.target.value);
                        if (userError) setUserError('');
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(0,0,0,0.35)',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}

                {userError && (
                  <div style={{ color: '#f87171', fontSize: '12px' }}>{userError}</div>
                )}

                <button
                  type="submit"
                  className="flora-btn flora-btn-primary"
                  style={{ alignSelf: 'flex-start', minWidth: '130px', height: '36px' }}
                >
                  <Plus size={15} /> Créer l'utilisateur
                </button>
              </form>
            )}
          </div>
        )}

        {/* 5. STORAGE & SYSTEM RESET TAB */}
        {activeTab === 'storage' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
              Stockage & Système
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '22px' }}>
              Gérez votre système de fichiers virtuel et vos données locales.
            </p>

            {/* Real Storage Quota & Capacity */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '22px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <HardDrive size={20} color="#38bdf8" />
                  <div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 600, margin: 0 }}>Espace Disque Alloué par le Navigateur</h3>
                    <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '2px 0 0' }}>
                      Capacité réelle attribuée à FloraOS par le moteur du navigateur et le système d'exploitation hôte
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                    {storageMetrics.quota ? formatBytes(storageMetrics.quota) : 'Quota Dynamique'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#34d399' }}>
                    {storageMetrics.quota && storageMetrics.usage
                      ? `${formatBytes(storageMetrics.quota - storageMetrics.usage)} disponibles`
                      : 'Espace disponible'}
                  </div>
                </div>
              </div>

              {/* Real usage progress bar */}
              {storageMetrics.quota && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px', color: '#cbd5e1' }}>
                    <span>Utilisé : <strong style={{ color: '#38bdf8' }}>{formatBytes(storageMetrics.usage || 0)}</strong></span>
                    <span>{((storageMetrics.usage || 0) / storageMetrics.quota * 100).toFixed(2)} %</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(1, Math.min(100, ((storageMetrics.usage || 0) / storageMetrics.quota * 100)))}%`,
                      background: 'linear-gradient(90deg, #38bdf8, #10b981)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}

              {/* Hardware & Files Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center', marginTop: '6px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>{filesCount}</div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Fichiers système & user</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>{foldersCount}</div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Dossiers VFS</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#a855f7' }}>
                    {storageMetrics.ram ? `${storageMetrics.ram} GB` : 'Standard'}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>RAM détectée PC</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>
                    {storageMetrics.cores ? `${storageMetrics.cores} Cœurs` : 'Multi-thread'}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>CPU Hôte</div>
                </div>
              </div>

              {/* Persistence Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={15} color={storageMetrics.isPersisted ? '#34d399' : '#f59e0b'} />
                  <span>
                    Protection du stockage : <strong style={{ color: storageMetrics.isPersisted ? '#34d399' : '#e2e8f0' }}>
                      {storageMetrics.isPersisted ? 'Persistant (Immunisé contre le nettoyage automatique du navigateur)' : 'Géré par quota dynamique'}
                    </strong>
                  </span>
                </div>

                {!storageMetrics.isPersisted && (
                  <button
                    type="button"
                    className="flora-btn flora-btn-secondary"
                    onClick={handleRequestPersist}
                    style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
                  >
                    Activer la persistance
                  </button>
                )}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Vider la corbeille</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Supprime définitivement tous les fichiers au rebut</div>
                </div>
                <button
                  type="button"
                  onClick={emptyTrash}
                  className="flora-btn flora-btn-secondary"
                  style={{ height: '34px', color: '#f87171' }}
                >
                  <Trash2 size={14} /> Purger la corbeille
                </button>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f87171' }}>Réinitialisation d'usine</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Efface tous les profils, fichiers et relance l'assistant d'installation</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Voulez-vous réinitialiser FloraOS ? Tous les fichiers créés et utilisateurs seront supprimés.')) {
                      resetToFactory();
                    }
                  }}
                  className="flora-btn"
                  style={{
                    height: '34px',
                    background: '#ef4444',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <RotateCcw size={14} /> Réinitialiser le système
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. UPDATES TAB */}
        {activeTab === 'updates' && (
          <div style={{ maxWidth: '640px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#f8fafc' }}>
                Mises à jour du système (FloraUpdate)
              </h2>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
                Gérez les mises à niveau du système, la vérification automatique et la synchronisation avec GitHub Releases.
              </p>
            </div>

            {/* Status Card */}
            <div style={{
              background: updateState.hasUpdate ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.04)',
              border: updateState.hasUpdate ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: updateState.hasUpdate ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: updateState.hasUpdate ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {updateState.isChecking ? (
                    <RefreshCw size={22} color="#38bdf8" className="animate-spin" />
                  ) : updateState.hasUpdate ? (
                    <Download size={24} color="#f59e0b" />
                  ) : (
                    <CheckCircle2 size={24} color="#10b981" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: updateState.hasUpdate ? '#fbbf24' : '#f8fafc',
                    marginBottom: '2px'
                  }}>
                    {updateState.isChecking 
                      ? 'Recherche de mises à jour...' 
                      : updateState.hasUpdate 
                        ? `Nouvelle version disponible : FloraOS v${updateState.latestVersion}` 
                        : 'Votre système est à jour'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {updateState.hasUpdate 
                      ? `${updateState.releaseName || 'FloraOS Update'} • Publié le ${updateState.releaseDate || 'récemment'}`
                      : `Version actuelle : FloraOS v${CURRENT_FLORA_VERSION || '1.2.0'} (${FLORA_CODENAME || 'Evergreen Edition'})`}
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={() => {
                    if (updateState.hasUpdate) {
                      installSystemUpdate();
                    } else {
                      checkForUpdates(true);
                    }
                  }}
                  disabled={updateState.isChecking}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '9px',
                    border: 'none',
                    background: updateState.hasUpdate ? '#f59e0b' : 'var(--accent-color, #10b981)',
                    color: '#fff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: updateState.isChecking ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: updateState.hasUpdate ? '0 4px 14px rgba(245, 158, 11, 0.3)' : '0 4px 14px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <RefreshCw size={13} className={updateState.isChecking ? 'animate-spin' : ''} />
                  <span>
                    {updateState.isChecking 
                      ? 'Vérification...' 
                      : updateState.hasUpdate 
                        ? 'Mettre à niveau' 
                        : 'Rechercher'}
                  </span>
                </button>
              </div>

              {/* Release Notes / Changelog when update is available */}
              {updateState.hasUpdate && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginTop: '4px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>
                    Nouveautés de cette version :
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
                    {updateState.changelog && updateState.changelog.length > 0 ? (
                      updateState.changelog.map((item, idx) => (
                        <li key={idx}>{item.replace(/^-\s*/, '')}</li>
                      ))
                    ) : (
                      <li>Optimisations de performance et correctifs de stabilité.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Timestamp info */}
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  Dernière recherche : {updateState.lastChecked ? new Date(updateState.lastChecked).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Au démarrage'}
                </span>
                <span>Source : {updateState.source === 'github' ? 'GitHub Releases' : 'Dépôt du site (version.json)'}</span>
              </div>
            </div>

            {/* Configuration Parameters */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
                Paramètres de mise à jour
              </div>

              {/* Auto-check Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f1f5f9' }}>
                    Recherche automatique en arrière-plan
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Vérifie automatiquement les nouvelles versions au démarrage et toutes les heures.
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                  <input
                    type="checkbox"
                    checked={settings.autoUpdateCheck !== false}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoUpdateCheck: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    inset: 0,
                    background: settings.autoUpdateCheck !== false ? 'var(--accent-color, #10b981)' : '#334155',
                    borderRadius: '22px',
                    transition: '0.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '16px',
                      width: '16px',
                      left: settings.autoUpdateCheck !== false ? '19px' : '3px',
                      bottom: '3px',
                      background: '#fff',
                      borderRadius: '50%',
                      transition: '0.2s'
                    }} />
                  </span>
                </label>
              </div>

              {/* GitHub Repository Link */}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>
                  Dépôt GitHub Releases (optionnel)
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '8px' }}>
                  Indiquez votre dépôt (ex: <code>pseudo/FloraOS</code>). FloraOS vérifiera directement les Releases publiques sur GitHub !
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={settings.githubRepo || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, githubRepo: e.target.value }))}
                    placeholder="ex: funtubedu42/FloraOS"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: 'rgba(0, 0, 0, 0.25)',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => {
                      notify('Paramètres', 'Dépôt GitHub enregistré pour les mises à jour.', 'Check');
                      checkForUpdates(true);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      fontSize: '11.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Tester
                  </button>
                </div>
              </div>

              {/* Demonstration Simulation Button */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                    Tester l'expérience de mise à jour (Simulation)
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Déclenche l'alerte toast et affiche les notes de version de FloraOS v1.3.0.
                  </div>
                </div>
                <button
                  onClick={simulateUpdateAvailable}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Simuler v1.3.0
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. ABOUT TAB */}
        {activeTab === 'about' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              margin: '0 auto 16px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img
                src={getAssetPath('/apps/os_icon.png')}
                alt="FloraOS"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
                }}
                style={{ width: '56px', height: '56px', objectFit: 'contain' }}
              />
              <span style={{ display: 'none', fontSize: '36px' }}>🌿</span>
            </div>

            <h1 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '4px' }}>
              FloraOS Web
            </h1>
            <p style={{ fontSize: '13px', color: '#34d399', fontWeight: 600, marginBottom: '14px' }}>
              Version {CURRENT_FLORA_VERSION || '1.2.0'} ({FLORA_CODENAME || 'Evergreen Edition'})
            </p>

            <button
              onClick={() => setActiveTab('updates')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '24px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
            >
              <RefreshCw size={13} className={updateState.isChecking ? 'animate-spin' : ''} />
              <span>Rechercher des mises à jour système</span>
            </button>

            <div style={{
              maxWidth: '460px',
              margin: '0 auto',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
              fontSize: '12px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Moteur d'exécution :</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>React 19 & WebAssembly</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Gestion multi-utilisateurs :</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>Jusqu'à 5 profils locaux</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Canal de mise à jour :</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>FloraUpdate Evergreen Stable</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Système de fichiers :</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>FloraCore VFS Persistant</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsApp;
