import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOS } from '../../../context/OSContext';
import { getAssetPath } from '../../../utils/paths';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Home, 
  Lock, 
  ExternalLink, 
  Plus, 
  X, 
  Search, 
  Globe, 
  Star, 
  Share2, 
  Sparkles,
  BookmarkPlus,
  ShieldCheck,
  ShieldAlert,
  Play,
  Tv,
  Film,
  Music,
  Cpu,
  Gamepad2,
  Compass,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { playClickSound } from '../../../utils/audio';

// Sites connus bloquant les iframes via X-Frame-Options ou CSP
const BLOCKED_DOMAINS = [
  'google.com', 'google.fr', 'www.google.com', 'www.google.fr',
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be',
  'facebook.com', 'www.facebook.com',
  'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
  'github.com', 'www.github.com',
  'reddit.com', 'www.reddit.com',
  'instagram.com', 'www.instagram.com',
  'linkedin.com', 'www.linkedin.com',
  'amazon.com', 'amazon.fr', 'www.amazon.fr',
  'netflix.com', 'www.netflix.com',
  'twitch.tv', 'www.twitch.tv',
  'apple.com', 'www.apple.com',
  'microsoft.com', 'www.microsoft.com',
  'discord.com', 'www.discord.com',
  'yahoo.com', 'www.yahoo.com',
  'bing.com', 'www.bing.com'
];

const DEFAULT_BOOKMARKS = [
  { id: 'search', name: 'FloraSearch', url: 'flora:search', icon: '🔍' },
  { id: 'tube', name: 'FloraTube (YouTube)', url: 'flora:tube', icon: '📺' },
  { id: 'wiki', name: 'Wikipédia', url: 'https://fr.m.wikipedia.org', icon: '📖' },
  { id: 'osm', name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/export/embed.html', icon: '🗺️' },
  { id: 'game2048', name: 'Jeu 2048', url: 'https://play2048.co', icon: '🎮' },
  { id: 'archive', name: 'Internet Archive', url: 'https://archive.org', icon: '🏛️' }
];

// Catalogue de vidéos pour FloraTube (qui fonctionnent à 100% sans blocage)
const FEATURED_VIDEOS = [
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Girl — Beats to relax/study to',
    channel: 'Lofi Girl',
    category: 'music',
    duration: 'Live',
    views: '65k en direct'
  },
  {
    id: '4xDzrJKXOOY',
    title: 'synthwave radio 🌌 - beats to chill/game to',
    channel: 'Lofi Girl',
    category: 'music',
    duration: 'Live',
    views: '12k en direct'
  },
  {
    id: '1-qX3rLwU9Q',
    title: 'Vue de la Terre depuis la Station Spatiale ISS (4K)',
    channel: 'NASA',
    category: 'nature',
    duration: '1:02:14',
    views: '8.4M vues'
  },
  {
    id: '6z9b_j23n4Q',
    title: 'Récifs coralliens et fonds sous-marins 4K Ultra HD',
    channel: 'Nature Relaxation',
    category: 'nature',
    duration: '45:20',
    views: '3.1M vues'
  },
  {
    id: 'o8NPllzkFhE',
    title: 'Linus Torvalds : L\'histoire et le futur de Linux',
    channel: 'TED',
    category: 'tech',
    duration: '21:30',
    views: '4.9M vues'
  },
  {
    id: '2B-XwBCi6dU',
    title: 'L\'Évolution des Ordinateurs Personnels (1970 - 2025)',
    channel: 'Tech History',
    category: 'tech',
    duration: '18:45',
    views: '1.2M vues'
  },
  {
    id: '8nK4mS_R-xM',
    title: 'Évolution des Graphismes de Jeux Vidéo (1980 - 2024)',
    channel: 'Gaming World',
    category: 'gaming',
    duration: '16:08',
    views: '2.5M vues'
  },
  {
    id: 'b3KUyPKbR7Q',
    title: 'The Legend of Zelda Symphony of the Goddesses',
    channel: 'Orchestral Gaming',
    category: 'gaming',
    duration: '12:40',
    views: '1.8M vues'
  }
];

// Helper: Extraire l'ID vidéo d'une URL YouTube quelconque
function extractYouTubeId(url = '') {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

// Helper: Vérifier si un domaine bloque l'iframe
function isDomainBlocked(url = '') {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(b => hostname === b || hostname.endsWith(`.${b}`));
  } catch {
    return false;
  }
}

