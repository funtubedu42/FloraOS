import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { ACCENT_COLORS, WALLPAPERS } from '../../constants/wallpapers';
import { 
  ArrowRight, 
  ArrowLeft,
  Check, 
  Sparkles, 
  Moon, 
  Sun, 
  Shield, 
  Zap, 
  Palette, 
  Lock, 
  User, 
  Terminal as TerminalIcon,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Globe,
  Keyboard,
  KeyRound,
  Unlock
} from 'lucide-react';
import { playStartupSound, playClickSound, playWarningSound, playSuccessSound } from '../../utils/audio';
import { getAssetPath } from '../../utils/paths';

const AVATAR_OPTIONS = [
  { id: 'real_user', src: getAssetPath('/apps/user.png'), label: 'Flora' },
  { id: 'emoji_leaf', emoji: '🌿', label: 'Feuille' },
  { id: 'emoji_fox', emoji: '🦊', label: 'Renard' },
  { id: 'emoji_gem', emoji: '💎', label: 'Diamant' },
  { id: 'emoji_bolt', emoji: '⚡', label: 'Éclair' },
  { id: 'emoji_astro', emoji: '🚀', label: 'Espace' }
];

const STEPS_NAV = [
  { step: 1, label: 'Accueil' },
  { step: 2, label: 'Profil' },
  { step: 3, label: 'Style' },
  { step: 4, label: 'Installation' },
  { step: 5, label: 'Prêt' }
];

