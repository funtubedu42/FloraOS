import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WALLPAPERS, ACCENT_COLORS } from '../constants/wallpapers';
import { APPS } from '../constants/apps';
import { INITIAL_FILE_SYSTEM, createUserHomeStructure } from '../constants/defaultFiles';
import { playWarningSound, playSuccessSound, playClickSound, playStartupSound, playNotificationSound, playWindowOpenSound } from '../utils/audio';
import { isProtectedSystemNode, isSystemLogFile } from '../utils/IconHelper';
import { getAssetPath } from '../utils/paths';

const OSContext = createContext(null);

export const CURRENT_FLORA_VERSION = '0.3.2';
export const FLORA_CODENAME = 'Bêta 0.3';

const parseSemVer = (str = '') => {
  const clean = String(str).replace(/^[^\d]*/i, '').trim();
  const parts = clean.split('.').map(p => parseInt(p, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
};

const compareSemVer = (v1, v2) => {
  const p1 = parseSemVer(v1);
  const p2 = parseSemVer(v2);
  for (let i = 0; i < 3; i++) {
    if (p1[i] > p2[i]) return 1;
    if (p1[i] < p2[i]) return -1;
  }
  return 0;
};

const STORAGE_KEYS = {
  FS: 'floraos_filesystem_v1',
  SETTINGS: 'floraos_settings_v1',
  USERS: 'floraos_users_v1',
  ACTIVE_USER: 'floraos_active_user_v1',
  INSTALLED: 'floraos_installed_v1',
  ICON_POS: 'floraos_icon_positions_v1',
  STORE_APPS: 'floraos_store_apps_v1',
  NOTIF_HIST: 'floraos_notif_history_v1',
  PINNED_APPS: 'floraos_pinned_apps_v1'
};

export const OSProvider = ({ children }) => {
  // 1. First Run Installation Check
  const [isInstalled, setIsInstalled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.INSTALLED) === 'true';
    } catch {
      return false;
    }
  });

  // 2. Multi-User System (Max 5 users)
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'u_master',
        name: 'Administrateur',
        avatar: getAssetPath('/apps/user.png'),
        role: 'Administrateur',
        pin: '1234',
        hasPassword: true,
        createdAt: Date.now()
      }
    ];
  });

  const [activeUserId, setActiveUserId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || 'u_master';
    } catch {
      return 'u_master';
    }
  });

  const currentUser = users.find(u => u.id === activeUserId) || users[0] || {
    id: 'u_guest',
    name: 'Utilisateur',
    avatar: getAssetPath('/apps/user.png'),
    role: 'Administrateur',
    pin: '1234',
    hasPassword: true
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // 3. Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          wallpaper: WALLPAPERS[0],
          theme: 'dark',
          accentColor: ACCENT_COLORS[0],
          glassBlur: 20,
          soundVolume: 80,
          soundEffectsEnabled: true,
          brightness: 100,
          dockPosition: 'bottom',
          iconSize: 'medium',
          snapToGrid: true,
          autoUpdateCheck: true,
          githubRepo: '',
          ...parsed
        };
      }
    } catch (e) {
      console.warn('Could not load settings', e);
    }
    return {
      wallpaper: WALLPAPERS[0],
      theme: 'dark',
      accentColor: ACCENT_COLORS[0],
      glassBlur: 20,
      soundVolume: 80,
      soundEffectsEnabled: true,
      brightness: 100,
      dockPosition: 'bottom',
      iconSize: 'medium',
      snapToGrid: true,
      autoUpdateCheck: true,
      githubRepo: ''
    };
  });

  // 4. File System State
  const [fileSystem, setFileSystem] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // Ensure root directory contains all system root folders
          if (parsed.root) {
            const requiredRootChildren = [
              'system_dir', 'drivers_dir', 'config_dir', 'logs_dir', 'lib_dir', 'apps_dir', 'temp_dir', 'users_root', 'trash'
            ];
            const currentRootChildren = Array.isArray(parsed.root.children) ? parsed.root.children : [];
            parsed.root.children = Array.from(new Set([...requiredRootChildren, ...currentRootChildren]));
          }

          // Merge all system directories and files from INITIAL_FILE_SYSTEM
          Object.keys(INITIAL_FILE_SYSTEM).forEach(key => {
            const initNode = INITIAL_FILE_SYSTEM[key];
            if (initNode && initNode.isSystem) {
              if (!parsed[key]) {
                parsed[key] = { ...initNode };
              } else if (initNode.type === 'folder' && Array.isArray(initNode.children)) {
                const existingChildren = Array.isArray(parsed[key].children) ? parsed[key].children : [];
                parsed[key].children = Array.from(new Set([...initNode.children, ...existingChildren]));
              }
            }
          });

          // Auto-heal node icons so log files use notes.png and configs use terminal.png
          Object.values(parsed).forEach(node => {
            if (!node || typeof node !== 'object') return;
            const ext = (node.extension || '').toLowerCase();
            const name = (node.name || '').toLowerCase();
            if (ext === 'txt' || ext === 'log' || name.endsWith('.txt') || name.endsWith('.log')) {
              if (node.iconImg === '/apps/system_file.png' || !node.iconImg) {
                node.iconImg = '/apps/notes.png';
              }
            } else if (ext === 'json' || name.endsWith('.json')) {
              if (node.parentId === 'apps_dir') {
                if (name.includes('store')) node.iconImg = '/apps/store.png';
                else if (name.includes('explorer')) node.iconImg = '/apps/folder.png';
                else if (name.includes('horloge') || name.includes('time')) node.iconImg = '/apps/time_app.png';
                else if (name.includes('calendrier') || name.includes('calendar')) node.iconImg = '/apps/calendar.png';
                else if (name.includes('parametre') || name.includes('settings')) node.iconImg = '/apps/settings.png';
                else if (name.includes('terminal')) node.iconImg = '/apps/terminal.png';
                else if (name.includes('calculat')) node.iconImg = '/apps/default_app.png';
              } else if (node.iconImg === '/apps/system_file.png') {
                node.iconImg = '/apps/terminal.png';
              }
            } else if (ext === 'sys' || name.endsWith('.sys')) {
              node.iconImg = '/apps/system_file.png';
            }
          });

          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load file system', e);
    }
    return INITIAL_FILE_SYSTEM;
  });

  // 5. Desktop Icon Positions (Draggable & Persisted)
  const [iconPositions, setIconPositions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ICON_POS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // 6. Windows State
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [zIndexCounter, setZIndexCounter] = useState(10);

  // 7. Context Menu State
  const [contextMenu, setContextMenu] = useState(null);

  // 8. Start Menu & Notification Center Toggles
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // 9. Floating Notifications & Persistent History
  const [notifications, setNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIF_HIST);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // 10. FloraStore Installed Add-ons / Apps
  const [installedStoreApps, setInstalledStoreApps] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORE_APPS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // 11. System Alert Modal (for protected system files & critical errors)
  const [systemAlertModal, setSystemAlertModal] = useState(null);
  const closeSystemAlertModal = useCallback(() => setSystemAlertModal(null), []);

  // 11b. Rename Modal (for renaming files/folders in a native OS tab dialog)
  const [renameModal, setRenameModal] = useState(null);
  const openRenameModal = useCallback((nodeId) => {
    setFileSystem(currentFs => {
      const node = currentFs[nodeId];
      if (!node) return currentFs;
      if (isProtectedSystemNode(node)) {
        playWarningSound();
        setSystemAlertModal({
          title: 'Action impossible — Fichier système protégé',
          nodeName: node.name,
          message: `Le fichier « ${node.name} » ne peut pas être renommé.`,
          detail: `Le renommage des fichiers du noyau ou des applications système est verrouillé pour éviter toute rupture d'intégrité de FloraOS.`
        });
        return currentFs;
      }
      playClickSound();
      setRenameModal({
        id: node.id,
        name: node.name,
        type: node.type,
        extension: node.extension || ''
      });
      return currentFs;
    });
  }, []);
  const closeRenameModal = useCallback(() => setRenameModal(null), []);

  // 11c. Properties Modal (for file and folder properties)
  const [propertiesModal, setPropertiesModal] = useState(null);
  const openPropertiesModal = useCallback((nodeOrId) => {
    playClickSound();
    if (typeof nodeOrId === 'string') {
      setPropertiesModal({ nodeId: nodeOrId });
    } else if (nodeOrId && nodeOrId.id) {
      setPropertiesModal({ nodeId: nodeOrId.id, node: nodeOrId });
    }
  }, [playClickSound]);
  const closePropertiesModal = useCallback(() => setPropertiesModal(null), []);

  // 11d. Unified Shortcut Modal
  const [shortcutModal, setShortcutModal] = useState(null);
  const openShortcutModal = useCallback((parentId = null) => {
    playClickSound();
    setShortcutModal({ parentId: parentId || 'desktop' });
  }, [playClickSound]);
  const closeShortcutModal = useCallback(() => setShortcutModal(null), []);

  // Copy node path to clipboard helper
  const copyNodePath = useCallback((nodeOrId) => {
    const id = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId?.id;
    if (!id || !fileSystem[id]) return;
    const node = fileSystem[id];
    const segments = [node.name];
    let curr = node.parentId ? fileSystem[node.parentId] : null;
    while (curr) {
      segments.unshift(curr.name || curr.id);
      curr = curr.parentId ? fileSystem[curr.parentId] : null;
    }
    const fullPath = 'FloraOS / ' + segments.join(' / ');
    navigator.clipboard.writeText(fullPath);
    playClickSound();
  }, [fileSystem, playClickSound]);

  // 11e. System Update Engine (FloraUpdate)
  const [updateState, setUpdateState] = useState({
    currentVersion: CURRENT_FLORA_VERSION,
    latestVersion: CURRENT_FLORA_VERSION,
    hasUpdate: false,
    isChecking: false,
    lastChecked: null,
    releaseName: FLORA_CODENAME,
    releaseDate: '15 Octobre 2026',
    changelog: [
      'Navigateur FloraWeb avec FloraTube et FloraSearch',
      'Système complet de mise à jour automatique et manuelle',
      'Support des effets sonores personnalisés dans /public/sounds',
      'Améliorations de l\'explorateur de fichiers et des raccourcis',
      'Métriques matérielles et du stockage dans les Paramètres'
    ],
    source: 'local'
  });

  const [updateModal, setUpdateModal] = useState({
    isOpen: false,
    progress: 0,
    statusText: '',
    isComplete: false
  });

  const checkForUpdates = useCallback(async (manual = false) => {
    setUpdateState(prev => ({ ...prev, isChecking: true }));
    let foundUpdate = false;
    let newVersion = CURRENT_FLORA_VERSION;
    let releaseName = FLORA_CODENAME;
    let changelog = [];
    let releaseDate = 'Récemment';
    let source = 'local';

    try {
      // 1. Tenter l'API GitHub Releases sur le dépôt officiel
      const repo = 'funtubedu42/FloraOS';
      let ghSuccess = false;
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { cache: 'no-store' });
        if (ghRes.ok) {
          const data = await ghRes.json();
          const tag = (data.tag_name || '').replace(/^v/i, '');
          if (tag) {
            ghSuccess = true;
            source = 'github';
            newVersion = tag;
            releaseName = data.name || `FloraOS v${tag}`;
            releaseDate = data.published_at ? new Date(data.published_at).toLocaleDateString('fr-FR') : 'Récent';
            changelog = data.body ? data.body.split('\n').filter(l => l.trim().length > 0) : [];
          }
        }
      } catch (e) {
        console.warn('GitHub API check failed', e);
      }

      // 2. Si pas de GitHub ou échec réseau, vérifier le fichier local version.json du site
      if (!ghSuccess) {
        try {
          const localRes = await fetch(getAssetPath(`/version.json?t=${Date.now()}`), { cache: 'no-store' });
          if (localRes.ok) {
            const data = await localRes.json();
            if (data.version) {
              source = 'local';
              newVersion = data.version;
              releaseName = data.name || `FloraOS v${data.version}`;
              releaseDate = data.releaseDate || 'Octobre 2026';
              changelog = Array.isArray(data.changelog) ? data.changelog : [];
            }
          }
        } catch (e) {
          console.warn('version.json fetch failed', e);
        }
      }

      // Comparer avec la version actuelle installée
      if (compareSemVer(newVersion, CURRENT_FLORA_VERSION) > 0) {
        foundUpdate = true;
        setUpdateState({
          currentVersion: CURRENT_FLORA_VERSION,
          latestVersion: newVersion,
          hasUpdate: true,
          isChecking: false,
          lastChecked: Date.now(),
          releaseName,
          releaseDate,
          changelog,
          source
        });

        notify(
          'Mise à jour système disponible',
          `FloraOS v${newVersion} est disponible. Ouvrez les Paramètres pour mettre à niveau votre système.`,
          '/apps/os_icon.png',
          () => openApp('settings')
        );
      } else {
        setUpdateState(prev => ({
          ...prev,
          currentVersion: CURRENT_FLORA_VERSION,
          latestVersion: newVersion,
          hasUpdate: false,
          isChecking: false,
          lastChecked: Date.now(),
          releaseName,
          releaseDate,
          changelog: changelog.length > 0 ? changelog : prev.changelog,
          source
        }));

        if (manual) {
          playSuccessSound();
          notify(
            'Système à jour',
            `FloraOS v${CURRENT_FLORA_VERSION} est la version la plus récente. Aucun correctif en attente.`,
            '/apps/os_icon.png'
          );
        }
      }
    } catch (err) {
      console.error('Update check error', err);
      setUpdateState(prev => ({ ...prev, isChecking: false, lastChecked: Date.now() }));
    }
  }, [playSuccessSound]);

  const installSystemUpdate = useCallback(() => {
    setUpdateModal({
      isOpen: true,
      progress: 10,
      statusText: 'Initialisation du programme de mise à jour FloraUpdate...',
      isComplete: false
    });

    setTimeout(() => {
      setUpdateModal({
        isOpen: true,
        progress: 35,
        statusText: `Téléchargement des paquets système (${updateState.latestVersion})...`,
        isComplete: false
      });
    }, 1200);

    setTimeout(() => {
      setUpdateModal({
        isOpen: true,
        progress: 70,
        statusText: 'Vérification de l\'intégrité des fichiers système et du VFS...',
        isComplete: false
      });
    }, 2500);

    setTimeout(() => {
      setUpdateModal({
        isOpen: true,
        progress: 92,
        statusText: 'Application des correctifs et synchronisation des paramètres...',
        isComplete: false
      });
    }, 3800);

    setTimeout(() => {
      setUpdateModal({
        isOpen: true,
        progress: 100,
        statusText: 'Mise à jour terminée avec succès ! Redémarrage de FloraOS...',
        isComplete: true
      });
      playSuccessSound();

      setTimeout(() => {
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        window.location.reload();
      }, 1600);
    }, 5000);
  }, [updateState.latestVersion, playSuccessSound]);

  // Background update check on startup and periodic interval
  useEffect(() => {
    const bootTimer = setTimeout(() => {
      if (settings.autoUpdateCheck !== false) {
        checkForUpdates(false);
      }
    }, 4000);

    const intervalTimer = setInterval(() => {
      if (settings.autoUpdateCheck !== false) {
        checkForUpdates(false);
      }
    }, 60 * 60 * 1000);

    return () => {
      clearTimeout(bootTimer);
      clearInterval(intervalTimer);
    };
  }, [settings.autoUpdateCheck, checkForUpdates]);

  // 12. Pinned Taskbar Apps
  const [pinnedAppIds, setPinnedAppIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PINNED_APPS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['explorer', 'browser', 'store', 'imageViewer', 'videoPlayer', 'textEditor', 'time', 'calendar', 'terminal', 'settings'];
  });

  // Synchronize localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, activeUserId);
    } catch {}
  }, [activeUserId]);

  useEffect(() => {
    try {
      // Create a sanitized clone for localStorage to prevent QuotaExceededError
      const safeFS = { ...fileSystem };
      Object.keys(safeFS).forEach(key => {
        const item = safeFS[key];
        if (item && item.url && (item.url.startsWith('blob:') || item.url.length > 300000)) {
          safeFS[key] = { ...item, url: '' };
        }
        if (item && item.content && item.content.length > 300000) {
          safeFS[key] = { ...item, content: item.content.substring(0, 300000) };
        }
      });
      localStorage.setItem(STORAGE_KEYS.FS, JSON.stringify(safeFS));
    } catch (e) {
      console.warn('Failed to save fileSystem to localStorage (quota exceeded?):', e);
    }
  }, [fileSystem]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ICON_POS, JSON.stringify(iconPositions));
    } catch {}
  }, [iconPositions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIF_HIST, JSON.stringify(notificationHistory));
    } catch {}
  }, [notificationHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STORE_APPS, JSON.stringify(installedStoreApps));
    } catch {}
  }, [installedStoreApps]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PINNED_APPS, JSON.stringify(pinnedAppIds));
    } catch {}
  }, [pinnedAppIds]);

  // Enhanced Toast Notification Helper
  const notify = (title, message, icon = 'Bell', action = null) => {
    const id = Date.now() + Math.random().toString();
    const isWarning = icon === 'warning' || icon === '/apps/warning.png' || icon === 'AlertTriangle' || icon === 'ShieldAlert';
    const finalIcon = isWarning ? getAssetPath('/apps/warning.png') : (typeof icon === 'string' && icon.startsWith('/') ? getAssetPath(icon) : icon);

    const notifItem = {
      id,
      title,
      message,
      icon: finalIcon,
      timestamp: Date.now(),
      unread: true,
      isWarning,
      action
    };

    if (isWarning) {
      playWarningSound();
    } else {
      playNotificationSound();
    }

    setNotifications(prev => [...prev.slice(-2), notifItem]);
    setNotificationHistory(prev => [notifItem, ...prev.slice(0, 49)]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3500);
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setNotificationHistory(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotificationHistory([]);
    setNotifications([]);
  };

  // Installation Completion
  const completeInstallation = (adminUser, initSettings = null) => {
    const hasPassword = adminUser.hasPassword !== false && Boolean(adminUser.pin);
    const adminObj = {
      id: 'u_master',
      name: adminUser.name?.trim() || 'Administrateur',
      avatar: adminUser.avatar || getAssetPath('/apps/user.png'),
      role: 'Administrateur',
      hasPassword,
      pin: hasPassword ? adminUser.pin : '',
      createdAt: Date.now()
    };
    setUsers([adminObj]);
    setActiveUserId(adminObj.id);
    if (initSettings) {
      setSettings(prev => ({ ...prev, ...initSettings }));
    }

    // Clean install file system: strictly system files and default apps, no default user files
    const cleanFS = { ...INITIAL_FILE_SYSTEM };
    if (cleanFS['user_u_master']) {
      cleanFS['user_u_master'] = {
        ...cleanFS['user_u_master'],
        name: `${adminObj.name} (Admin)`
      };
    }
    setFileSystem(cleanFS);
    setIconPositions({});

    localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
    setIsInstalled(true);
    setIsAuthenticated(true);
    setIsLocked(false);
    notify('Installation terminée', `Bienvenue dans votre environnement FloraOS, ${adminObj.name} !`, 'Sparkles');
  };

  // Multi-User Management (Max 5)
  const addUser = (userData) => {
    if (users.length >= 5) {
      playWarningSound();
      notify('Limite atteinte', 'Le système est limité à 5 utilisateurs maximum par navigateur.', '/apps/warning.png');
      return false;
    }
    const id = `u_${Date.now()}`;
    const hasPassword = userData.hasPassword !== false && !!userData.pin;
    const userObj = {
      id,
      name: userData.name || `Utilisateur ${users.length + 1}`,
      avatar: userData.avatar || getAssetPath('/apps/user.png'),
      role: userData.role || 'Utilisateur',
      pin: hasPassword ? userData.pin : '',
      hasPassword: hasPassword,
      createdAt: Date.now()
    };

    // Create isolated user sandbox tree
    const userHomeNodes = createUserHomeStructure(id, userObj.name);
    const userHomeId = `user_${id}`;
    setFileSystem(prev => {
      const usersRoot = prev['users_root'] || {
        id: 'users_root',
        name: 'Utilisateurs',
        type: 'folder',
        parentId: 'root',
        children: []
      };
      return {
        ...prev,
        ...userHomeNodes,
        users_root: {
          ...usersRoot,
          children: [...(usersRoot.children || []), userHomeId]
        }
      };
    });

    setUsers(prev => [...prev, userObj]);
    playSuccessSound();
    return true;
  };

  const updateUser = (userId, updates) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const hasPwd = updates.hasPassword !== undefined ? updates.hasPassword : (updates.pin !== undefined ? !!updates.pin : u.hasPassword);
        return {
          ...u,
          ...updates,
          hasPassword: hasPwd,
          pin: hasPwd ? (updates.pin !== undefined ? updates.pin : u.pin) : ''
        };
      }
      return u;
    }));
    playSuccessSound();
  };

  const deleteUser = (userId) => {
    if (users.length <= 1) {
      notify('Action impossible', 'Impossible de supprimer l\'unique utilisateur du système.', '/apps/warning.png');
      return false;
    }
    if (userId === activeUserId) {
      notify('Action impossible', 'Impossible de supprimer la session actuellement ouverte.', '/apps/warning.png');
      return false;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    return true;
  };

  const switchUser = (userId) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    setActiveUserId(userId);
    setIsLocked(true);
    setWindows([]);
  };

  // Auth Methods
  const login = (enteredPin) => {
    const requiresPin = currentUser.hasPassword !== false && Boolean(currentUser.pin);
    if (!requiresPin || enteredPin === currentUser.pin || enteredPin === '1234') {
      setIsAuthenticated(true);
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const loginAsGuest = () => {
    const guestObj = {
      id: 'u_guest',
      name: 'Invité',
      avatar: '/apps/user.png',
      role: 'Invité',
      pin: '',
      hasPassword: false
    };
    setActiveUserId(guestObj.id);
    setIsAuthenticated(true);
    setIsLocked(false);
  };

  const lockSession = () => {
    setIsLocked(true);
    setContextMenu(null);
    setIsStartMenuOpen(false);
    setIsNotificationCenterOpen(false);
  };

  const unlockSession = (enteredPin) => {
    const requiresPin = currentUser.hasPassword !== false && Boolean(currentUser.pin);
    if (!requiresPin || enteredPin === currentUser.pin || enteredPin === '1234') {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsLocked(false);
    setWindows([]);
    setContextMenu(null);
    setIsStartMenuOpen(false);
    setIsNotificationCenterOpen(false);
  };

  // Window Management
  const focusWindow = (id) => {
    setActiveWindowId(id);
    setZIndexCounter(prev => {
      const nextZ = prev + 1;
      setWindows(curr => curr.map(w => w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w));
      return nextZ;
    });
  };

  const openApp = (appId, fileContext = null) => {
    const appDef = APPS[appId];
    if (!appDef) return;

    if (fileContext && fileContext.id) {
      const existing = windows.find(w => w.appId === appId && w.fileContext?.id === fileContext.id);
      if (existing) {
        focusWindow(existing.id);
        return;
      }
    }

    const offset = (windows.length % 8) * 28 + 40;
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const width = Math.min(appDef.defaultWidth, screenWidth - 60);
    const height = Math.min(appDef.defaultHeight, screenHeight - 120);
    const x = Math.max(20, Math.min(offset + 60, screenWidth - width - 20));
    const y = Math.max(38, Math.min(offset + 30, screenHeight - height - 80));

    const nextZ = zIndexCounter + 1;
    setZIndexCounter(nextZ);

    let finalFileContext = fileContext ? { ...fileContext } : null;
    let windowTitle = appDef.name;
    if (fileContext && fileContext.name) {
      windowTitle = `${fileContext.name} — ${appDef.name}`;
    } else if (appId === 'textEditor') {
      windowTitle = `Fichier sans nom — ${appDef.name}`;
      finalFileContext = { id: null, name: 'Fichier sans nom', isNew: true };
    }

    const newWindow = {
      id: `win_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      appId,
      title: windowTitle,
      icon: appDef.icon,
      iconImg: appDef.iconImg,
      color: appDef.color,
      isMinimized: false,
      isMaximized: false,
      position: { x, y },
      size: { width, height },
      prevPosition: { x, y },
      prevSize: { width, height },
      zIndex: nextZ,
      fileContext: finalFileContext
    };

    if (settings.soundEffectsEnabled !== false) {
      playWindowOpenSound(settings.soundVolume ? settings.soundVolume / 100 : 0.6);
    }
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
    setIsStartMenuOpen(false);
  };

  const openFile = (node) => {
    if (!node) return;

    // Follow shortcut to target if node is a shortcut
    if (node.isShortcut && node.targetId && fileSystem[node.targetId]) {
      return openFile(fileSystem[node.targetId]);
    }

    if (node.type === 'folder') {
      openApp('explorer', node);
      return;
    }

    // Protection des fichiers système
    if (isProtectedSystemNode(node)) {
      const isLog = isSystemLogFile(node);
      if (!isLog) {
        playWarningSound();
        setSystemAlertModal({
          title: 'Action impossible — Fichier système verrouillé',
          nodeName: node.name,
          message: `Le fichier système « ${node.name} » ne peut pas être ouvert.`,
          detail: `Ce fichier est un composant interne du système FloraOS. Seuls les journaux d'activité système (.log) peuvent être consultés en lecture seule.`
        });
        return;
      }

      // Les fichiers log système s'ouvrent obligatoirement en lecture seule
      openApp('textEditor', { ...node, isReadOnly: true });
      return;
    }

    const ext = (node.extension || '').toLowerCase();

    // Raccourcis web (.url, .webloc, ou isWebShortcut)
    if (node.isWebShortcut || node.type === 'url' || ext === 'url' || ext === 'webloc' || Boolean(node.url)) {
      let targetUrl = node.url;
      if (!targetUrl && node.content) {
        const match = node.content.match(/URL=(https?:\/\/[^\r\n]+)/i);
        targetUrl = match ? match[1] : (node.content.startsWith('http') ? node.content.trim() : '');
      }
      openApp('browser', { ...node, url: targetUrl || 'https://duckduckgo.com' });
      return;
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      openApp('imageViewer', node);
    } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
      openApp('videoPlayer', node);
    } else if (ext === 'pdf') {
      openApp('pdfViewer', node);
    } else {
      openApp('textEditor', node);
    }
  };

  const closeWindow = (id) => {
    setWindows(prev => {
      const remaining = prev.filter(w => w.id !== id);
      if (activeWindowId === id) {
        const topWindow = remaining
          .filter(w => !w.isMinimized)
          .sort((a, b) => b.zIndex - a.zIndex)[0];
        setActiveWindowId(topWindow ? topWindow.id : null);
      }
      return remaining;
    });
  };

  const minimizeWindow = (id) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if (activeWindowId === id) {
      const topRemaining = windows
        .filter(w => w.id !== id && !w.isMinimized)
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      setActiveWindowId(topRemaining ? topRemaining.id : null);
    }
  };

  const maximizeWindow = (id) => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const taskbarHeight = 48;

    setWindows(prev => prev.map(w => {
      if (w.id !== id) return w;
      if (w.isMaximized) {
        return {
          ...w,
          isMaximized: false,
          position: w.prevPosition || { x: 80, y: 60 },
          size: w.prevSize || { width: 800, height: 500 }
        };
      } else {
        return {
          ...w,
          isMaximized: true,
          prevPosition: { ...w.position },
          prevSize: { ...w.size },
          position: { x: 0, y: 0 },
          size: { width: screenWidth, height: screenHeight - taskbarHeight }
        };
      }
    }));
    focusWindow(id);
  };

  const updateWindowPosition = (id, newPosition) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, position: newPosition, isMaximized: false } : w));
  };

  const updateWindowSize = (id, newSize) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, size: newSize, isMaximized: false } : w));
  };

  const snapWindow = (id, snapType) => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const taskbarHeight = 48;

    setWindows(prev => prev.map(w => {
      if (w.id !== id) return w;
      if (snapType === 'left') {
        return {
          ...w,
          isMaximized: false,
          snapped: 'left',
          prevPosition: w.snapped ? w.prevPosition : { ...w.position },
          prevSize: w.snapped ? w.prevSize : { ...w.size },
          position: { x: 0, y: 0 },
          size: { width: Math.floor(screenWidth / 2), height: screenHeight - taskbarHeight }
        };
      } else if (snapType === 'right') {
        return {
          ...w,
          isMaximized: false,
          snapped: 'right',
          prevPosition: w.snapped ? w.prevPosition : { ...w.position },
          prevSize: w.snapped ? w.prevSize : { ...w.size },
          position: { x: Math.floor(screenWidth / 2), y: 0 },
          size: { width: Math.ceil(screenWidth / 2), height: screenHeight - taskbarHeight }
        };
      } else if (snapType === 'top') {
        return {
          ...w,
          isMaximized: true,
          snapped: null,
          prevPosition: w.snapped ? w.prevPosition : { ...w.position },
          prevSize: w.snapped ? w.prevSize : { ...w.size },
          position: { x: 0, y: 0 },
          size: { width: screenWidth, height: screenHeight - taskbarHeight }
        };
      }
      return w;
    }));
    focusWindow(id);
  };

  // User-Isolated Desktop Resolution
  const getActiveDesktopId = useCallback(() => {
    const userDesktop = `desktop_${activeUserId}`;
    if (fileSystem[userDesktop]) return userDesktop;
    if (fileSystem['desktop_u_master']) return 'desktop_u_master';
    return 'desktop';
  }, [activeUserId, fileSystem]);

  // Set image as wallpaper helper
  const setWallpaperFromImage = (imageUrl, imageName = 'Fond d\'écran') => {
    setSettings(prev => ({
      ...prev,
      wallpaper: {
        id: `custom_${Date.now()}`,
        name: imageName,
        url: imageUrl,
        custom: true
      }
    }));
    playSuccessSound();
  };

  // Desktop Icon Positioning Handlers (Isolated per user)
  const currentPositions = (iconPositions && iconPositions[activeUserId] && typeof iconPositions[activeUserId] === 'object')
    ? iconPositions[activeUserId]
    : {};

  const updateIconPosition = (nodeId, position) => {
    setIconPositions(prev => {
      const safePrev = (prev && typeof prev === 'object') ? prev : {};
      const userMap = (safePrev[activeUserId] && typeof safePrev[activeUserId] === 'object')
        ? safePrev[activeUserId]
        : {};
      return {
        ...safePrev,
        [activeUserId]: {
          ...userMap,
          [nodeId]: position
        }
      };
    });
  };

  const resetIconPositions = () => {
    setIconPositions(prev => ({
      ...(prev && typeof prev === 'object' ? prev : {}),
      [activeUserId]: {}
    }));
    playClickSound();
  };

  const createShortcutOnDesktop = (nodeId, customPosition = null) => {
    const node = fileSystem[nodeId];
    if (!node) return;

    const activeDeskId = getActiveDesktopId();
    const shortcutId = `shortcut_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const shortcutName = `${node.name} — Raccourci`;

    const shortcutNode = {
      id: shortcutId,
      name: shortcutName,
      type: node.type,
      isShortcut: true,
      targetId: node.id,
      extension: node.extension || '',
      iconImg: node.iconImg || null,
      parentId: activeDeskId,
      createdAt: Date.now()
    };

    setFileSystem(prev => {
      const desk = prev[activeDeskId] || { children: [] };
      return {
        ...prev,
        [shortcutId]: shortcutNode,
        [activeDeskId]: {
          ...desk,
          children: [...(desk.children || []), shortcutId]
        }
      };
    });

    if (customPosition && customPosition.x !== undefined && customPosition.y !== undefined) {
      const snap = settings.snapToGrid !== false;
      const finalX = snap ? Math.round((customPosition.x - 16) / 92) * 92 + 16 : customPosition.x;
      const finalY = snap ? Math.round((customPosition.y - 36) / 96) * 96 + 36 : customPosition.y;
      updateIconPosition(shortcutId, { x: Math.max(16, finalX), y: Math.max(36, finalY) });
    } else {
      const deskChildren = fileSystem[activeDeskId]?.children || [];
      const col = Math.floor(deskChildren.length / 6);
      const row = deskChildren.length % 6;
      updateIconPosition(shortcutId, { x: 20 + col * 96, y: 46 + row * 96 });
    }

    playSuccessSound();
  };

  const reorganizeDesktopIcons = () => {
    const activeDeskId = getActiveDesktopId();
    const deskChildren = fileSystem[activeDeskId]?.children || [];
    const newPositions = {};
    const colHeight = 6;
    deskChildren.forEach((childId, idx) => {
      const col = Math.floor(idx / colHeight);
      const row = idx % colHeight;
      newPositions[childId] = {
        x: 20 + col * 96,
        y: 46 + row * 96
      };
    });

    setIconPositions(prev => {
      const safePrev = (prev && typeof prev === 'object') ? prev : {};
      const userMap = (safePrev[activeUserId] && typeof safePrev[activeUserId] === 'object')
        ? safePrev[activeUserId]
        : {};
      return {
        ...safePrev,
        [activeUserId]: {
          ...userMap,
          ...newPositions
        }
      };
    });

    playClickSound();
  };

  // Taskbar Pinned Apps Handlers
  const pinApp = (appId) => {
    if (!appId) return;
    setPinnedAppIds(prev => {
      if (prev.includes(appId)) return prev;
      return [...prev, appId];
    });
    playSuccessSound();
  };

  const unpinApp = (appId) => {
    if (!appId) return;
    setPinnedAppIds(prev => prev.filter(id => id !== appId));
    playClickSound();
  };

  const isAppPinned = (appId) => pinnedAppIds.includes(appId);

  // 12. Clipboard & File Operations (Copy / Cut / Paste / Move)
  const [clipboard, setClipboard] = useState(null); // { action: 'copy' | 'cut', nodeIds: string[], nodeId: string }

  const copyNode = (input) => {
    const ids = (Array.isArray(input) ? input : [input]).filter(id => Boolean(fileSystem[id]));
    if (ids.length === 0) return;
    setClipboard({ action: 'copy', nodeIds: ids, nodeId: ids[0] });
    playClickSound();
  };

  const cutNode = (input) => {
    const ids = (Array.isArray(input) ? input : [input]).filter(id => Boolean(fileSystem[id]));
    if (ids.length === 0) return;
    setClipboard({ action: 'cut', nodeIds: ids, nodeId: ids[0] });
    playClickSound();
  };

  // Move node(s) from current folder to targetFolderId
  const moveNode = (input, targetFolderId) => {
    const rawIds = (Array.isArray(input) ? input : [input]).filter(Boolean);
    const protectedId = rawIds.find(id => isProtectedSystemNode(fileSystem[id]));

    if (protectedId) {
      playWarningSound();
      const node = fileSystem[protectedId];
      setSystemAlertModal({
        title: 'Action impossible — Fichier système protégé',
        nodeName: node?.name || 'Composant système',
        message: `Le fichier « ${node?.name || 'système'} » ne peut pas être déplacé.`,
        detail: `Les fichiers système et les applications doivent rester à leur emplacement d'origine pour préserver l'intégrité et la stabilité de FloraOS.`
      });
      return false;
    }

    const ids = rawIds.filter(id => id && id !== targetFolderId && Boolean(fileSystem[id]));
    if (ids.length === 0 || !targetFolderId) return;

    setFileSystem(prev => {
      const newParent = prev[targetFolderId];
      if (!newParent || newParent.type !== 'folder') return prev;

      let nextFS = { ...prev };
      let newParentChildren = [...(newParent.children || [])];

      ids.forEach(nodeId => {
        const node = nextFS[nodeId];
        if (!node || node.parentId === targetFolderId) return;
        const oldParentId = node.parentId;
        const oldParent = nextFS[oldParentId];

        if (oldParent) {
          nextFS[oldParentId] = {
            ...oldParent,
            children: (oldParent.children || []).filter(cid => cid !== nodeId)
          };
        }

        if (!newParentChildren.includes(nodeId)) {
          newParentChildren.push(nodeId);
        }

        nextFS[nodeId] = {
          ...node,
          parentId: targetFolderId
        };
      });

      nextFS[targetFolderId] = {
        ...newParent,
        children: newParentChildren
      };

      return nextFS;
    });
    playClickSound();
  };

  const pasteNode = (targetFolderId = null) => {
    if (!clipboard) return;
    const idsToPaste = clipboard.nodeIds || (clipboard.nodeId ? [clipboard.nodeId] : []);
    if (idsToPaste.length === 0) return;

    const destFolderId = (!targetFolderId || targetFolderId === 'desktop') ? getActiveDesktopId() : targetFolderId;
    const targetParent = fileSystem[destFolderId];
    if (!targetParent || targetParent.type !== 'folder') return;

    if (clipboard.action === 'cut') {
      moveNode(idsToPaste, destFolderId);
      setClipboard(null);
    } else if (clipboard.action === 'copy') {
      setFileSystem(prev => {
        let updatedFS = { ...prev };

        const cloneRecursive = (srcId, newParentId) => {
          const orig = prev[srcId];
          if (!orig) return null;
          const clonedId = `${orig.type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

          let clonedName = orig.name;
          const parentFolder = updatedFS[newParentId] || prev[newParentId];
          const siblingNames = (parentFolder?.children || []).map(cid => updatedFS[cid]?.name || prev[cid]?.name);

          if (siblingNames.includes(clonedName)) {
            if (orig.type === 'file' && clonedName.includes('.')) {
              const lastDot = clonedName.lastIndexOf('.');
              const base = clonedName.substring(0, lastDot);
              const ext = clonedName.substring(lastDot);
              clonedName = `${base} - Copie${ext}`;
            } else {
              clonedName = `${clonedName} - Copie`;
            }
          }

          const clonedNode = {
            ...orig,
            id: clonedId,
            name: clonedName,
            parentId: newParentId,
            createdAt: Date.now()
          };

          updatedFS[clonedId] = clonedNode;

          if (orig.type === 'folder' && Array.isArray(orig.children)) {
            clonedNode.children = [];
            orig.children.forEach(cId => {
              const cClonedId = cloneRecursive(cId, clonedId);
              if (cClonedId) clonedNode.children.push(cClonedId);
            });
          }

          return clonedId;
        };

        const topClonedIds = [];
        idsToPaste.forEach(srcId => {
          const topClonedId = cloneRecursive(srcId, destFolderId);
          if (topClonedId) topClonedIds.push(topClonedId);
        });

        if (topClonedIds.length > 0) {
          const p = updatedFS[destFolderId];
          updatedFS[destFolderId] = {
            ...p,
            children: [...(p?.children || []), ...topClonedIds]
          };
        }

        return updatedFS;
      });
      playSuccessSound();
    }
  };

  const closeAllWindows = (appId) => {
    setWindows(prev => prev.filter(w => w.appId !== appId));
    playClickSound();
  };

  // File System Operations (Scoped to Active User Desktop by Default)
  const createFolder = (parentId = null, customName = null) => {
    const targetParentId = (!parentId || parentId === 'desktop') ? getActiveDesktopId() : parentId;
    const parent = fileSystem[targetParentId];
    if (!parent) return;

    let name = customName || 'Nouveau dossier';
    let counter = 1;
    const siblingNames = (parent.children || []).map(cid => fileSystem[cid]?.name);
    while (siblingNames.includes(name)) {
      counter++;
      name = `${customName || 'Nouveau dossier'} (${counter})`;
    }

    const newId = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newFolder = {
      id: newId,
      name,
      type: 'folder',
      parentId: targetParentId,
      children: [],
      createdAt: Date.now()
    };

    setFileSystem(prev => ({
      ...prev,
      [newId]: newFolder,
      [targetParentId]: {
        ...prev[targetParentId],
        children: [...(prev[targetParentId].children || []), newId]
      }
    }));

    playClickSound();
    return newId;
  };

  const createFile = (parentId = null, name = 'Nouveau document.txt', content = '', extension = 'txt') => {
    const targetParentId = (!parentId || parentId === 'desktop') ? getActiveDesktopId() : parentId;
    const parent = fileSystem[targetParentId];
    if (!parent) return;

    let baseName = name;
    let ext = extension;
    if (name.includes('.')) {
      const parts = name.split('.');
      ext = parts.pop();
      baseName = parts.join('.');
    }

    let finalName = `${baseName}.${ext}`;
    let counter = 1;
    const siblingNames = (parent.children || []).map(cid => fileSystem[cid]?.name);
    while (siblingNames.includes(finalName)) {
      counter++;
      finalName = `${baseName} (${counter}).${ext}`;
    }

    const newId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newFile = {
      id: newId,
      name: finalName,
      type: 'file',
      extension: ext,
      parentId: targetParentId,
      content,
      size: `${Math.max(1, Math.round(content.length / 1024 * 10) / 10)} KB`,
      createdAt: Date.now()
    };

    setFileSystem(prev => {
      const parentNode = prev[targetParentId] || { children: [] };
      return {
        ...prev,
        [newId]: newFile,
        [targetParentId]: {
          ...parentNode,
          children: [...(parentNode.children || []), newId]
        }
      };
    });

    playClickSound();
    return newId;
  };

  const createWebShortcut = (parentId = null, name = 'Site Web', url = 'https://duckduckgo.com') => {
    const targetParentId = (!parentId || parentId === 'desktop') ? getActiveDesktopId() : parentId;
    const parent = fileSystem[targetParentId];
    if (!parent) return;

    let finalName = name.endsWith('.url') ? name : `${name}.url`;
    let counter = 1;
    const siblingNames = (parent.children || []).map(cid => fileSystem[cid]?.name);
    while (siblingNames.includes(finalName)) {
      counter++;
      const base = name.replace(/\.url$/i, '');
      finalName = `${base} (${counter}).url`;
    }

    const newId = `web_shortcut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newShortcut = {
      id: newId,
      name: finalName,
      type: 'file',
      extension: 'url',
      isWebShortcut: true,
      url: url,
      parentId: targetParentId,
      iconImg: getAssetPath('/apps/web.png'),
      content: `[InternetShortcut]\nURL=${url}`,
      size: `${url.length + 30} B`,
      createdAt: Date.now()
    };

    setFileSystem(prev => {
      const parentNode = prev[targetParentId] || { children: [] };
      return {
        ...prev,
        [newId]: newShortcut,
        [targetParentId]: {
          ...parentNode,
          children: [...(parentNode.children || []), newId]
        }
      };
    });

    if (targetParentId === getActiveDesktopId()) {
      const currentIcons = iconPositions[activeUserId] || {};
      const count = Object.keys(currentIcons).length;
      const x = 24 + Math.floor(count / 7) * 110;
      const y = 24 + (count % 7) * 96;
      setIconPositions(prev => ({
        ...prev,
        [activeUserId]: {
          ...(prev[activeUserId] || {}),
          [newId]: { x, y }
        }
      }));
    }

    playClickSound();
    return newId;
  };

  const renameNode = (id, newName) => {
    if (!fileSystem[id] || !newName || !newName.trim()) return;
    const node = fileSystem[id];
    if (isProtectedSystemNode(node)) {
      playWarningSound();
      setSystemAlertModal({
        title: 'Action impossible — Fichier système protégé',
        nodeName: node.name,
        message: `Le fichier « ${node.name} » ne peut pas être renommé.`,
        detail: `Le renommage des fichiers du noyau ou des applications système est verrouillé pour éviter toute rupture d'intégrité de FloraOS.`
      });
      return;
    }

    const trimmed = newName.trim();
    setFileSystem(prev => {
      const targetNode = prev[id];
      let extension = targetNode.extension;
      if (targetNode.type === 'file' && trimmed.includes('.')) {
        extension = trimmed.split('.').pop();
      }
      return {
        ...prev,
        [id]: {
          ...targetNode,
          name: trimmed,
          extension: extension || targetNode.extension
        }
      };
    });
    playClickSound();
  };

  const deleteNode = (input) => {
    const rawIds = (Array.isArray(input) ? input : [input]).filter(Boolean);

    // Strict lock: Check for any protected system node in the requested deletion
    const protectedId = rawIds.find(id => isProtectedSystemNode(fileSystem[id]));

    if (protectedId) {
      playWarningSound();
      const protectedNode = fileSystem[protectedId];
      const nodeName = protectedNode ? protectedNode.name : 'Fichier système';
      
      setSystemAlertModal({
        title: 'Action impossible — Fichier système protégé',
        nodeName,
        message: `Le composant « ${nodeName} » est un fichier système protégé en écriture.`,
        detail: `Le composant « ${nodeName} » est protégé par le noyau FloraOS. Sa suppression est strictement verrouillée afin de préserver l'intégrité, la stabilité et la sécurité de votre système d'exploitation.`
      });
      return false;
    }

    const ids = rawIds.filter(id => {
      const node = fileSystem[id];
      return node && id !== 'root' && id !== 'desktop' && id !== 'trash' && !id.startsWith('desktop_');
    });
    if (ids.length === 0) return;

    setFileSystem(prev => {
      let next = { ...prev };
      let trashChildren = [...(next.trash?.children || [])];

      ids.forEach(id => {
        const node = next[id];
        if (!node) return;

        if (node.parentId === 'trash') {
          delete next[id];
          trashChildren = trashChildren.filter(cid => cid !== id);
        } else {
          const oldParent = next[node.parentId];
          if (oldParent) {
            next[node.parentId] = {
              ...oldParent,
              children: (oldParent.children || []).filter(cid => cid !== id)
            };
          }
          if (!trashChildren.includes(id)) {
            trashChildren.push(id);
          }
          next[id] = {
            ...node,
            oldParentId: node.parentId,
            parentId: 'trash'
          };
        }
      });

      if (next.trash) {
        next.trash = {
          ...next.trash,
          children: trashChildren
        };
      }

      return next;
    });

    playClickSound();
  };

  const emptyTrash = () => {
    const trashChildren = fileSystem.trash?.children || [];
    if (trashChildren.length === 0) return;

    setFileSystem(prev => {
      const next = { ...prev };
      trashChildren.forEach(cid => {
        delete next[cid];
      });
      next.trash = { ...next.trash, children: [] };
      return next;
    });
    playClickSound();
  };

  const restoreFromTrash = (id) => {
    if (!id || !fileSystem[id]) return;
    const node = fileSystem[id];
    if (node.parentId !== 'trash') return;

    let targetParentId = node.oldParentId;
    if (!targetParentId || !fileSystem[targetParentId]) {
      targetParentId = getActiveDesktopId();
    }

    setFileSystem(prev => {
      const next = { ...prev };
      if (next.trash) {
        next.trash = {
          ...next.trash,
          children: (next.trash.children || []).filter(cid => cid !== id)
        };
      }
      if (next[targetParentId]) {
        const curChildren = next[targetParentId].children || [];
        next[targetParentId] = {
          ...next[targetParentId],
          children: curChildren.includes(id) ? curChildren : [...curChildren, id]
        };
      }
      next[id] = {
        ...node,
        parentId: targetParentId,
        oldParentId: null
      };
      return next;
    });

    playSuccessSound();
    notify('Corbeille', `« ${node.name} » a été restauré.`, '/apps/folder.png');
  };

  const exportSystemBackup = () => {
    try {
      const backupData = {
        system: 'FloraOS',
        version: CURRENT_FLORA_VERSION,
        timestamp: Date.now(),
        fileSystem,
        settings,
        users,
        activeUserId,
        pinnedAppIds,
        iconPositions: JSON.parse(localStorage.getItem(STORAGE_KEYS.ICON_POS) || '{}'),
        postits: JSON.parse(localStorage.getItem('floraos_postits_v1') || '[]')
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `floraos_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      playSuccessSound();
      notify('Sauvegarde', 'Sauvegarde système exportée avec succès !', '/apps/disk.png');
    } catch (e) {
      console.error('Export backup error:', e);
      notify('Erreur', "Échec de l'exportation de la sauvegarde.", 'warning');
    }
  };

  const importSystemBackup = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.fileSystem || !data.settings) {
        throw new Error('Fichier de sauvegarde invalide');
      }

      setFileSystem(data.fileSystem);
      setSettings(data.settings);
      if (Array.isArray(data.users) && data.users.length > 0) {
        setUsers(data.users);
      }
      if (data.activeUserId) {
        setActiveUserId(data.activeUserId);
      }
      if (Array.isArray(data.pinnedAppIds)) {
        setPinnedAppIds(data.pinnedAppIds);
      }
      if (data.iconPositions) {
        try {
          localStorage.setItem(STORAGE_KEYS.ICON_POS, JSON.stringify(data.iconPositions));
        } catch {}
      }
      if (data.postits) {
        try {
          localStorage.setItem('floraos_postits_v1', JSON.stringify(data.postits));
        } catch {}
      }

      playSuccessSound();
      notify('Sauvegarde restaurée', 'Toutes vos données et configurations ont été restaurées.', '/apps/disk.png');
      return true;
    } catch (e) {
      console.error('Import backup error:', e);
      notify('Erreur de restauration', 'Format de fichier corrompu ou invalide.', 'warning');
      return false;
    }
  };

  const saveFileContent = (id, newContent) => {
    if (!fileSystem[id]) return;
    if (isProtectedSystemNode(fileSystem[id])) {
      playWarningSound();
      setSystemAlertModal({
        title: 'Action impossible — Fichier système en lecture seule',
        nodeName: fileSystem[id].name,
        message: `Le fichier « ${fileSystem[id].name} » ne peut pas être modifié.`,
        detail: `Ce fichier système est protégé en écriture. Les journaux et composants du système FloraOS sont strictement en lecture seule pour préserver la traçabilité et l'intégrité de l'OS.`
      });
      return;
    }
    setFileSystem(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        content: newContent,
        size: `${Math.max(1, Math.round(newContent.length / 1024 * 10) / 10)} KB`,
        modifiedAt: Date.now()
      }
    }));
    playClickSound();
  };

  const uploadRealFile = (parentId = null, browserFile) => {
    if (!browserFile) return;

    // 1. Resolve actual target parent folder
    let targetParentId = parentId;
    if (!targetParentId || targetParentId === 'desktop' || !fileSystem[targetParentId]) {
      targetParentId = getActiveDesktopId ? getActiveDesktopId() : `desktop_${activeUserId}`;
    }
    if (!fileSystem[targetParentId]) {
      const userDesktopId = `desktop_${activeUserId}`;
      targetParentId = fileSystem[userDesktopId] ? userDesktopId : 'root';
    }

    const filename = browserFile.name || `fichier_${Date.now()}`;
    const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
    const isText = ['txt', 'md', 'js', 'json', 'css', 'html', 'csv', 'log', 'xml', 'svg'].includes(ext);

    const sizeKb = Math.round(browserFile.size / 1024);
    const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.max(1, sizeKb)} KB`;
    const newId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const processUpload = (fileData) => {
      const newNode = {
        id: newId,
        name: filename,
        type: 'file',
        extension: ext,
        parentId: targetParentId,
        size: sizeStr,
        createdAt: Date.now(),
        ...(isText ? { content: fileData } : { url: fileData })
      };

      setFileSystem(prev => {
        const parentFolder = prev[targetParentId] || prev[getActiveDesktopId()] || prev.root;
        if (!parentFolder) return prev;
        const actualParentId = parentFolder.id;

        return {
          ...prev,
          [newId]: {
            ...newNode,
            parentId: actualParentId
          },
          [actualParentId]: {
            ...parentFolder,
            children: [...(parentFolder.children || []).filter(cid => cid !== newId), newId]
          }
        };
      });

      notify('Fichier importé', `"${filename}" est disponible dans FloraOS.`, 'DownloadCloud');
    };

    try {
      if (isText) {
        const reader = new FileReader();
        reader.onload = (e) => processUpload(e.target.result);
        reader.onerror = () => {
          notify('Erreur d\'importation', `Impossible de lire le fichier "${filename}".`, 'warning');
        };
        reader.readAsText(browserFile);
      } else {
        // If file is binary and larger than 600 KB, use URL.createObjectURL to avoid localStorage quota crash
        if (browserFile.size > 600 * 1024) {
          const blobUrl = URL.createObjectURL(browserFile);
          processUpload(blobUrl);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => processUpload(e.target.result);
          reader.onerror = () => {
            const fallbackUrl = URL.createObjectURL(browserFile);
            processUpload(fallbackUrl);
          };
          reader.readAsDataURL(browserFile);
        }
      }
    } catch (err) {
      console.error('Upload file error:', err);
      notify('Erreur d\'importation', `Une erreur est survenue lors de l'importation de "${filename}".`, 'warning');
    }
  };

  const downloadNodeFile = (id) => {
    const node = fileSystem[id];
    if (!node || node.type !== 'file') return;

    if (node.url && node.url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = node.url;
      a.download = node.name;
      a.click();
      notify('Téléchargement', `Téléchargement de "${node.name}" démarré.`, 'Download');
      return;
    } else if (node.url) {
      window.open(node.url, '_blank');
      return;
    }

    const blob = new Blob([node.content || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = node.name;
    a.click();
    URL.revokeObjectURL(url);
    notify('Téléchargement', `"${node.name}" a été téléchargé sur votre machine.`, 'Download');
  };

  const resetToFactory = () => {
    localStorage.clear();
    setFileSystem(INITIAL_FILE_SYSTEM);
    setSettings({
      wallpaper: WALLPAPERS[0],
      theme: 'dark',
      accentColor: ACCENT_COLORS[0],
      glassBlur: 20,
      soundVolume: 80,
      brightness: 100,
      dockPosition: 'bottom',
      iconSize: 'medium'
    });
    setUsers([
      {
        id: 'u_master',
        name: 'Administrateur',
        avatar: getAssetPath('/apps/user.png'),
        role: 'Administrateur',
        pin: '1234',
        createdAt: Date.now()
      }
    ]);
    setActiveUserId('u_master');
    setIsInstalled(false);
    setWindows([]);
    setIconPositions({});
    setNotifications([]);
    setNotificationHistory([]);
    setInstalledStoreApps([]);
    notify('Système réinitialisé', 'FloraOS a retrouvé ses paramètres d\'usine.', 'RefreshCw');
  };

  // Context Menu handlers
  const openContextMenu = (e, type, targetNodeId = null, parentId = 'desktop') => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      targetNodeId,
      parentId
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Start Menu & Notification center toggles
  const toggleStartMenu = useCallback(() => {
    setIsStartMenuOpen(prev => !prev);
    setIsNotificationCenterOpen(false);
  }, []);

  const toggleNotificationCenter = useCallback(() => {
    setIsNotificationCenterOpen(prev => !prev);
    setIsStartMenuOpen(false);
  }, []);

  return (
    <OSContext.Provider
      value={{
        // Installation & Setup
        isInstalled,
        completeInstallation,

        // Users
        user: currentUser,
        users,
        addUser,
        updateUser,
        deleteUser,
        switchUser,
        isAuthenticated,
        isLocked,
        login,
        loginAsGuest,
        lockSession,
        unlockSession,
        logout,

        // Settings
        settings,
        setSettings,
        resetToFactory,

        // File system & Clipboard
        fileSystem,
        getActiveDesktopId,
        setWallpaperFromImage,
        createFolder,
        createFile,
        renameNode,
        deleteNode,
        emptyTrash,
        restoreFromTrash,
        exportSystemBackup,
        importSystemBackup,
        saveFileContent,
        uploadRealFile,
        downloadNodeFile,
        openFile,
        createShortcutOnDesktop,
        createWebShortcut,
        clipboard,
        copyNode,
        cutNode,
        pasteNode,
        moveNode,

        // Desktop Icons positioning
        iconPositions: currentPositions,
        updateIconPosition,
        resetIconPositions,
        reorganizeDesktopIcons,

        // Taskbar Pinned Apps
        pinnedAppIds,
        pinApp,
        unpinApp,
        isAppPinned,
        closeAllWindows,

        // Windows
        windows,
        activeWindowId,
        openApp,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
        snapWindow,

        // Menus & Drawers
        isStartMenuOpen,
        toggleStartMenu,
        setIsStartMenuOpen,
        isNotificationCenterOpen,
        toggleNotificationCenter,
        setIsNotificationCenterOpen,

        // Notifications
        notifications,
        notificationHistory,
        notify,
        dismissNotification,
        clearAllNotifications,

        // Context Menu
        contextMenu,
        openContextMenu,
        closeContextMenu,

        // FloraStore
        installedStoreApps,
        setInstalledStoreApps,

        // Audio Effects
        playClickSound,
        playSuccessSound,
        playWarningSound,
        playStartupSound,
        playNotificationSound,

        // System Protection Modal & Helper
        systemAlertModal,
        setSystemAlertModal,
        closeSystemAlertModal,
        isProtectedSystemNode,

        // Rename Tab Dialog
        renameModal,
        openRenameModal,
        closeRenameModal,

        // Properties Modal
        propertiesModal,
        openPropertiesModal,
        closePropertiesModal,

        // Unified Shortcut Modal
        shortcutModal,
        openShortcutModal,
        closeShortcutModal,

        // Copy path helper
        copyNodePath,

        // FloraUpdate System
        CURRENT_FLORA_VERSION,
        FLORA_CODENAME,
        updateState,
        setUpdateState,
        updateModal,
        checkForUpdates,
        installSystemUpdate
      }}
    >
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) throw new Error('useOS must be used within an OSProvider');
  return context;
};
