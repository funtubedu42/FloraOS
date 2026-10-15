/**
 * FloraOS Isolated File System Architecture
 * Complete, rich Operating System hierarchy:
 * - Système (Kernel, bootmgr, scheduler, VFS)
 * - Pilotes (GPU, Audio DSP, Input, Réseau, NVMe)
 * - Configuration (/etc: hostname, security, fstab, services, DNS)
 * - Journaux Système (Boot, system activity, auth, audio, integrity)
 * - Bibliothèques (/lib: core runtime, UI shell, crypto, sound)
 * - Applications (.app manifests)
 * - Fichiers Temporaires (/tmp)
 * - Utilisateurs (Multi-user home structure)
 * - Corbeille
 */

export const createUserHomeStructure = (userId, userName = 'Utilisateur') => {
  const userHomeId = `user_${userId}`;
  const desktopId = `desktop_${userId}`;
  const documentsId = `documents_${userId}`;
  const imagesId = `images_${userId}`;
  const downloadsId = `downloads_${userId}`;
  const musicId = `music_${userId}`;
  const videosId = `videos_${userId}`;

  return {
    [userHomeId]: {
      id: userHomeId,
      name: userName,
      type: 'folder',
      parentId: 'users_root',
      children: [desktopId, documentsId, imagesId, downloadsId, musicId, videosId],
      createdAt: Date.now()
    },
    [desktopId]: {
      id: desktopId,
      name: 'Bureau',
      type: 'folder',
      parentId: userHomeId,
      children: [],
      createdAt: Date.now()
    },
    [documentsId]: {
      id: documentsId,
      name: 'Documents',
      type: 'folder',
      parentId: userHomeId,
      children: [],
      createdAt: Date.now()
    },
    [imagesId]: {
      id: imagesId,
      name: 'Images',
      type: 'folder',
      parentId: userHomeId,
      children: [],
      createdAt: Date.now()
    },
    [downloadsId]: {
      id: downloadsId,
      name: 'Téléchargements',
      type: 'folder',
      parentId: userHomeId,
      children: [],
      createdAt: Date.now()
    },
    [musicId]: {
      id: musicId,
      name: 'Musique',
      type: 'folder',
      parentId: userHomeId,
      children: [],
      createdAt: Date.now()
    },
    [videosId]: {
      id: videosId,
      name: 'Vidéos',
      type: 'folder',
      parentId: userHomeId,
      children: [],
      createdAt: Date.now()
    }
  };
};

