import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { APPS } from '../../constants/apps';
import { DynamicIcon } from '../../utils/IconHelper';
import { getAssetPath } from '../../utils/paths';
import { Search, Lock, Power, RotateCcw, Settings, User } from 'lucide-react';

export const StartMenu = () => {
  const {
    isStartMenuOpen,
    setIsStartMenuOpen,
    user,
    openApp,
    lockSession,
    logout,
    installedStoreApps,
    openContextMenu
  } = useOS();

  const [search, setSearch] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.start-menu-trigger')) {
        setIsStartMenuOpen(false);
      }
    };
    if (isStartMenuOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isStartMenuOpen, setIsStartMenuOpen]);

  if (!isStartMenuOpen) return null;

  const allApps = Object.values(APPS);
  const filteredApps = allApps.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        bottom: '58px',
        left: '12px',
        width: '380px',
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(36px)',
        WebkitBackdropFilter: 'blur(36px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '20px',
        padding: '18px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
        zIndex: 10000,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        animation: 'fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Search Input */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%'
      }}>
        <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
        <input
          type="text"
          placeholder="Rechercher une application..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '9px 12px 9px 36px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(0, 0, 0, 0.35)',
            color: '#fff',
            fontSize: '13px',
            outline: 'none'
          }}
        />
      </div>

      {/* Apps Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        maxHeight: '260px',
        overflowY: 'auto',
        padding: '4px 2px'
      }}>
        {filteredApps.map(app => (
          <div
            key={app.id}
            onClick={() => {
              openApp(app.id);
              setIsStartMenuOpen(false);
            }}
            onContextMenu={(e) => {
              openContextMenu(e, 'app', app.id);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px 4px',
              borderRadius: '12px',
              cursor: 'pointer',
              background: 'transparent',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '6px'
            }}>
              <img
                src={getAssetPath(app.iconImg || '/apps/default_app.png')}
                alt={app.name}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getAssetPath('/apps/default_app.png');
                }}
                style={{ width: '26px', height: '26px', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: '11px', textAlign: 'center', color: '#cbd5e1', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {app.name}
            </span>
          </div>
        ))}
      </div>

      {/* Extra Installed FloraStore Apps if any */}
      {installedStoreApps.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
            Extensions FloraStore
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {installedStoreApps.map(app => (
              <div
                key={app.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '11.5px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: app.color || '#10b981' }} />
                {app.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Profile & Actions Strip */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        paddingTop: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* User */}
        <div
          onClick={() => {
            openApp('settings');
            setIsStartMenuOpen(false);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px'
          }}>
            {user.avatar?.startsWith('/') ? (
              <img src={getAssetPath(user.avatar)} alt="avatar" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            ) : (
              user.avatar || '🌿'
            )}
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff' }}>{user.name}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{user.role}</div>
          </div>
        </div>

        {/* Quick buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => {
              openApp('settings');
              setIsStartMenuOpen(false);
            }}
            title="Paramètres"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#cbd5e1',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => {
              lockSession();
              setIsStartMenuOpen(false);
            }}
            title="Verrouiller la session"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#cbd5e1',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Lock size={14} />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous redémarrer FloraOS ?')) {
                window.location.reload();
              }
            }}
            title="Redémarrer"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: 'none',
              color: '#f87171',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Power size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
