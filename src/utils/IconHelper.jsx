import React from 'react';
import {
  Folder,
  FolderKanban,
  File,
  FileText,
  Image as ImageIcon,
  PlayCircle,
  FileCode2,
  Sliders,
  Terminal,
  Calculator,
  Lock,
  Unlock,
  Power,
  RotateCcw,
  Sparkles,
  User,
  Trash,
  Trash2,
  FolderPlus,
  FilePlus,
  Check,
  CheckCircle2,
  Download,
  DownloadCloud,
  Save,
  Search,
  Maximize2,
  Minimize2,
  X,
  Minus,
  Settings,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  Grid,
  List,
  Eye,
  Info,
  Clock,
  Battery,
  Wifi,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Layers,
  Palette,
  HardDrive,
  Cpu,
  Monitor,
  Bell,
  RefreshCw,
  ExternalLink,
  Edit2,
  Copy,
  FolderOpen,
  ShoppingBag,
  Globe
} from 'lucide-react';

const ICON_MAP = {
  Folder,
  FolderKanban,
  FolderOpen,
  ShoppingBag,
  Globe,
  File,
  FileText,
  Image: ImageIcon,
  PlayCircle,
  FileCode2,
  Sliders,
  Terminal,
  Calculator,
  Lock,
  Unlock,
  Power,
  RotateCcw,
  Sparkles,
  User,
  Trash,
  Trash2,
  FolderPlus,
  FilePlus,
  Check,
  CheckCircle2,
  Download,
  DownloadCloud,
  Save,
  Search,
  Maximize2,
  Minimize2,
  X,
  Minus,
  Settings,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  Grid,
  List,
  Eye,
  Info,
  Clock,
  Battery,
  Wifi,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Layers,
  Palette,
  HardDrive,
  Cpu,
  Monitor,
  Bell,
  RefreshCw,
  ExternalLink,
  Edit2,
  Copy
};

export const DynamicIcon = ({ name, size = 18, className = '', color = 'currentColor', style = {} }) => {
  const IconComponent = ICON_MAP[name] || File;
  return <IconComponent size={size} className={className} color={color} style={style} />;
};

export const isSystemLogFile = (node) => {
  if (!node) return false;
  const ext = (node.extension || '').toLowerCase();
  const name = (node.name || '').toLowerCase();
  const id = (node.id || '').toLowerCase();
  return ext === 'log' || ext === 'txt' || name.endsWith('.log') || name.endsWith('.txt') || name.includes('log') || id.includes('log');
};

export const isSystemBinaryFile = (node) => {
  if (!node || node.type === 'folder') return false;
  const ext = (node.extension || '').toLowerCase();
  const name = (node.name || '').toLowerCase();
  if (['sys', 'dll', 'bin', 'kernel', 'drv', 'so', 'efi'].includes(ext)) return true;
  if (name.endsWith('.sys') || name.endsWith('.drv') || name.endsWith('.so') || name.endsWith('.efi') || name === 'kernel.sys' || node.id === 'system_kernel_sys') return true;
  return false;
};

export const isProtectedSystemNode = (node) => {
  if (!node) return false;
  if (node.isSystem || node.isProtected) return true;
  const sysIds = ['root', 'system_dir', 'apps_dir', 'users_root', 'trash', 'system_config_json', 'system_kernel_log', 'system_kernel_sys'];
  if (sysIds.includes(node.id)) return true;
  if (node.parentId === 'system_dir' || node.parentId === 'apps_dir' || node.parentId === 'root') return true;
  if (node.id?.startsWith('system_') || node.id?.startsWith('app_')) return true;
  const ext = (node.extension || '').toLowerCase();
  if (['sys', 'dll', 'bin', 'kernel', 'conf', 'manifest', 'app'].includes(ext)) return true;
  if (node.name?.endsWith('.app') || node.name?.startsWith('os_') || node.name?.includes('kernel') || node.name?.includes('boot_log')) return true;
  return false;
};

export const getFileIconDetails = (node) => {
  if (!node) return { iconName: 'File', color: '#94a3b8' };

  // 1. Folders
  if (node.type === 'folder') {
    if (node.id === 'trash') return { iconName: 'Trash2', color: '#ef4444', imageSrc: '/apps/bin.png' };
    return { iconName: 'Folder', color: '#34d399', imageSrc: '/apps/folder.png' };
  }

  const ext = (node.extension || '').toLowerCase();
  const name = (node.name || '').toLowerCase();

  // 2. Web shortcuts (.url, .webloc, or explicit web shortcut)
  if (node.isWebShortcut || node.type === 'url' || ext === 'url' || ext === 'webloc' || Boolean(node.url)) {
    return { iconName: 'Globe', color: '#3b82f6', imageSrc: '/apps/web.png' };
  }

  // 3. Log & text files ALWAYS use notes.png (overriding any stale system_file override)
  if (ext === 'log' || ext === 'txt' || ext === 'md' || isSystemLogFile(node) || name.endsWith('.log') || name.endsWith('.txt')) {
    return { iconName: 'FileText', color: '#f59e0b', imageSrc: '/apps/notes.png' };
  }

  // 3. System binary / kernel files STRICTLY use system_file.png (e.g. kernel.sys)
  if (isSystemBinaryFile(node)) {
    return { iconName: 'Cpu', color: '#06b6d4', imageSrc: '/apps/system_file.png' };
  }

  // 4. Config & code files use terminal.png
  if (['json', 'conf', 'cfg', 'ini', 'js', 'html', 'css', 'py', 'sh'].includes(ext) || name.endsWith('.json')) {
    return { iconName: 'FileCode2', color: '#06b6d4', imageSrc: '/apps/terminal.png' };
  }

  // 5. Node explicit custom icons (e.g. app manifests in Applications)
  if (node.imageSrc) {
    return { iconName: 'File', color: '#94a3b8', imageSrc: node.imageSrc };
  }
  if (node.iconImg && node.iconImg !== '/apps/system_file.png') {
    return { iconName: 'File', color: '#94a3b8', imageSrc: node.iconImg };
  }

  // 6. Common media & document extensions
  switch (ext) {
    case 'pdf':
    case 'doc':
    case 'docx':
      return { iconName: 'FileText', color: '#ef4444', imageSrc: '/apps/doc_file.png' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
      return { iconName: 'Image', color: '#10b981' };
    case 'mp4':
    case 'webm':
    case 'ogg':
    case 'mkv':
    case 'mov':
      return { iconName: 'PlayCircle', color: '#a855f7', imageSrc: '/apps/video.png' };
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'm4a':
      return { iconName: 'Music', color: '#ec4899', imageSrc: '/apps/music_files.png' };
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
    case '7z':
      return { iconName: 'Archive', color: '#f59e0b', imageSrc: '/apps/compressed_file.png' };
    default:
      return { iconName: 'File', color: '#94a3b8', imageSrc: '/apps/doc_file.png' };
  }
};
