import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Clock, 
  Tag, 
  Check, 
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { useOS } from '../../../context/OSContext';
import { playClickSound, playSuccessSound } from '../../../utils/audio';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const TAG_COLORS = [
  { label: 'Personnel', color: '#38bdf8' },
  { label: 'Travail', color: '#10b981' },
  { label: 'Important', color: '#ef4444' },
  { label: 'Loisirs', color: '#a855f7' },
  { label: 'Autre', color: '#f59e0b' }
];

export const CalendarApp = () => {
  const { user, currentUser = user, notify, addNotification = notify } = useOS();

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );

  // Storage key per user
  const storageKey = `flora_calendar_events_${currentUser?.id || 'master'}`;

  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(events));
    } catch (err) {
      console.warn('Failed to save calendar events', err);
    }
  }, [events, storageKey]);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newTag, setNewTag] = useState(TAG_COLORS[0].label);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    // 0 is Sunday in JS, convert so 0 is Monday
    const day = new Date(year, month, 1).getDay();
    return (day + 6) % 7;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    playClickSound();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    playClickSound();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    playClickSound();
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const formatDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const selectedKey = formatDateKey(selectedDate);

  const handleSelectDay = (dayNumber) => {
    playClickSound();
    setSelectedDate(new Date(year, month, dayNumber));
  };

  const handleAddEvent = (e) => {
    e?.preventDefault();
    if (!newTitle.trim()) return;

    const newEv = {
      id: 'ev_' + Date.now(),
      dateKey: selectedKey,
      title: newTitle.trim(),
      time: newTime || '09:00',
      tag: newTag,
      createdAt: Date.now()
    };

    setEvents(prev => [...prev, newEv]);
    setNewTitle('');
    playSuccessSound();

    if (addNotification) {
      addNotification({
        title: 'Événement ajouté',
        message: `${newEv.title} pour le ${selectedDate.toLocaleDateString('fr-FR')}`,
        type: 'info'
      });
    }
  };

  const handleDeleteEvent = (id) => {
    playClickSound();
    setEvents(prev => prev.filter(ev => ev.id !== id));
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  // Selected date events
  const selectedEvents = events.filter(e => e.dateKey === selectedKey).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      userSelect: 'none',
      overflow: 'hidden'
    }}>
      {/* Left: Calendar grid */}
      <div style={{
        flex: '1 1 60%',
        minWidth: '340px',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Header navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarIcon size={24} style={{ color: 'var(--accent-color, #38bdf8)' }} />
              {MONTH_NAMES[month]} {year}
            </h2>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {events.length} événement(s) programmé(s)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleToday}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Aujourd'hui
            </button>
            <button
              onClick={handlePrevMonth}
              title="Mois précédent"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              title="Mois suivant"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
          textAlign: 'center',
          marginBottom: '10px'
        }}>
          {DAY_NAMES.map((name, i) => (
            <div key={i} style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: i >= 5 ? '#f43f5e' : '#64748b',
              padding: '4px 0'
            }}>
              {name}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: '1fr',
          gap: '6px',
          flex: 1
        }}>
          {/* Previous month trailing days */}
          {Array.from({ length: firstDay }).map((_, i) => {
            const dayNum = prevMonthDays - firstDay + i + 1;
            return (
              <div
                key={`prev-${i}`}
                style={{
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(148, 163, 184, 0.3)',
                  fontSize: '13px'
                }}
              >
                {dayNum}
              </div>
            );
          })}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const thisDate = new Date(year, month, dayNum);
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === dayNum;
            const isSelected =
              selectedDate.getFullYear() === year &&
              selectedDate.getMonth() === month &&
              selectedDate.getDate() === dayNum;

            const dateKey = formatDateKey(thisDate);
            const dayEvents = events.filter(e => e.dateKey === dateKey);

            return (
              <div
                key={`current-${dayNum}`}
                onClick={() => handleSelectDay(dayNum)}
                style={{
                  borderRadius: '10px',
                  background: isSelected
                    ? 'rgba(56, 189, 248, 0.18)'
                    : isToday
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected
                    ? '1.5px solid var(--accent-color, #38bdf8)'
                    : isToday
                    ? '1.5px solid rgba(255, 255, 255, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  padding: '4px'
                }}
              >
                <span style={{
                  fontSize: '13px',
                  fontWeight: isToday || isSelected ? 700 : 500,
                  color: isSelected
                    ? 'var(--accent-color, #38bdf8)'
                    : isToday
                    ? '#fff'
                    : '#cbd5e1'
                }}>
                  {dayNum}
                </span>

                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '3px',
                    marginTop: '4px'
                  }}>
                    {dayEvents.slice(0, 3).map((ev, idx) => {
                      const tagObj = TAG_COLORS.find(t => t.label === ev.tag);
                      return (
                        <div
                          key={idx}
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: tagObj?.color || '#38bdf8'
                          }}
                        />
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span style={{ fontSize: '8px', color: '#94a3b8' }}>+</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Agenda & Event Manager */}
      <div style={{
        flex: '1 1 40%',
        minWidth: '280px',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(15, 23, 42, 0.4)',
        padding: '24px',
        overflowY: 'auto'
      }}>
        {/* Date header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent-color, #38bdf8)',
            fontWeight: 700
          }}>
            Planning du jour
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#f8fafc',
            marginTop: '4px'
          }}>
            {selectedDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>

        {/* Add event form */}
        <form onSubmit={handleAddEvent} style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
          padding: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} style={{ color: 'var(--accent-color, #38bdf8)' }} /> Nouvel événement
          </div>

          <input
            type="text"
            placeholder="Titre de l'événement..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '12px',
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '4px 8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Clock size={13} style={{ color: '#94a3b8' }} />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>

            <select
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '12px',
                borderRadius: '8px',
                padding: '6px 8px',
                outline: 'none'
              }}
            >
              {TAG_COLORS.map(t => (
                <option key={t.label} value={t.label} style={{ background: '#1e293b', color: '#fff' }}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!newTitle.trim()}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: newTitle.trim() ? 'var(--accent-color, #38bdf8)' : 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: newTitle.trim() ? '#fff' : '#64748b',
              fontWeight: 600,
              fontSize: '12px',
              cursor: newTitle.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Plus size={14} /> Ajouter
          </button>
        </form>

        {/* Event list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedEvents.length === 0 ? (
            <div style={{
              padding: '30px 10px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              border: '1px dashed rgba(255, 255, 255, 0.06)'
            }}>
              <CalendarDays size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              Aucun événement pour cette journée
            </div>
          ) : (
            selectedEvents.map(ev => {
              const tagObj = TAG_COLORS.find(t => t.label === ev.tag);
              return (
                <div
                  key={ev.id}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      width: '4px',
                      height: '32px',
                      borderRadius: '2px',
                      background: tagObj?.color || '#38bdf8',
                      flexShrink: 0
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#f1f5f9',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {ev.title}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '11px',
                        color: '#94a3b8',
                        marginTop: '2px'
                      }}>
                        <span>{ev.time}</span>
                        <span>•</span>
                        <span style={{ color: tagObj?.color || '#38bdf8' }}>{ev.tag}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    title="Supprimer l'événement"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      opacity: 0.7,
                      cursor: 'pointer',
                      padding: '4px',
                      flexShrink: 0
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default CalendarApp;