export const SetupWizard = () => {
  const { completeInstallation } = useOS();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(getAssetPath('/apps/user.png'));
  const [hasPassword, setHasPassword] = useState(false);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [language, setLanguage] = useState('fr');
  const [keyboardLayout, setKeyboardLayout] = useState('azerty');
  const [theme, setTheme] = useState('dark');
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0]);
  const [wallpaper, setWallpaper] = useState(WALLPAPERS[0]);
  const [progress, setProgress] = useState(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [error, setError] = useState('');

  // Terminal log stream for step 4
  const [terminalLogs, setTerminalLogs] = useState([]);
  const terminalEndRef = useRef(null);

  const INSTALL_MODULES = [
    { title: 'Initialisation du micro-noyau FloraCore 2.6', detail: 'Chargement des modules Wasm & runtime audio...' },
    { title: 'Montage du système de fichiers isolé', detail: 'Création des répertoires sandbox et arborescence système...' },
    { title: 'Déploiement des applications par défaut', detail: 'Installation de Horloge, Calendrier, Explorateur, FloraStore...' },
    { title: 'Sécurisation et chiffrement du profil', detail: 'Application du PIN de session et des clés locales...' },
    { title: 'Finalisation de l\'environnement de bureau', detail: 'Optimisation graphique du GPU & barre unifiée...' }
  ];

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Step 4 progress simulation
  useEffect(() => {
    if (step === 4) {
      setTerminalLogs(['[INIT] Démarrage de l\'installeur FloraOS v2.6.0...']);
      let currentProg = 0;
      let moduleIdx = 0;

      const interval = setInterval(() => {
        currentProg += 4;
        setProgress(Math.min(currentProg, 100));

        // Update module stages
        const newModIdx = Math.min(Math.floor(currentProg / 20), INSTALL_MODULES.length - 1);
        if (newModIdx !== moduleIdx) {
          moduleIdx = newModIdx;
          setCurrentModuleIndex(moduleIdx);
          setTerminalLogs(prev => [
            ...prev,
            `[OK] ${INSTALL_MODULES[newModIdx].title}`,
            `[SYS] ${INSTALL_MODULES[newModIdx].detail}`
          ]);
        }

        if (currentProg >= 100) {
          clearInterval(interval);
          setTerminalLogs(prev => [
            ...prev,
            `[SUCCESS] Installation terminée avec succès (0 erreurs).`,
            `[READY] Démarrage du bureau graphique FloraOS...`
          ]);
          playStartupSound();
          setTimeout(() => {
            setStep(5);
          }, 800);
        }
      }, 130);

      return () => clearInterval(interval);
    }
  }, [step]);

  const goToStep = (nextStep) => {
    playClickSound();
    setStep(nextStep);
  };

  const handleNextStep2 = (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      playWarningSound();
      setError('Veuillez entrer un nom d\'utilisateur.');
      return;
    }
    if (hasPassword) {
      if (!pin || pin.length < 4) {
        playWarningSound();
        setError('Le mot de passe / PIN doit comporter au moins 4 caractères.');
        return;
      }
      if (pin !== pinConfirm) {
        playWarningSound();
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
    }
    setError('');
    playSuccessSound();
    goToStep(3);
  };

  const handleLaunch = () => {
    playStartupSound();
    completeInstallation(
      { 
        name: name.trim(), 
        avatar, 
        hasPassword, 
        pin: hasPassword ? pin : '' 
      },
      { 
        theme, 
        accentColor, 
        wallpaper,
        language,
        keyboardLayout
      }
    );
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#090d16',
      color: '#fff',
      padding: '20px',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden',
      userSelect: 'none'
    }}>
      {/* Subtle Wallpaper Backdrop preview when picking wallpaper */}
      {wallpaper?.url && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${wallpaper.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: step === 3 ? 0.22 : 0.08,
          filter: 'blur(30px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none'
        }} />
      )}

      {/* Main Container Card (Sober, minimalist Windows 11 / Zorin style) */}
      <div style={{
        width: '100%',
        maxWidth: '620px',
        background: 'rgba(17, 24, 39, 0.92)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '32px 32px 28px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        minHeight: '500px'
      }}>
        {/* Top Header: Brand & Step Breadcrumbs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '16px'
        }}>
          {/* Logo badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
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
                style={{ width: '22px', height: '22px', objectFit: 'contain' }}
              />
              <span style={{ display: 'none', fontSize: '15px' }}>🌿</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em' }}>
                FloraOS <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', marginLeft: '4px' }}>2.6 Pro</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Assistant d'installation
              </div>
            </div>
          </div>

          {/* Stepper indicator pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {STEPS_NAV.map((s, idx) => {
              const isPast = step > s.step;
              const isCurrent = step === s.step;
              return (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: isCurrent ? '4px 10px' : '4px 7px',
                      borderRadius: '999px',
                      background: isCurrent 
                        ? 'var(--accent-color, #10b981)' 
                        : isPast 
                        ? 'rgba(16, 185, 129, 0.15)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isCurrent 
                        ? '1px solid rgba(255, 255, 255, 0.3)' 
                        : isPast 
                        ? '1px solid rgba(16, 185, 129, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      color: isCurrent ? '#fff' : isPast ? '#34d399' : '#64748b',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {isPast ? <Check size={11} strokeWidth={3} /> : <span>{s.step}</span>}
                    {isCurrent && <span>{s.label}</span>}
                  </div>
                  {idx < STEPS_NAV.length - 1 && (
                    <div style={{
                      width: '8px',
                      height: '2px',
                      background: isPast ? '#10b981' : 'rgba(255, 255, 255, 0.1)'
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1: ACCUEIL & PRÉSENTATION */}
        {step === 1 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            animation: 'slideInFromRight 0.3s ease',
            flex: 1,
            justifyContent: 'center'
          }}>
            {/* Sober emblem */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              overflow: 'hidden'
            }}>
              <img
                src={getAssetPath('/apps/os_icon.png')}
                alt="FloraOS"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
                }}
                style={{ width: '38px', height: '38px', objectFit: 'contain' }}
              />
              <span style={{ display: 'none', fontSize: '28px' }}>🌿</span>
            </div>

            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
              marginBottom: '8px',
              color: '#f8fafc'
            }}>
              Bienvenue sur FloraOS
            </h1>

            <p style={{
              fontSize: '13.5px',
              color: '#94a3b8',
              lineHeight: 1.55,
              maxWidth: '460px',
              marginBottom: '26px'
            }}>
              Le système d'exploitation web moderne, fluide, sandboxé et conçu avec une interface sobre et réactive.
            </p>

            {/* Feature Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              width: '100%',
              marginBottom: '28px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.035)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px 10px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px'
                }}>
                  <Shield size={16} />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', marginBottom: '2px' }}>
                  Isolation Totale
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.35 }}>
                  Espace utilisateur étanche.
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.035)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px 10px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px'
                }}>
                  <Zap size={16} />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', marginBottom: '2px' }}>
                  Fluidité 60 FPS
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.35 }}>
                  Fenêtrage sobre et réactif.
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.035)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px 10px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.12)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px'
                }}>
                  <Palette size={16} />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', marginBottom: '2px' }}>
                  Apps Natives
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.35 }}>
                  Horloge, Calendrier & Store.
                </div>
              </div>
            </div>

            {/* Regional & Language Preferences */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              width: '100%',
              marginBottom: '24px',
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '12px 14px'
            }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                  <Globe size={13} style={{ color: 'var(--accent-color, #10b981)' }} /> Langue du système
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="fr" style={{ background: '#1e293b' }}>Français (France)</option>
                  <option value="en" style={{ background: '#1e293b' }}>English (US)</option>
                  <option value="es" style={{ background: '#1e293b' }}>Español</option>
                  <option value="de" style={{ background: '#1e293b' }}>Deutsch</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                  <Keyboard size={13} style={{ color: 'var(--accent-color, #10b981)' }} /> Disposition clavier
                </label>
                <select
                  value={keyboardLayout}
                  onChange={(e) => setKeyboardLayout(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="azerty" style={{ background: '#1e293b' }}>Français (AZERTY)</option>
                  <option value="qwerty" style={{ background: '#1e293b' }}>English (QWERTY)</option>
                  <option value="qwertz" style={{ background: '#1e293b' }}>Deutsch (QWERTZ)</option>
                </select>
              </div>
            </div>

            {/* Launch button (Windows 11 / Zorin style) */}
            <button
              onClick={() => goToStep(2)}
              style={{
                width: '100%',
                padding: '11px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'var(--accent-color, #10b981)',
                color: '#fff',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                transition: 'filter 0.12s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.08)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              Commencer la configuration <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: CRÉATION DU PROFIL & SÉCURITÉ */}
        {step === 2 && (
          <div style={{ animation: 'slideInFromRight 0.3s ease', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
                Votre profil administrateur
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                Ce compte sera le gestionnaire principal de cet environnement système.
              </p>
            </div>

            <form onSubmit={handleNextStep2} style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
              {/* Profile Preview Card & Avatar Picker */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.035)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '2px solid var(--accent-color, #10b981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                  flexShrink: 0
                }}>
                  {avatar.startsWith('/') || avatar.includes('/apps/') ? (
                    <img src={getAssetPath(avatar)} alt="avatar" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
                  ) : (
                    avatar
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-color, #10b981)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Aperçu du compte
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                    {name.trim() || 'Votre Nom'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Rôle : Administrateur système
                  </div>
                </div>

                {/* Avatar options */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {AVATAR_OPTIONS.map(opt => {
                    const isSelected = avatar === opt.src || avatar === opt.emoji;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          playClickSound();
                          setAvatar(opt.src || opt.emoji);
                        }}
                        title={opt.label}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          background: isSelected ? 'var(--accent-color, #10b981)' : 'rgba(255, 255, 255, 0.06)',
                          border: isSelected ? '1px solid #fff' : '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {opt.src ? (
                          <img src={getAssetPath(opt.src)} alt={opt.label} style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                        ) : (
                          opt.emoji
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                  <User size={13} style={{ color: 'var(--accent-color, #10b981)' }} /> Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Utilisateur ou Alex"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#fff',
                    fontSize: '13.5px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-color, #10b981)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.14)'}
                />
              </div>

              {/* Authentication Security Mode */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                  <KeyRound size={13} style={{ color: 'var(--accent-color, #10b981)' }} /> Sécurité du compte
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => {
                      playClickSound();
                      setHasPassword(false);
                      setError('');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: !hasPassword ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: !hasPassword ? '2px solid var(--accent-color, #10b981)' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Unlock size={18} style={{ color: !hasPassword ? '#34d399' : '#94a3b8' }} />
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: !hasPassword ? '#fff' : '#cbd5e1' }}>Sans mot de passe</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Accès immédiat au bureau</div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      playClickSound();
                      setHasPassword(true);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: hasPassword ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: hasPassword ? '2px solid var(--accent-color, #10b981)' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Lock size={18} style={{ color: hasPassword ? '#34d399' : '#94a3b8' }} />
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: hasPassword ? '#fff' : '#cbd5e1' }}>Avec code de sécurité</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Protection par PIN / code</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password / PIN Code Inputs (Only if hasPassword is true) */}
              {hasPassword ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                        <Lock size={13} style={{ color: 'var(--accent-color, #10b981)' }} /> Mot de passe / PIN
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                      >
                        {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={16}
                      placeholder="Min. 4 caractères"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: '#fff',
                        fontSize: '13.5px',
                        letterSpacing: showPin ? 'normal' : '0.15em',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                      Confirmer le mot de passe
                    </label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value)}
                      maxLength={16}
                      placeholder="Confirmez le code"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: '#fff',
                        fontSize: '13.5px',
                        letterSpacing: showPin ? 'normal' : '0.15em',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '12px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Sparkles size={16} style={{ color: '#34d399', flexShrink: 0 }} />
                  <span>Aucun mot de passe ne sera requis. Votre bureau s'ouvrira immédiatement à chaque connexion.</span>
                </div>
              )}

              {error && (
                <div style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                >
                  <ArrowLeft size={14} /> Précédent
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'var(--accent-color, #10b981)',
                    color: '#fff',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                    transition: 'filter 0.12s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  Continuer <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: PERSONNALISATION VISUELLE & LIVE MOCKUP */}
        {step === 3 && (
          <div style={{ animation: 'slideInFromRight 0.3s ease', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                Apparence & Personnalisation
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                Configurez les couleurs, le thème et le fond d'écran de votre session.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {/* Theme & Accent Pickers Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Theme Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                    Thème
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div
                      onClick={() => {
                        playClickSound();
                        setTheme('dark');
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: theme === 'dark' ? '2px solid var(--accent-color, #10b981)' : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Moon size={15} style={{ color: '#34d399' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Sombre</span>
                    </div>

                    <div
                      onClick={() => {
                        playClickSound();
                        setTheme('light');
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: theme === 'light' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: theme === 'light' ? '2px solid var(--accent-color, #10b981)' : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Sun size={15} style={{ color: '#f59e0b' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Clair</span>
                    </div>
                  </div>
                </div>

                {/* Accent Color Picker */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                    Couleur d'accent
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {ACCENT_COLORS.map(c => {
                      const isSelected = accentColor.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            playClickSound();
                            setAccentColor(c);
                          }}
                          title={c.name}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: c.value,
                            boxShadow: isSelected ? `0 0 10px ${c.glow}` : 'none',
                            border: isSelected ? '2.5px solid #fff' : '2px solid transparent',
                            cursor: 'pointer',
                            transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                            transition: 'all 0.15s ease'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Wallpaper Horizontal Gallery */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                  Fond d'écran initial
                </label>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  padding: '4px 2px 10px',
                  scrollbarWidth: 'thin'
                }}>
                  {WALLPAPERS.slice(0, 6).map(wp => {
                    const isSelected = wallpaper?.id === wp.id;
                    return (
                      <div
                        key={wp.id}
                        onClick={() => {
                          playClickSound();
                          setWallpaper(wp);
                        }}
                        style={{
                          flexShrink: 0,
                          width: '110px',
                          height: '66px',
                          borderRadius: '12px',
                          backgroundImage: `url(${wp.thumb || wp.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: isSelected ? '2.5px solid var(--accent-color, #10b981)' : '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: isSelected ? '0 0 14px var(--accent-glow, rgba(16, 185, 129, 0.4))' : 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'var(--accent-color, #10b981)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                          }}>
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '12px 6px 3px',
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
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                >
                  <ArrowLeft size={14} /> Précédent
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  style={{
                    flex: 1,
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'var(--accent-color, #10b981)',
                    color: '#fff',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                    transition: 'filter 0.12s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  Lancer l'installation <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DÉPLOIEMENT DU SYSTÈME & LOGS KERNEL EN TEMPS RÉEL */}
        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.3s ease', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '10px'
              }}>
                <Cpu size={14} className="spin-slow" /> Déploiement en cours...
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                Installation de FloraOS
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                {INSTALL_MODULES[currentModuleIndex]?.title || 'Configuration du système...'}
              </p>
            </div>

              {/* Sober Progress Bar */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                  <span>Progression générale</span>
                  <span style={{ color: 'var(--accent-color, #10b981)' }}>{progress}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'var(--accent-color, #10b981)',
                    borderRadius: '4px',
                    transition: 'width 0.2s ease-out'
                  }} />
                </div>
              </div>

            {/* Terminal Live Kernel Logs Console */}
            <div style={{
              flex: 1,
              background: 'rgba(3, 7, 18, 0.85)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11.5px',
              minHeight: '160px',
              maxHeight: '180px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', marginBottom: '8px', fontSize: '11px' }}>
                <TerminalIcon size={12} />
                <span>FloraKernel Runtime Output</span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {terminalLogs.map((log, i) => (
                  <div key={i} style={{
                    color: log.startsWith('[SUCCESS]') 
                      ? '#34d399' 
                      : log.startsWith('[OK]') 
                      ? '#38bdf8' 
                      : '#cbd5e1',
                    lineHeight: 1.4
                  }}>
                    {log}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-color, #10b981)' }}>
                  <span>&gt;</span>
                  <span style={{ animation: 'blinkCursor 0.8s infinite' }}>_</span>
                </div>
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SYSTÈME PRÊT & BIENVENUE */}
        {step === 5 && (
          <div style={{
            animation: 'scaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            justifyContent: 'center'
          }}>
            {/* Celebration checkmark */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid var(--accent-color, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-color, #10b981)',
              marginBottom: '16px'
            }}>
              <Check size={32} strokeWidth={2.5} />
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
              color: '#f8fafc'
            }}>
              FloraOS est prêt !
            </h2>

            <p style={{
              fontSize: '13.5px',
              color: '#94a3b8',
              maxWidth: '440px',
              lineHeight: 1.5,
              marginBottom: '20px'
            }}>
              Votre session administrateur est configurée avec les applications système et un environnement sécurisé.
            </p>

            {/* Summary Card */}
            <div style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.035)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <div>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Administrateur
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
                  {name.trim() || 'Administrateur'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Thème
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
                  {theme === 'dark' ? 'Sombre' : 'Clair'} • {accentColor.name}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Applications
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#34d399', marginTop: '2px' }}>
                  8 apps actives
                </div>
              </div>
            </div>

            {/* Launch CTA (Minimalist, Windows 11 style) */}
            <button
              onClick={handleLaunch}
              style={{
                width: '100%',
                padding: '11px 22px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'var(--accent-color, #10b981)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                transition: 'filter 0.12s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.08)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              <Sparkles size={16} /> Accéder à mon Bureau FloraOS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
