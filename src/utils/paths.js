/**
 * Resolves any public asset URL against Vite's BASE_URL
 * Handles GitHub Pages subpaths (/FloraOS/), custom domains, and local dev automatically.
 */
export const getAssetPath = (path) => {
  if (!path || typeof path !== 'string') return path;
  
  // If already absolute or external protocol, return as is
  if (
    path.startsWith('http://') || 
    path.startsWith('https://') || 
    path.startsWith('data:') || 
    path.startsWith('blob:')
  ) {
    return path;
  }

  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('./') 
    ? path.slice(2) 
    : (path.startsWith('/') ? path.slice(1) : path);

  // Avoid duplicate subpath if path already starts with cleanBase
  if (cleanBase !== '/' && (path.startsWith(cleanBase) || `/${cleanPath}`.startsWith(cleanBase))) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  return `${cleanBase}${cleanPath}`;
};

export default getAssetPath;