export const BrowserApp = ({ windowData }) => {
  const { createWebShortcut, notify } = useOS();

  // URL initiale
  const rawInitial = windowData?.fileContext?.url || 
                     (windowData?.fileContext?.content?.match(/URL=(https?:\/\/[^\r\n]+)/i)?.[1]) ||
                     'flora:home';

  // Normaliser l'URL initiale (YouTube -> FloraTube, Google -> FloraSearch)
  const resolveInitialUrl = (target) => {
    if (!target) return 'flora:home';
    if (extractYouTubeId(target) || /youtube\.com|youtu\.be/i.test(target)) {
      const ytId = extractYouTubeId(target);
      return ytId ? `flora:tube?v=${ytId}` : 'flora:tube';
    }
    if (/google\.com|google\.fr|duckduckgo\.com|bing\.com/i.test(target)) {
      return 'flora:search';
    }
    return target;
  };

  const initialUrl = resolveInitialUrl(rawInitial);
  const initialTitle = windowData?.fileContext?.name?.replace(/\.url$/i, '') || 
                       (initialUrl === 'flora:home' ? 'Accueil — FloraWeb' : 
                        initialUrl.startsWith('flora:tube') ? 'FloraTube (YouTube)' :
                        initialUrl.startsWith('flora:search') ? 'FloraSearch' : initialUrl);

  const [tabs, setTabs] = useState([
    {
      id: 'tab_1',
      title: initialTitle,
      url: initialUrl,
      inputUrl: initialUrl.startsWith('flora:') ? '' : initialUrl,
      isLoading: false,
      history: [initialUrl],
      historyIdx: 0,
      forceDirect: false
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('tab_1');
  const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const iframeRef = useRef(null);

  // Synchronisation lors de l'ouverture d'un nouveau fichier/raccourci
  useEffect(() => {
    if (windowData?.fileContext?.url) {
      const newRaw = windowData.fileContext.url;
      const newUrl = resolveInitialUrl(newRaw);
      const newTitle = windowData.fileContext.name?.replace(/\.url$/i, '') || 
                       (newUrl.startsWith('flora:tube') ? 'FloraTube (YouTube)' :
                        newUrl.startsWith('flora:search') ? 'FloraSearch' : newUrl);
      setTabs(prev => prev.map(t => {
        if (t.id === activeTabId) {
          return {
            ...t,
            url: newUrl,
            inputUrl: newUrl.startsWith('flora:') ? '' : newUrl,
            title: newTitle,
            history: [...t.history.slice(0, t.historyIdx + 1), newUrl],
            historyIdx: t.historyIdx + 1,
            forceDirect: false
          };
        }
        return t;
      }));
    }
  }, [windowData?.fileContext?.url]);

  const updateActiveTab = (updates) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const handleNavigate = (rawQuery, forceDirect = false) => {
    const query = (rawQuery || '').trim();
    if (!query) return;

    let destinationUrl = query;
    let tabTitle = query;

    // 1. Pages internes Flora
    if (query === 'flora:home' || query === 'about:home' || query === 'home') {
      destinationUrl = 'flora:home';
      tabTitle = 'Accueil — FloraWeb';
    } else if (query === 'flora:tube' || query.startsWith('flora:tube?')) {
      destinationUrl = query;
      tabTitle = 'FloraTube (YouTube)';
    } else if (query === 'flora:search' || query.startsWith('flora:search?')) {
      destinationUrl = query;
      tabTitle = 'FloraSearch';
    }
    // 2. Détection YouTube -> FloraTube
    else if (extractYouTubeId(query) || /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/i.test(query)) {
      const ytId = extractYouTubeId(query);
      destinationUrl = ytId ? `flora:tube?v=${ytId}` : 'flora:tube';
      tabTitle = 'FloraTube (YouTube)';
    }
    // 3. Détection Moteurs de recherche / Google / DuckDuckGo -> FloraSearch
    else if (/^(https?:\/\/)?(www\.)?(google\.(com|fr)|duckduckgo\.com|bing\.com)/i.test(query)) {
      destinationUrl = 'flora:search';
      tabTitle = 'FloraSearch';
    }
    // 4. URL HTTP / HTTPS directe
    else if (/^https?:\/\//i.test(query)) {
      destinationUrl = query;
      try {
        tabTitle = new URL(query).hostname.replace(/^www\./, '');
      } catch {
        tabTitle = query;
      }
    } 
    // 5. Nom de domaine sans protocole (ex: wikipedia.org, github.com)
    else if (/^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(query)) {
      const fullUrl = `https://${query}`;
      if (/youtube\.com|youtu\.be/i.test(query)) {
        destinationUrl = 'flora:tube';
        tabTitle = 'FloraTube (YouTube)';
      } else if (/google\.(com|fr)|duckduckgo\.com/i.test(query)) {
        destinationUrl = 'flora:search';
        tabTitle = 'FloraSearch';
      } else {
        destinationUrl = fullUrl;
        tabTitle = query.split('/')[0];
      }
    } 
    // 6. Terme de recherche quelconque -> FloraSearch avec paramètre
    else {
      destinationUrl = `flora:search?q=${encodeURIComponent(query)}`;
      tabTitle = `Recherche: ${query}`;
    }

    const newHistory = [...activeTab.history.slice(0, activeTab.historyIdx + 1), destinationUrl];
    updateActiveTab({
      url: destinationUrl,
      inputUrl: destinationUrl.startsWith('flora:') ? '' : destinationUrl,
      title: tabTitle,
      history: newHistory,
      historyIdx: newHistory.length - 1,
      isLoading: true,
      forceDirect: forceDirect
    });

    setTimeout(() => {
      updateActiveTab({ isLoading: false });
    }, 400);
  };

  const handleBack = () => {
    if (activeTab.historyIdx > 0) {
      playClickSound();
      const prevIdx = activeTab.historyIdx - 1;
      const prevUrl = activeTab.history[prevIdx];
      updateActiveTab({
        url: prevUrl,
        inputUrl: prevUrl.startsWith('flora:') ? '' : prevUrl,
        title: prevUrl.startsWith('flora:') ? 'FloraOS Web' : prevUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
        historyIdx: prevIdx,
        forceDirect: false
      });
    }
  };

  const handleForward = () => {
    if (activeTab.historyIdx < activeTab.history.length - 1) {
      playClickSound();
      const nextIdx = activeTab.historyIdx + 1;
      const nextUrl = activeTab.history[nextIdx];
      updateActiveTab({
        url: nextUrl,
        inputUrl: nextUrl.startsWith('flora:') ? '' : nextUrl,
        title: nextUrl.startsWith('flora:') ? 'FloraOS Web' : nextUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
        historyIdx: nextIdx,
        forceDirect: false
      });
    }
  };

  const handleReload = () => {
    playClickSound();
    updateActiveTab({ isLoading: true });
    if (iframeRef.current && !activeTab.url.startsWith('flora:')) {
      iframeRef.current.src = activeTab.url;
    }
    setTimeout(() => updateActiveTab({ isLoading: false }), 400);
  };

  const handleAddTab = () => {
    playClickSound();
    const newId = `tab_${Date.now()}`;
    const newTab = {
      id: newId,
      title: 'Nouvel onglet',
      url: 'flora:home',
      inputUrl: '',
      isLoading: false,
      history: ['flora:home'],
      historyIdx: 0,
      forceDirect: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id, e) => {
    e.stopPropagation();
    playClickSound();
    if (tabs.length === 1) {
      setTabs([{
        id: 'tab_1',
        title: 'Nouvel onglet',
        url: 'flora:home',
        inputUrl: '',
        isLoading: false,
        history: ['flora:home'],
        historyIdx: 0,
        forceDirect: false
      }]);
      setActiveTabId('tab_1');
      return;
    }

    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  const handleCreateDesktopShortcut = () => {
    if (activeTab.url === 'flora:home') {
      notify('Information', 'La page d\'accueil est une page interne de FloraOS.', 'Info');
      return;
    }
    let target = activeTab.url;
    if (activeTab.url.startsWith('flora:tube')) {
      target = 'https://youtube.com';
    } else if (activeTab.url.startsWith('flora:search')) {
      target = 'https://duckduckgo.com';
    }
    const cleanName = activeTab.title || 'Raccourci Web';
    createWebShortcut('desktop', cleanName, target);
  };

  const handleOpenExternal = (customUrl) => {
    const target = customUrl || activeTab.url;
    if (!target) return;
    
    if (target.startsWith('flora:tube')) {
      const match = target.match(/v=([\w-]+)/);
      const url = match ? `https://www.youtube.com/watch?v=${match[1]}` : 'https://www.youtube.com';
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (target.startsWith('flora:search')) {
      const match = target.match(/q=([^&]+)/);
      const query = match ? decodeURIComponent(match[1]) : '';
      const url = query ? `https://duckduckgo.com/?q=${encodeURIComponent(query)}` : 'https://duckduckgo.com';
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (!target.startsWith('flora:')) {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  // Détection si l'URL courante est bloquée
  const isBlocked = useMemo(() => {
    if (activeTab.url.startsWith('flora:')) return false;
    if (activeTab.forceDirect) return false;
    return isDomainBlocked(activeTab.url);
  }, [activeTab.url, activeTab.forceDirect]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f172a',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden',
      userSelect: 'none'
    }}>
      {/* 1. Onglets Chrome / Navigateur */}
      <div style={{
        height: '38px',
        background: 'rgba(15, 23, 42, 0.98)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0 8px',
        gap: '4px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          overflowX: 'auto',
          flex: 1,
          scrollbarWidth: 'none'
        }}>
          {tabs.map((tab) => {
            const isTabActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => {
                  playClickSound();
                  setActiveTabId(tab.id);
                }}
                style={{
                  height: '32px',
                  minWidth: '140px',
                  maxWidth: '220px',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 10px',
                  borderRadius: '8px 8px 0 0',
                  background: isTabActive ? 'rgba(30, 41, 59, 1)' : 'rgba(255, 255, 255, 0.04)',
                  border: isTabActive ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
                  borderBottom: 'none',
                  color: isTabActive ? '#f8fafc' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: isTabActive ? 600 : 500,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.15s ease'
                }}
              >
                {tab.url.startsWith('flora:tube') ? (
                  <span style={{ fontSize: '13px' }}>📺</span>
                ) : tab.url.startsWith('flora:search') ? (
                  <span style={{ fontSize: '13px' }}>🔍</span>
                ) : (
                  <img
                    src={getAssetPath('/apps/web.png')}
                    alt="icon"
                    style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                  />
                )}
                <span style={{
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {tab.title}
                </span>
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.7
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleAddTab}
          title="Nouvel onglet"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: '2px',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* 2. Barre d'outils et Omnibox */}
      <div style={{
        padding: '6px 12px',
        background: '#1e293b',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Boutons Historique */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleBack}
            disabled={activeTab.historyIdx <= 0}
            title="Précédent"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: activeTab.historyIdx > 0 ? '#f1f5f9' : '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: activeTab.historyIdx > 0 ? 'pointer' : 'default'
            }}
          >
            <ArrowLeft size={15} />
          </button>

          <button
            onClick={handleForward}
            disabled={activeTab.historyIdx >= activeTab.history.length - 1}
            title="Suivant"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: activeTab.historyIdx < activeTab.history.length - 1 ? '#f1f5f9' : '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: activeTab.historyIdx < activeTab.history.length - 1 ? 'pointer' : 'default'
            }}
          >
            <ArrowRight size={15} />
          </button>

          <button
            onClick={handleReload}
            title="Actualiser la page"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <RotateCw size={14} className={activeTab.isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => handleNavigate('flora:home')}
            title="Page d'accueil FloraWeb"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: activeTab.url === 'flora:home' ? 'var(--accent-color, #10b981)' : '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Home size={15} />
          </button>
        </div>

        {/* Omnibox / Barre de recherche */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNavigate(activeTab.inputUrl);
          }}
          style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}
        >
          <div style={{
            position: 'absolute',
            left: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: activeTab.url.startsWith('https://') ? '#34d399' : 
                   activeTab.url.startsWith('flora:') ? 'var(--accent-color, #10b981)' : '#94a3b8'
          }}>
            {activeTab.url.startsWith('flora:tube') ? (
              <Tv size={13} color="#f87171" />
            ) : activeTab.url.startsWith('flora:search') ? (
              <Search size={13} />
            ) : activeTab.url.startsWith('https://') ? (
              <Lock size={12} />
            ) : (
              <Search size={13} />
            )}
          </div>

          <input
            type="text"
            value={activeTab.inputUrl}
            onChange={(e) => updateActiveTab({ inputUrl: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="Rechercher sur le Web, YouTube ou taper une adresse (ex: youtube.com, wikipedia)..."
            style={{
              width: '100%',
              padding: '7px 75px 7px 30px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(0, 0, 0, 0.35)',
              color: '#fff',
              fontSize: '12.5px',
              outline: 'none',
              transition: 'border-color 0.15s'
            }}
            onFocusCapture={(e) => e.target.style.borderColor = 'var(--accent-color, #10b981)'}
            onBlurCapture={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
          />

          {/* Actions rapides dans l'omnibox */}
          <div style={{ position: 'absolute', right: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            {activeTab.url !== 'flora:home' && (
              <button
                type="button"
                onClick={handleCreateDesktopShortcut}
                title="Créer un raccourci sur le Bureau"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                <BookmarkPlus size={14} />
              </button>
            )}

            {activeTab.url !== 'flora:home' && (
              <button
                type="button"
                onClick={() => handleOpenExternal()}
                title="Ouvrir dans le vrai navigateur (Chrome / Firefox)"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#34d399'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                <ExternalLink size={13} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Barre des Favoris */}
      <div style={{
        height: '28px',
        background: '#162032',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '6px',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {bookmarks.map((b) => {
          const isSelected = activeTab.url === b.url || (b.url === 'flora:tube' && activeTab.url.startsWith('flora:tube'));
          return (
            <div
              key={b.id}
              onClick={() => handleNavigate(b.url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                borderRadius: '5px',
                background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: isSelected ? '#fff' : '#cbd5e1',
                fontSize: '11px',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}
            >
              <span>{b.icon}</span>
              <span>{b.name}</span>
            </div>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => handleOpenExternal()}
            title="Ouvrir dans le vrai navigateur de votre machine"
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            <ExternalLink size={11} />
            <span>Ouvrir dans Chrome / Firefox</span>
          </button>
        </div>
      </div>

      {/* 4. Zone Principale d'Affichage */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0b1120' }}>
        {activeTab.url === 'flora:home' ? (
          /* Page d'Accueil FloraWeb */
          <FloraHomeView onNavigate={handleNavigate} bookmarks={bookmarks} />
        ) : activeTab.url.startsWith('flora:tube') ? (
          /* Client YouTube FloraTube Intégré */
          <FloraTubeView 
            url={activeTab.url} 
            onNavigateVideo={(newId) => handleNavigate(`flora:tube?v=${newId}`)}
            onOpenExternal={handleOpenExternal}
          />
        ) : activeTab.url.startsWith('flora:search') ? (
          /* Moteur de Recherche FloraSearch Intégré */
          <FloraSearchView 
            url={activeTab.url} 
            onNavigate={handleNavigate} 
            onOpenExternal={handleOpenExternal}
          />
        ) : isBlocked ? (
          /* Écran d'Alerte et Protection Sécurité X-Frame-Options */
          <FloraWebGuardView 
            url={activeTab.url} 
            onForceDirect={() => updateActiveTab({ forceDirect: true })}
            onOpenExternal={() => handleOpenExternal()}
            onSearchWithFlora={() => handleNavigate(`flora:search?q=${encodeURIComponent(new URL(activeTab.url).hostname)}`)}
          />
        ) : (
          /* Vue Iframe Directe pour les sites compatibles */
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <iframe
              ref={iframeRef}
              src={activeTab.url}
              title={activeTab.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#fff'
              }}
              onLoad={() => updateActiveTab({ isLoading: false })}
            />

            {/* Aide flottante en bas de page */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              padding: '6px 12px',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              fontSize: '11px',
              color: '#94a3b8'
            }}>
              <span>Page blanche ou connexion refusée ?</span>
              <button
                onClick={() => handleOpenExternal()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                <span>Ouvrir dans un vrai onglet</span>
                <ExternalLink size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   COMPOSANT 1 : PAGE D'ACCUEIL FLORAWEB
   ========================================================================= */
const FloraHomeView = ({ onNavigate, bookmarks }) => {
  const [query, setQuery] = useState('');

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 20px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '68px',
        height: '68px',
        borderRadius: '18px',
        background: 'rgba(59, 130, 246, 0.12)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '14px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
      }}>
        <img
          src={getAssetPath('/apps/web.png')}
          alt="Web"
          style={{ width: '46px', height: '46px', objectFit: 'contain' }}
        />
      </div>

      <h1 style={{
        fontSize: '28px',
        fontWeight: 800,
        fontFamily: 'var(--font-display)',
        marginBottom: '6px',
        color: '#f8fafc',
        letterSpacing: '-0.02em'
      }}>
        Navigateur FloraWeb
      </h1>
      <p style={{
        fontSize: '13px',
        color: '#94a3b8',
        maxWidth: '480px',
        marginBottom: '26px',
        lineHeight: 1.5
      }}>
        Explorez le Web, visionnez des vidéos sur YouTube et effectuez des recherches directement dans FloraOS.
      </p>

      {/* Barre de recherche centrale */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNavigate(query);
        }}
        style={{
          width: '100%',
          maxWidth: '540px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          marginBottom: '30px'
        }}
      >
        <Search
          size={16}
          style={{ position: 'absolute', left: '16px', color: '#94a3b8' }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher sur le Web ou entrer une URL (ex: youtube.com)..."
          autoFocus
          style={{
            width: '100%',
            padding: '13px 44px 13px 44px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-color, #10b981)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.16)'}
        />
        <button
          type="submit"
          style={{
            position: 'absolute',
            right: '8px',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-color, #10b981)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ArrowRight size={15} />
        </button>
      </form>

      {/* Grille d'accès rapide */}
      <div style={{
        width: '100%',
        maxWidth: '560px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '28px'
      }}>
        {bookmarks.map((b) => (
          <div
            key={b.id}
            onClick={() => onNavigate(b.url)}
            style={{
              background: 'rgba(255, 255, 255, 0.035)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.035)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '22px' }}>{b.icon}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {b.name}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                {b.url.startsWith('flora:') ? 'Application FloraOS' : 'Site Web'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '999px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: '11px',
        color: '#64748b'
      }}>
        <ShieldCheck size={13} color="#34d399" />
        <span>FloraTube & FloraSearch intégrés pour contourner les blocages X-Frame-Options du Web</span>
      </div>
    </div>
  );
};

/* =========================================================================
   COMPOSANT 2 : CLIENT YOUTUBE (FLORATUBE) - 100% FONCTIONNEL SANS BLOCAGE
   ========================================================================= */
const FloraTubeView = ({ url, onNavigateVideo, onOpenExternal }) => {
  const urlVideoId = extractYouTubeId(url);
  const [activeVideoId, setActiveVideoId] = useState(urlVideoId || 'jfKfPfyJRdk');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (urlVideoId) {
      setActiveVideoId(urlVideoId);
    }
  }, [urlVideoId]);

  const activeVideo = FEATURED_VIDEOS.find(v => v.id === activeVideoId) || {
    id: activeVideoId,
    title: 'Vidéo YouTube sélectionnée',
    channel: 'YouTube Video',
    category: 'custom',
    duration: '',
    views: ''
  };

  const filteredVideos = activeCategory === 'all' 
    ? FEATURED_VIDEOS 
    : FEATURED_VIDEOS.filter(v => v.category === activeCategory);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Si l'utilisateur colle un lien ou un ID YouTube
    const detectedId = extractYouTubeId(searchQuery.trim());
    if (detectedId) {
      setActiveVideoId(detectedId);
      onNavigateVideo(detectedId);
      setSearchQuery('');
      return;
    }

    // Sinon ouvrir la recherche sur YouTube dans un vrai onglet
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`, '_blank');
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#090d16',
      overflow: 'hidden'
    }}>
      {/* En-tête FloraTube */}
      <div style={{
        padding: '10px 16px',
        background: '#0f172a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: '#ef4444',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 800,
            fontSize: '12px',
            letterSpacing: '0.04em'
          }}>
            <Play size={12} fill="#fff" />
            <span>FLORATUBE</span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Lecteur Vidéo Officiel YouTube</span>
        </div>

        {/* Barre de recherche vidéo */}
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: '460px', position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Coller un lien YouTube (ex: youtube.com/watch?v=...) ou rechercher..."
            style={{
              width: '100%',
              padding: '6px 36px 6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '12px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              position: 'absolute',
              right: '4px',
              top: '4px',
              bottom: '4px',
              padding: '0 8px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Search size={12} />
          </button>
        </form>

        {/* Bouton ouvrir sur le vrai YouTube */}
        <button
          onClick={() => onOpenExternal(`https://www.youtube.com/watch?v=${activeVideoId}`)}
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <span>Ouvrir sur YouTube</span>
          <ExternalLink size={12} />
        </button>
      </div>

      {/* Contenu principal : Lecteur + Liste des vidéos */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Lecteur vidéo officiel Embed */}
        <div style={{
          flex: 1.8,
          display: 'flex',
          flexDirection: 'column',
          background: '#000',
          overflowY: 'auto',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            position: 'relative',
            paddingTop: '56.25%', // Ratio 16:9
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
            background: '#111'
          }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1`}
              title="Lecteur YouTube FloraOS"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
            />
          </div>

          {/* Informations sur la vidéo */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              {activeVideo.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{activeVideo.channel}</span>
                {activeVideo.views && <span>• {activeVideo.views}</span>}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`https://www.youtube.com/watch?v=${activeVideoId}`);
                  alert('Lien de la vidéo copié !');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e2e8f0',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Copier le lien
              </button>
            </div>
          </div>
        </div>

        {/* Panneau latéral des recommandations et catégories */}
        <div style={{
          flex: 1.2,
          minWidth: '280px',
          maxWidth: '380px',
          background: '#0d1322',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Filtres de catégories */}
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}>
            {[
              { id: 'all', label: 'Tout' },
              { id: 'music', label: 'Musique' },
              { id: 'tech', label: 'Tech & Linux' },
              { id: 'nature', label: 'Nature 4K' },
              { id: 'gaming', label: 'Jeux' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: 'none',
                  background: activeCategory === cat.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeCategory === cat.id ? '#fff' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Liste des vidéos sélectionnables */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredVideos.map((vid) => {
              const isPlaying = vid.id === activeVideoId;
              return (
                <div
                  key={vid.id}
                  onClick={() => {
                    playClickSound();
                    setActiveVideoId(vid.id);
                    onNavigateVideo(vid.id);
                  }}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: isPlaying ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: isPlaying ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isPlaying) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isPlaying) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <div style={{
                    width: '90px',
                    height: '56px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#222',
                    flexShrink: 0
                  }}>
                    <img
                      src={`https://img.youtube.com/vi/${vid.id}/mqdefault.jpg`}
                      alt={vid.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {vid.duration && (
                      <span style={{
                        position: 'absolute',
                        bottom: '3px',
                        right: '4px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '1px 3px',
                        borderRadius: '3px'
                      }}>
                        {vid.duration}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: isPlaying ? '#f87171' : '#f1f5f9',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {vid.title}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px' }}>
                      {vid.channel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   COMPOSANT 3 : MOTEUR DE RECHERCHE (FLORASEARCH)
   ========================================================================= */
const FloraSearchView = ({ url, onNavigate, onOpenExternal }) => {
  const urlParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  const initialQuery = urlParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [wikiResult, setWikiResult] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    setWikiResult(null);
    setSearchResults([]);

    try {
      // 1. Recherche Wikipédia (Français)
      const wikiPromise = fetch(`https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*`)
        .then(res => res.json())
        .then(async data => {
          const firstHit = data?.query?.search?.[0];
          if (firstHit?.title) {
            // Obtenir le résumé officiel
            try {
              const sumRes = await fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstHit.title)}`);
              const sumData = await sumRes.json();
              if (sumData?.extract) {
                setWikiResult({
                  title: sumData.title,
                  extract: sumData.extract,
                  thumbnail: sumData.thumbnail?.source,
                  url: sumData.content_urls?.desktop?.page || `https://fr.wikipedia.org/wiki/${encodeURIComponent(firstHit.title)}`
                });
              }
            } catch (e) {
              console.warn('Wiki summary fetch error:', e);
            }
          }
          if (data?.query?.search) {
            return data.query.search.map(item => ({
              title: item.title,
              snippet: item.snippet.replace(/<[^>]+>/g, ''),
              url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
              source: 'Wikipédia'
            }));
          }
          return [];
        })
        .catch(() => []);

      // 2. Recherche DuckDuckGo Instant Answer API
      const ddgPromise = fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(searchTerm)}&format=json&origin=*`)
        .then(res => res.json())
        .then(data => {
          const list = [];
          if (data?.AbstractText) {
            list.push({
              title: data.Heading || searchTerm,
              snippet: data.AbstractText,
              url: data.AbstractURL,
              source: data.AbstractSource || 'DuckDuckGo'
            });
          }
          if (data?.RelatedTopics) {
            data.RelatedTopics.slice(0, 5).forEach(topic => {
              if (topic.Text && topic.FirstURL) {
                list.push({
                  title: topic.Text.split(' - ')[0] || topic.Text,
                  snippet: topic.Text,
                  url: topic.FirstURL,
                  source: 'Web'
                });
              }
            });
          }
          return list;
        })
        .catch(() => []);

      const [wikiItems, ddgItems] = await Promise.all([wikiPromise, ddgPromise]);
      setSearchResults([...ddgItems, ...wikiItems]);
    } catch (err) {
      console.error('FloraSearch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onNavigate(`flora:search?q=${encodeURIComponent(query)}`);
    performSearch(query);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      background: '#0f172a',
      color: '#f8fafc',
      padding: '24px 30px'
    }}>
      {/* Barre de recherche */}
      <div style={{ maxWidth: '720px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ fontSize: '20px' }}>🔍</span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            FloraSearch
          </h2>
          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>Recherche Web Directe</span>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Que recherchez-vous aujourd'hui ?"
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '13.5px',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '0 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--accent-color, #10b981)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Rechercher
          </button>
        </form>

        {/* Liens rapides vers les moteurs externes */}
        {query && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Ouvrir dans le vrai navigateur :</span>
            <button
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#38bdf8',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Google</span>
              <ExternalLink size={10} />
            </button>
            <button
              onClick={() => window.open(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, '_blank')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fbbf24',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>DuckDuckGo</span>
              <ExternalLink size={10} />
            </button>
            <button
              onClick={() => onNavigate(`flora:tube?q=${encodeURIComponent(query)}`)}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Vidéos FloraTube</span>
              <Play size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Résultats de recherche */}
      <div style={{ maxWidth: '720px' }}>
        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
            <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px' }}>Recherche en cours...</p>
          </div>
        ) : (
          <>
            {/* Fiche Wikipédia en vedette */}
            {wikiResult && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                gap: '16px'
              }}>
                {wikiResult.thumbnail && (
                  <img
                    src={wikiResult.thumbnail}
                    alt={wikiResult.title}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      {wikiResult.title}
                    </h3>
                    <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>
                      Wikipédia
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                    {wikiResult.extract}
                  </p>
                  <button
                    onClick={() => onNavigate(wikiResult.url)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#34d399',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <span>Lire l'article complet</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Liste des résultats Web */}
            {searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {searchResults.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {item.source} • {item.url}
                    </div>
                    <a
                      href={item.url}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(item.url);
                      }}
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#38bdf8',
                        textDecoration: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {item.title}
                    </a>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                      {item.snippet}
                    </div>
                  </div>
                ))}
              </div>
            ) : query && !wikiResult ? (
              <div style={{ padding: '30px 0', color: '#94a3b8' }}>
                <p>Aucun résultat instantané trouvé pour cette recherche.</p>
                <button
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank')}
                  style={{
                    background: 'var(--accent-color, #10b981)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  Lancer la recherche sur Google (vrai navigateur)
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   COMPOSANT 4 : FLORAWEB GUARD (PROTECTION & GESTION X-FRAME-OPTIONS)
   ========================================================================= */
const FloraWebGuardView = ({ url, onForceDirect, onOpenExternal, onSearchWithFlora }) => {
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  const isYouTube = /youtube\.com|youtu\.be/i.test(hostname);
  const isGoogle = /google\.(com|fr)/i.test(hostname);

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 20px',
      textAlign: 'center',
      background: '#090d16'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <ShieldAlert size={34} color="#f87171" />
      </div>

      <h2 style={{
        fontSize: '22px',
        fontWeight: 800,
        color: '#f8fafc',
        marginBottom: '8px',
        letterSpacing: '-0.02em'
      }}>
        Affichage restreint par le site ({hostname})
      </h2>

      <p style={{
        fontSize: '13px',
        color: '#94a3b8',
        maxWidth: '520px',
        lineHeight: 1.6,
        marginBottom: '24px'
      }}>
        Pour protéger vos données et votre session, les serveurs de <strong style={{ color: '#fff' }}>{hostname}</strong> envoient une directive de sécurité stricte (<code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '4px' }}>X-Frame-Options: SAMEORIGIN</code>) qui interdit aux navigateurs (Firefox, Chrome...) d'afficher cette page encapsulée dans une autre application.
      </p>

      {/* Options d'action recommandées */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '420px' }}>
        {/* Action 1 : Ouvrir dans le vrai navigateur */}
        <button
          onClick={onOpenExternal}
          style={{
            width: '100%',
            padding: '12px 18px',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--accent-color, #10b981)',
            color: '#fff',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}
        >
          <span>Ouvrir dans Chrome / Firefox</span>
          <ExternalLink size={15} />
        </button>

        {/* Action 2 : Si YouTube ou Google */}
        {isYouTube ? (
          <button
            onClick={() => onSearchWithFlora()}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Play size={14} />
            <span>Basculer sur FloraTube (YouTube intégré)</span>
          </button>
        ) : isGoogle ? (
          <button
            onClick={() => onSearchWithFlora()}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Search size={14} />
            <span>Rechercher avec FloraSearch</span>
          </button>
        ) : null}

        {/* Action 3 : Forcer l'affichage direct */}
        <button
          onClick={onForceDirect}
          style={{
            width: '100%',
            padding: '9px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#94a3b8',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>Forcer le chargement direct quand même</span>
        </button>
      </div>

      <div style={{ marginTop: '24px', fontSize: '11px', color: '#64748b' }}>
        Astuce : Les sites comme Wikipédia, OpenStreetMap, les jeux en ligne et les archives s'affichent directement sans restriction.
      </div>
    </div>
  );
};

export default BrowserApp;
