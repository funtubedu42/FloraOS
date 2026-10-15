import { getAssetPath } from '../utils/paths';

export const WALLPAPERS = [
  {
    id: 'floraos-default',
    name: 'FloraOS Par Défaut',
    category: 'FloraOS',
    url: getAssetPath('/wallpapers/floraos_default.png'),
    thumb: getAssetPath('/wallpapers/floraos_default.png'),
    color: '#0f172a'
  },
  {
    id: 'emerald-forest',
    name: 'Forêt d\'Émeraude',
    category: 'Nature',
    url: getAssetPath('/wallpapers/emerald_forest.jpg'),
    thumb: getAssetPath('/wallpapers/emerald_forest.jpg'),
    color: '#064e3b'
  },
  {
    id: 'nordic-aurora',
    name: 'Aurore Boréale',
    category: 'Ciel & Espace',
    url: getAssetPath('/wallpapers/nordic_aurora.jpg'),
    thumb: getAssetPath('/wallpapers/nordic_aurora.jpg'),
    color: '#0c4a6e'
  },
  {
    id: 'cyber-dark',
    name: 'Flora Sombre',
    category: 'Minimaliste',
    url: getAssetPath('/wallpapers/cyber_dark.jpg'),
    thumb: getAssetPath('/wallpapers/cyber_dark.jpg'),
    color: '#0f172a'
  },
  {
    id: 'neon-gradient',
    name: 'Gradient Flora',
    category: 'Abstrait',
    url: getAssetPath('/wallpapers/neon_gradient.jpg'),
    thumb: getAssetPath('/wallpapers/neon_gradient.jpg'),
    color: '#312e81'
  },
  {
    id: 'mountain-peak',
    name: 'Sommet Enneigé',
    category: 'Montagne',
    url: getAssetPath('/wallpapers/mountain_peak.jpg'),
    thumb: getAssetPath('/wallpapers/mountain_peak.jpg'),
    color: '#1e293b'
  },
  {
    id: 'sunset-dunes',
    name: 'Dunes Crépusculaires',
    category: 'Désert',
    url: getAssetPath('/wallpapers/sunset_dunes.jpg'),
    thumb: getAssetPath('/wallpapers/sunset_dunes.jpg'),
    color: '#831843'
  },
  {
    id: 'zen-leaves',
    name: 'Feuilles Tropicales',
    category: 'Botanique',
    url: getAssetPath('/wallpapers/botanical_zen.jpg'),
    thumb: getAssetPath('/wallpapers/botanical_zen.jpg'),
    color: '#047857'
  },
  {
    id: 'deep-space',
    name: 'Espace Infini',
    category: 'Espace',
    url: getAssetPath('/wallpapers/deep_space.jpg'),
    thumb: getAssetPath('/wallpapers/deep_space.jpg'),
    color: '#1e1b4b'
  }
];

export const ACCENT_COLORS = [
  { id: 'emerald', name: 'Émeraude Flora', value: '#10b981', hover: '#059669', glow: 'rgba(16, 185, 129, 0.35)' },
  { id: 'cyan', name: 'Cyan Océan', value: '#06b6d4', hover: '#0891b2', glow: 'rgba(6, 182, 212, 0.35)' },
  { id: 'indigo', name: 'Iris Nocturne', value: '#6366f1', hover: '#4f46e5', glow: 'rgba(99, 102, 241, 0.35)' },
  { id: 'purple', name: 'Lavande', value: '#a855f7', hover: '#9333ea', glow: 'rgba(168, 85, 247, 0.35)' },
  { id: 'rose', name: 'Pétale Rose', value: '#f43f5e', hover: '#e11d48', glow: 'rgba(244, 63, 94, 0.35)' },
  { id: 'amber', name: 'Ambre Soleil', value: '#f59e0b', hover: '#d97706', glow: 'rgba(245, 158, 11, 0.35)' }
];
