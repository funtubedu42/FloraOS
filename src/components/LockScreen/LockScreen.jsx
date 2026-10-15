import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { ArrowRight } from 'lucide-react';
import { getAssetPath } from '../../utils/paths';

export const LockScreen = () => {
  const { user, users, switchUser, login, unlockSession, isLocked } = useOS();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUnlock = (e) => {
    e.preventDefault();
    const success = isLocked ? unlockSession(pin) : login(pin);
    if (!success) {
      setError(true);
      setTimeout(() => setError(false), 1000);
      setPin('');
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedDate = currentTime.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const renderAvatar = (avatarSrc, size = '76px', fontSize = '34px') => {
    if (avatarSrc && (avatarSrc.startsWith('/') || avatarSrc.startsWith('http') || avatarSrc.includes('.'))) {
      return (
        <img
          src={getAssetPath(avatarSrc)}
          alt="Avatar"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%'
          }}
        />
      );
    }
    return <span style={{ fontSize }}>{avatarSrc || '🌿'}</span>;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '80px 20px 60px',
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        color: '#fff',
        fontFamily: 'var(--font-sans)',
        animation: 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Sleek Minimalist Clock */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '92px',
          fontWeight: 200,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-2px',
          lineHeight: 1,
          color: 'rgba(255, 255, 255, 0.95)',
          textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)'
        }}>
          {formattedTime}
        </h1>
        <p style={{
          fontSize: '16px',
          fontWeight: 400,
          color: 'rgba(255, 255, 255, 0.75)',
          textTransform: 'capitalize',
          marginTop: '10px',
          letterSpacing: '0.2px'
        }}>
          {formattedDate}
        </p>
      </div>

      {/* Pure, Minimalist Login Form */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '300px'
      }}>
        {/* User Avatar */}
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
          marginBottom: '14px',
          overflow: 'hidden'
        }}>
          {renderAvatar(user.avatar, '76px', '34px')}
        </div>

        {/* User Name */}
        <div style={{
          fontSize: '16px',
          fontWeight: 500,
          color: '#ffffff',
          marginBottom: users && users.length > 1 ? '10px' : '18px',
          letterSpacing: '-0.2px'
        }}>
          {user.name || 'Luca'}
        </div>

        {/* Multi-user picker if multiple accounts */}
        {users && users.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '4px',
            borderRadius: '20px'
          }}>
            {users.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  switchUser(u.id);
                  setPin('');
                }}
                title={u.name}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: u.id === user.id ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  opacity: u.id === user.id ? 1 : 0.6,
                  transition: 'all 0.15s ease'
                }}
              >
                {renderAvatar(u.avatar, '28px', '14px')}
              </button>
            ))}
          </div>
        )}

        {/* Minimalist Input Pill or Direct Connect Button */}
        <form onSubmit={handleUnlock} style={{ width: '100%' }}>
          {user.hasPassword === false || !user.pin ? (
            <button
              type="submit"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                color: '#fff',
                fontSize: '13.5px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span>Se connecter</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              transform: error ? 'translateX(0)' : 'none',
              animation: error ? 'shake 0.35s ease' : 'none'
            }}>
              <input
                type="password"
                placeholder="Mot de passe"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 18px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.18)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '5px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
              >
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Subtle spacer for balance */}
      <div style={{ height: '30px' }} />
    </div>
  );
};