export const INITIAL_FILE_SYSTEM = {
  // ==========================================
  // ROOT DIRECTORY (Système FloraOS)
  // ==========================================
  root: {
    id: 'root',
    name: 'Système FloraOS',
    type: 'folder',
    parentId: null,
    children: [
      'system_dir',
      'drivers_dir',
      'config_dir',
      'logs_dir',
      'lib_dir',
      'apps_dir',
      'temp_dir',
      'users_root',
      'trash'
    ],
    createdAt: Date.now() - 86400000 * 5
  },

  // ==========================================
  // 1. SYSTÈME CORE (Kernel, Boot, VFS)
  // ==========================================
  system_dir: {
    id: 'system_dir',
    name: 'Système',
    type: 'folder',
    parentId: 'root',
    isSystem: true,
    children: [
      'system_kernel_sys',
      'system_bootmgr_efi',
      'system_config_json',
      'system_scheduler_sys',
      'system_vfs_sys'
    ],
    createdAt: Date.now() - 86400000 * 5
  },
  system_kernel_sys: {
    id: 'system_kernel_sys',
    name: 'kernel.sys',
    type: 'file',
    extension: 'sys',
    parentId: 'system_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraCore 2.6.4 Microkernel Binary Image - WebAssembly / React Architecture]',
    size: '1.8 MB',
    createdAt: Date.now() - 86400000 * 5
  },
  system_bootmgr_efi: {
    id: 'system_bootmgr_efi',
    name: 'bootmgr.efi',
    type: 'file',
    extension: 'efi',
    parentId: 'system_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraOS Unified EFI Boot Manager v2.6]',
    size: '420 KB',
    createdAt: Date.now() - 86400000 * 5
  },
  system_config_json: {
    id: 'system_config_json',
    name: 'os_kernel_config.json',
    type: 'file',
    extension: 'json',
    parentId: 'system_dir',
    isSystem: true,
    iconImg: '/apps/terminal.png',
    content: JSON.stringify({
      os: 'FloraOS',
      version: '2.6.4-LTS',
      architecture: 'WebAssembly / Microkernel Virtual Machine',
      compositor: 'FloraCompositor VSync-60Hz',
      audioEngine: 'FloraAudio Hybrid (Local Files + WebAudio Synth)',
      security: 'Strict-Sandboxed-MultiUser',
      memoryPaging: 'ZeroCopy-VirtualVFS',
      maxUsers: 5
    }, null, 2),
    size: '340 B',
    createdAt: Date.now() - 86400000 * 5
  },
  system_scheduler_sys: {
    id: 'system_scheduler_sys',
    name: 'process_scheduler.sys',
    type: 'file',
    extension: 'sys',
    parentId: 'system_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraCore Preemptive Round-Robin Multitasking Process Scheduler]',
    size: '280 KB',
    createdAt: Date.now() - 86400000 * 5
  },
  system_vfs_sys: {
    id: 'system_vfs_sys',
    name: 'vfs_layer.sys',
    type: 'file',
    extension: 'sys',
    parentId: 'system_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraOS Virtual File System Layer - Inode Mapping & Permissions]',
    size: '310 KB',
    createdAt: Date.now() - 86400000 * 5
  },

  // ==========================================
  // 2. PILOTES MATÉRIELS (Drivers)
  // ==========================================
  drivers_dir: {
    id: 'drivers_dir',
    name: 'Pilotes',
    type: 'folder',
    parentId: 'root',
    isSystem: true,
    children: [
      'drv_display_gpu',
      'drv_audio_dsp',
      'drv_input_haptic',
      'drv_network_interface',
      'drv_storage_nvme'
    ],
    createdAt: Date.now() - 86400000 * 5
  },
  drv_display_gpu: {
    id: 'drv_display_gpu',
    name: 'display_gpu.drv',
    type: 'file',
    extension: 'drv',
    parentId: 'drivers_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraOS Accelerated GPU Graphics Driver - WebGL 2.0 / Canvas API]',
    size: '640 KB',
    createdAt: Date.now() - 86400000 * 5
  },
  drv_audio_dsp: {
    id: 'drv_audio_dsp',
    name: 'audio_dsp.drv',
    type: 'file',
    extension: 'drv',
    parentId: 'drivers_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraAudio Ultra-low Latency DSP Audio Pipeline Driver]',
    size: '320 KB',
    createdAt: Date.now() - 86400000 * 5
  },
  drv_input_haptic: {
    id: 'drv_input_haptic',
    name: 'input_haptic.drv',
    type: 'file',
    extension: 'drv',
    parentId: 'drivers_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraOS Mouse, Trackpad, Multitouch & Keyboard Controller Driver]',
    size: '180 KB',
    createdAt: Date.now() - 86400000 * 5
  },
  drv_network_interface: {
    id: 'drv_network_interface',
    name: 'net_interface.drv',
    type: 'file',
    extension: 'drv',
    parentId: 'drivers_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraOS Virtual 10Gbps Loopback & WebSocket Network Interface]',
    size: '210 KB',
    createdAt: Date.now() - 86400000 * 5
  },
  drv_storage_nvme: {
    id: 'drv_storage_nvme',
    name: 'nvme_storage.drv',
    type: 'file',
    extension: 'drv',
    parentId: 'drivers_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraOS Persistent Block Storage Controller - LocalStorage & IndexedDB Engine]',
    size: '250 KB',
    createdAt: Date.now() - 86400000 * 5
  },

  // ==========================================
  // 3. CONFIGURATION SYSTÈME (/etc)
  // ==========================================
  config_dir: {
    id: 'config_dir',
    name: 'Configuration',
    type: 'folder',
    parentId: 'root',
    isSystem: true,
    children: [
      'cfg_hostname',
      'cfg_security_policy',
      'cfg_services_daemon',
      'cfg_fstab',
      'cfg_network_dns'
    ],
    createdAt: Date.now() - 86400000 * 5
  },
  cfg_hostname: {
    id: 'cfg_hostname',
    name: 'hostname.conf',
    type: 'file',
    extension: 'conf',
    parentId: 'config_dir',
    isSystem: true,
    iconImg: '/apps/terminal.png',
    content: 'floraos-workstation',
    size: '19 B',
    createdAt: Date.now() - 86400000 * 5
  },
  cfg_security_policy: {
    id: 'cfg_security_policy',
    name: 'security_policy.conf',
    type: 'file',
    extension: 'conf',
    parentId: 'config_dir',
    isSystem: true,
    iconImg: '/apps/terminal.png',
    content: `# Politiques de sécurité FloraOS\nENFORCE_SANDBOX=true\nISOLATE_USERS=true\nPROTECT_KERNEL=strict\nRESTRICT_BINARY_EXECUTION=true\nAUDIT_LOGGING=enabled\nSESSION_TIMEOUT=0`,
    size: '165 B',
    createdAt: Date.now() - 86400000 * 5
  },
  cfg_services_daemon: {
    id: 'cfg_services_daemon',
    name: 'services_daemon.json',
    type: 'file',
    extension: 'json',
    parentId: 'config_dir',
    isSystem: true,
    iconImg: '/apps/terminal.png',
    content: JSON.stringify({
      services: [
        { name: 'flora-core-kernel', status: 'running', pid: 1, autostart: true },
        { name: 'window-compositor', status: 'running', pid: 42, autostart: true },
        { name: 'flora-audio-daemon', status: 'running', pid: 105, autostart: true },
        { name: 'taskbar-shell', status: 'running', pid: 112, autostart: true },
        { name: 'notification-center', status: 'running', pid: 140, autostart: true },
        { name: 'calendar-sync-daemon', status: 'running', pid: 180, autostart: true }
      ]
    }, null, 2),
    size: '480 B',
    createdAt: Date.now() - 86400000 * 5
  },
  cfg_fstab: {
    id: 'cfg_fstab',
    name: 'fstab.conf',
    type: 'file',
    extension: 'conf',
    parentId: 'config_dir',
    isSystem: true,
    iconImg: '/apps/terminal.png',
    content: `# Système de fichiers FloraOS\n/dev/vda1    /              flora-vfs   rw,noatime      0 1\n/dev/shm     /tmp           tmpfs       rw,nosuid       0 0\n/dev/vda2    /Utilisateurs  flora-vfs   rw,user_xattr   0 2`,
    size: '210 B',
    createdAt: Date.now() - 86400000 * 5
  },
  cfg_network_dns: {
    id: 'cfg_network_dns',
    name: 'network_dns.conf',
    type: 'file',
    extension: 'conf',
    parentId: 'config_dir',
    isSystem: true,
    iconImg: '/apps/terminal.png',
    content: `# Résolution DNS FloraOS\nnameserver 1.1.1.1\nnameserver 8.8.8.8\ndhcp=enabled\nipv6=auto`,
    size: '72 B',
    createdAt: Date.now() - 86400000 * 5
  },

  // ==========================================
  // 4. JOURNAUX SYSTÈME (Logs)
  // ==========================================
  logs_dir: {
    id: 'logs_dir',
    name: 'Journaux Système',
    type: 'folder',
    parentId: 'root',
    isSystem: true,
    children: [
      'log_boot',
      'log_system_activity',
      'log_authentication',
      'log_audio_subsystem',
      'log_integrity_audit'
    ],
    createdAt: Date.now() - 86400000 * 5
  },
  log_boot: {
    id: 'log_boot',
    name: 'boot_log.txt',
    type: 'file',
    extension: 'txt',
    parentId: 'logs_dir',
    isSystem: true,
    iconImg: '/apps/notes.png',
    content: `[0.000] FloraOS Kernel v2.6.4 initializing microkernel image...\n[0.004] CPU: Virtual 8-Core WebAssembly execution engine detected.\n[0.008] Memory: 16384 MB VFS paging initialized with Zero-Copy IPC.\n[0.012] Sandboxed multi-user namespaces mounted successfully.\n[0.016] Drivers: display_gpu.drv, audio_dsp.drv, input_haptic.drv registered.\n[0.024] Clock & Calendar background daemons started.\n[0.035] Unified TaskBar & Compositor loaded successfully.\n[0.048] Audio sound engine online (Custom files probe / WebAudio synth ready).\n[0.060] FloraStore catalog synchronized (12 packages active).\n[0.075] System operational. User desktop environment ready.`,
    size: '640 B',
    createdAt: Date.now() - 86400000 * 5
  },
  log_system_activity: {
    id: 'log_system_activity',
    name: 'system_activity.log',
    type: 'file',
    extension: 'log',
    parentId: 'logs_dir',
    isSystem: true,
    iconImg: '/apps/notes.png',
    content: `[FloraOS System Daemon Log]\n[OK] VFS Inodes Integrity: All nodes verified (100% healthy, 0 corrupted blocks).\n[OK] Process Scheduler: 0 deadlocks detected, preemptive task scheduling active.\n[OK] Window Compositor: 60 FPS VSync locked with hardware acceleration.\n[OK] Power Management: AC online, high performance profile active.\n[OK] Network Tunnel: Connected (loopback active, 0 packet loss).`,
    size: '410 B',
    createdAt: Date.now() - 86400000 * 4
  },
  log_authentication: {
    id: 'log_authentication',
    name: 'authentication.log',
    type: 'file',
    extension: 'log',
    parentId: 'logs_dir',
    isSystem: true,
    iconImg: '/apps/notes.png',
    content: `[FloraOS Security Log]\n[AUTH] Multi-user session manager initialized.\n[AUTH] Luca (Admin) session authenticated via local credential vault.\n[AUTH] Permission token issued: ROLE_ADMINISTRATOR.\n[AUDIT] Protected system nodes locked: Kernel, Drivers, Libs, Config set to Read-Only.`,
    size: '280 B',
    createdAt: Date.now() - 86400000 * 3
  },
  log_audio_subsystem: {
    id: 'log_audio_subsystem',
    name: 'audio_subsystem.log',
    type: 'file',
    extension: 'log',
    parentId: 'logs_dir',
    isSystem: true,
    iconImg: '/apps/notes.png',
    content: `[FloraAudio Subsystem Log]\n[AUDIO] AudioContext state: online (sampleRate: 48000Hz, channels: Stereo 2.0).\n[AUDIO] Custom files location: /public/sounds/\n[AUDIO] Probed files: error.mp3, notification.mp3, click.mp3, window_open.mp3, success.mp3.\n[AUDIO] Web Audio real-time fallback synthesizers armed.\n[AUDIO] Master Volume: 80% with soft limiter enabled.`,
    size: '360 B',
    createdAt: Date.now() - 86400000 * 2
  },
  log_integrity_audit: {
    id: 'log_integrity_audit',
    name: 'integrity_audit.log',
    type: 'file',
    extension: 'log',
    parentId: 'logs_dir',
    isSystem: true,
    iconImg: '/apps/notes.png',
    content: `[FloraOS Cryptographic Integrity Audit]\n[SHA256] kernel.sys : a4f8c92b0e7d1... VERIFIED (OK)\n[SHA256] drivers/*.drv : 5 items ... VERIFIED (OK)\n[SHA256] lib/*.so : 4 items ... VERIFIED (OK)\n[STATUS] Zero unauthorized modification detected. System status: SECURE.`,
    size: '290 B',
    createdAt: Date.now() - 86400000 * 1
  },

  // ==========================================
  // 5. BIBLIOTHÈQUES PARTAGÉES (/lib)
  // ==========================================
  lib_dir: {
    id: 'lib_dir',
    name: 'Bibliothèques',
    type: 'folder',
    parentId: 'root',
    isSystem: true,
    children: [
      'lib_flora_core',
      'lib_ui_shell',
      'lib_crypto_vault',
      'lib_audio_dsp'
    ],
    createdAt: Date.now() - 86400000 * 5
  },
  lib_flora_core: {
    id: 'lib_flora_core',
    name: 'libflora_core.so',
    type: 'file',
    extension: 'so',
    parentId: 'lib_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraOS Standard C/Wasm Core Runtime Library]',
    size: '1.2 MB',
    createdAt: Date.now() - 86400000 * 5
  },
  lib_ui_shell: {
    id: 'lib_ui_shell',
    name: 'libflora_shell.so',
    type: 'file',
    extension: 'so',
    parentId: 'lib_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraOS Window Manager, Compositor & Desktop Shell Library]',
    size: '980 KB',
    createdAt: Date.now() - 86400000 * 5
  },
  lib_crypto_vault: {
    id: 'lib_crypto_vault',
    name: 'libflora_crypto.so',
    type: 'file',
    extension: 'so',
    parentId: 'lib_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraOS Cryptographic Engine - AES-256 / SHA-256 / RSA Vault]',
    size: '520 KB',
    createdAt: Date.now() - 86400000 * 5
  },
  lib_audio_dsp: {
    id: 'lib_audio_dsp',
    name: 'libflora_sound.so',
    type: 'file',
    extension: 'so',
    parentId: 'lib_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraOS Realtime Audio Mixing & Soundscape Engine]',
    size: '410 KB',
    createdAt: Date.now() - 86400000 * 5
  },

  // ==========================================
  // 6. APPLICATIONS DU SYSTÈME (Apps)
  // ==========================================
  apps_dir: {
    id: 'apps_dir',
    name: 'Applications',
    type: 'folder',
    parentId: 'root',
    isSystem: true,
    children: [
      'app_browser_manifest',
      'app_explorer_manifest',
      'app_store_manifest',
      'app_text_manifest',
      'app_settings_manifest',
      'app_time_manifest',
      'app_calendar_manifest',
      'app_terminal_manifest',
      'app_calculator_manifest',
      'app_image_manifest',
      'app_video_manifest',
      'app_pdf_manifest'
    ],
    createdAt: Date.now() - 86400000 * 5
  },
  app_browser_manifest: {
    id: 'app_browser_manifest',
    name: 'Navigateur_Web.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/web.png',
    content: JSON.stringify({ app: 'BrowserApp', version: '2.0', engine: 'FloraWeb / Chromium Isolated', permissions: ['network'] }, null, 2),
    size: '145 B',
    createdAt: Date.now() - 86400000 * 4
  },
  app_explorer_manifest: {
    id: 'app_explorer_manifest',
    name: 'Explorateur_Fichiers.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/folder.png',
    content: JSON.stringify({ app: 'FileExplorer', features: ['BreadcrumbPathCopy', 'PropertiesModal', 'UnifiedShortcuts', 'MultiSelect'] }, null, 2),
    size: '160 B',
    createdAt: Date.now() - 86400000 * 4
  },
  app_store_manifest: {
    id: 'app_store_manifest',
    name: 'FloraStore_v2.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/store.png',
    content: JSON.stringify({ app: 'FloraStore', version: '2.0', repository: 'https://store.floraos.org' }, null, 2),
    size: '120 B',
    createdAt: Date.now() - 86400000 * 4
  },
  app_text_manifest: {
    id: 'app_text_manifest',
    name: 'Bloc_Notes.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/notes.png',
    content: JSON.stringify({ app: 'TextEditor', defaultDocument: 'Fichier sans nom', autoSavePrompt: true }, null, 2),
    size: '125 B',
    createdAt: Date.now() - 86400000 * 4
  },
  app_settings_manifest: {
    id: 'app_settings_manifest',
    name: 'Parametres.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/settings.png',
    content: JSON.stringify({ app: 'Settings', modules: ['Personalization', 'AudioSoundscape', 'UsersSecurity', 'SystemInfo'] }, null, 2),
    size: '150 B',
    createdAt: Date.now() - 86400000 * 4
  },
  app_time_manifest: {
    id: 'app_time_manifest',
    name: 'Horloge_Systeme.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/time_app.png',
    content: JSON.stringify({ app: 'TimeApp', features: ['Clock', 'Stopwatch', 'Timer', 'Alarm'] }, null, 2),
    size: '105 B',
    createdAt: Date.now() - 86400000 * 4
  },
  app_calendar_manifest: {
    id: 'app_calendar_manifest',
    name: 'Calendrier.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/calendar.png',
    content: JSON.stringify({ app: 'CalendarApp', features: ['MonthGrid', 'AgendaEvents', 'MultiUserStorage'] }, null, 2),
    size: '115 B',
    createdAt: Date.now() - 86400000 * 4
  },
  app_terminal_manifest: {
    id: 'app_terminal_manifest',
    name: 'Terminal.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/terminal.png',
    content: JSON.stringify({ app: 'Terminal', shell: 'flora-sh', version: '2.2' }, null, 2),
    size: '98 B',
    createdAt: Date.now() - 86400000 * 4
  },
  app_calculator_manifest: {
    id: 'app_calculator_manifest',
    name: 'Calculatrice.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/default_app.png',
    content: JSON.stringify({ app: 'Calculator', mode: 'StandardScientific' }, null, 2),
    size: '95 B',
    createdAt: Date.now() - 86400000 * 4
  },
  app_image_manifest: {
    id: 'app_image_manifest',
    name: 'Visionneuse_Images.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/photos.png',
    content: JSON.stringify({ app: 'ImageViewer', formats: ['PNG', 'JPG', 'WEBP', 'GIF', 'SVG'] }, null, 2),
    size: '110 B',
    createdAt: Date.now() - 86400000 * 4
  },
  app_video_manifest: {
    id: 'app_video_manifest',
    name: 'Lecteur_Media.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/video.png',
    content: JSON.stringify({ app: 'VideoPlayer', hardwareDecoding: true }, null, 2),
    size: '100 B',
    createdAt: Date.now() - 86400000 * 4
  },
  app_pdf_manifest: {
    id: 'app_pdf_manifest',
    name: 'Lecteur_PDF.app',
    type: 'file',
    extension: 'json',
    parentId: 'apps_dir',
    isSystem: true,
    iconImg: '/apps/pdf_viewer.png',
    content: JSON.stringify({ app: 'PdfViewer', zoomSupported: true }, null, 2),
    size: '95 B',
    createdAt: Date.now() - 86400000 * 4
  },

  // ==========================================
  // 7. FICHIERS TEMPORAIRES (/tmp)
  // ==========================================
  temp_dir: {
    id: 'temp_dir',
    name: 'Fichiers Temporaires',
    type: 'folder',
    parentId: 'root',
    isSystem: true,
    children: [
      'tmp_session_lock',
      'tmp_clipboard_cache',
      'tmp_icon_cache'
    ],
    createdAt: Date.now() - 86400000 * 5
  },
  tmp_session_lock: {
    id: 'tmp_session_lock',
    name: 'session.lock',
    type: 'file',
    extension: 'lock',
    parentId: 'temp_dir',
    isSystem: true,
    iconImg: '/apps/terminal.png',
    content: 'PID=1\nUSER=Luca\nACTIVE=TRUE',
    size: '28 B',
    createdAt: Date.now()
  },
  tmp_clipboard_cache: {
    id: 'tmp_clipboard_cache',
    name: 'clipboard_cache.dat',
    type: 'file',
    extension: 'dat',
    parentId: 'temp_dir',
    isSystem: true,
    iconImg: '/apps/system_file.png',
    content: '[FloraOS Transient Clipboard Shared Memory Block]',
    size: '128 B',
    createdAt: Date.now()
  },
  tmp_icon_cache: {
    id: 'tmp_icon_cache',
    name: 'icon_cache.db',
    type: 'file',
    extension: 'db',
    parentId: 'temp_dir',
    isSystem: true,
    iconImg: '/apps/terminal.png',
    content: '[FloraOS Vector & PNG Pre-rendered Icon Inodes Database]',
    size: '64 KB',
    createdAt: Date.now()
  },

  // ==========================================
  // 8. UTILISATEURS (Homes)
  // ==========================================
  users_root: {
    id: 'users_root',
    name: 'Utilisateurs',
    type: 'folder',
    parentId: 'root',
    children: ['user_u_master'],
    createdAt: Date.now() - 86400000 * 5
  },

  user_u_master: {
    id: 'user_u_master',
    name: 'Luca (Admin)',
    type: 'folder',
    parentId: 'users_root',
    children: [
      'desktop_u_master',
      'documents_u_master',
      'images_u_master',
      'downloads_u_master',
      'music_u_master',
      'videos_u_master'
    ],
    createdAt: Date.now() - 86400000 * 5
  },

  desktop_u_master: {
    id: 'desktop_u_master',
    name: 'Bureau',
    type: 'folder',
    parentId: 'user_u_master',
    children: ['shortcut_duckduckgo'],
    createdAt: Date.now() - 86400000 * 5
  },
  shortcut_duckduckgo: {
    id: 'shortcut_duckduckgo',
    name: 'DuckDuckGo.url',
    type: 'file',
    extension: 'url',
    parentId: 'desktop_u_master',
    isWebShortcut: true,
    url: 'https://duckduckgo.com',
    iconImg: '/apps/web.png',
    content: '[InternetShortcut]\nURL=https://duckduckgo.com',
    size: '42 B',
    createdAt: Date.now()
  },

  documents_u_master: {
    id: 'documents_u_master',
    name: 'Documents',
    type: 'folder',
    parentId: 'user_u_master',
    children: [],
    createdAt: Date.now() - 86400000 * 5
  },

  images_u_master: {
    id: 'images_u_master',
    name: 'Images',
    type: 'folder',
    parentId: 'user_u_master',
    children: [],
    createdAt: Date.now() - 86400000 * 5
  },

  downloads_u_master: {
    id: 'downloads_u_master',
    name: 'Téléchargements',
    type: 'folder',
    parentId: 'user_u_master',
    children: [],
    createdAt: Date.now() - 86400000 * 5
  },

  music_u_master: {
    id: 'music_u_master',
    name: 'Musique',
    type: 'folder',
    parentId: 'user_u_master',
    children: [],
    createdAt: Date.now() - 86400000 * 5
  },

  videos_u_master: {
    id: 'videos_u_master',
    name: 'Vidéos',
    type: 'folder',
    parentId: 'user_u_master',
    children: [],
    createdAt: Date.now() - 86400000 * 5
  },

  // ==========================================
  // 9. CORBEILLE
  // ==========================================
  trash: {
    id: 'trash',
    name: 'Corbeille',
    type: 'folder',
    parentId: 'root',
    children: [],
    createdAt: Date.now() - 86400000 * 5
  }
};
