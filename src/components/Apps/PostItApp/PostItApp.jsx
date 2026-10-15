import React, { useState, useEffect } from 'react';
import { useOS } from '../../../context/OSContext';
import {
  Plus,
  Trash2,
  FileDown,
  Pin,
  Search,
  Sparkles,
  Check
} from 'lucide-react';

const POSTIT_COLORS = [
  { id: 'yellow', bg: '#fef08a', text: '#713f12', border: '#fde047', label: 'Jaune' },
  { id: 'green', bg: '#bbf7d0', text: '#14532d', border: '#86efac', label: 'Menthe' },
  { id: 'blue', bg: '#bae6fd', text: '#0c4a6e', border: '#7dd3fc', label: 'Bleu ciel' },
  { id: 'pink', bg: '#fbcfe8', text: '#831843', border: '#f472b6', label: 'Rose' },
  { id: 'purple', bg: '#e9d5ff', text: '#581c87', border: '#c084fc', label: 'Lavande' }
];

const STORAGE_KEY = 'floraos_postits_v1';

export const PostItApp = ({ windowData }) => {
  const { createFile, notify, playSuccessSound, playClickSound, getActiveDesktopId } = useOS();

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'note_1',
        title: 'Bienvenue sur FloraOS ! 🌸',
        content: 'Voici vos notes & post-it repositionnables. Vous pouvez écrire des mémos, choisir vos couleurs et les exporter directement sur votre bureau.',
        color: 'yellow',
        createdAt: Date.now()
      },
      {
        id: 'note_2',
        title: 'Idées de projets',
        content: '- Tester le navigateur FloraWeb\n- Essayer les jeux et FloraPaint\n- Personnaliser le fond d\'écran',
        color: 'blue',
        createdAt: Date.now()
      }
    ];
  });

  const [activeNoteId, setActiveNoteId] = useState(() => notes[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

  const createNewNote = () => {
    playClickSound();
    const newNote = {
      id: `note_${Date.now()}`,
      title: 'Nouvelle note',
      content: '',
      color: POSTIT_COLORS[notes.length % POSTIT_COLORS.length].id,
      createdAt: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const updateActiveNote = (fields) => {
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, ...fields } : n));
  };

  const deleteNote = (id) => {
    playClickSound();
    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);
    if (activeNoteId === id) {
      setActiveNoteId(remaining[0]?.id || null);
    }
  };

  const exportNoteToVFS = () => {
    if (!activeNote) return;
    const fileName = `${(activeNote.title || 'Note').replace(/[\/\\]/g, '_').slice(0, 30)}.txt`;
    const targetFolder = getActiveDesktopId();
    createFile(targetFolder, fileName, activeNote.content || '');
    playSuccessSound();
    notify('Notes & Post-it', `« ${fileName} » a été enregistré sur le Bureau.`, '/apps/postit_app.png');
  };

  const filteredNotes = notes.filter(n =>
    (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentColorConfig = POSTIT_COLORS.find(c => c.id === (activeNote?.color || 'yellow')) || POSTIT_COLORS[0];

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: '#0f172a',
      color: '#f8fafc',
      userSelect: 'none'
    }}>
      {/* Sidebar: Notes List */}
      <div style={{
        width: '240px',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(30, 41, 59, 0.4)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header with Search and Add button */}
        <div style={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              Mes Post-it ({notes.length})
            </span>
            <button
              onClick={createNewNote}
              title="Ajouter un post-it"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-color, #38bdf8)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '4px 8px'
          }}>
            <Search size={13} color="#94a3b8" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '11.5px',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Notes Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', fontSize: '11.5px', color: '#64748b' }}>
              Aucune note trouvée
            </div>
          ) : (
            filteredNotes.map(n => {
              const isSelected = n.id === activeNote?.id;
              const col = POSTIT_COLORS.find(c => c.id === n.color) || POSTIT_COLORS[0];
              return (
                <div
                  key={n.id}
                  onClick={() => setActiveNoteId(n.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                    borderLeft: `4px solid ${col.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isSelected ? '#fff' : '#e2e8f0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {n.title || 'Sans titre'}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '2px'
                  }}>
                    {n.content ? n.content.replace(/\n/g, ' ') : 'Note vide...'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Editor Canvas / Post-it View */}
      {activeNote ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#090d16', padding: '16px' }}>
          {/* Post-it Card */}
          <div style={{
            flex: 1,
            borderRadius: '16px',
            background: currentColorConfig.bg,
            color: currentColorConfig.text,
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: `1px solid ${currentColorConfig.border}`
          }}>
            {/* Post-it Top Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
            }}>
              {/* Color Swatches */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {POSTIT_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => updateActiveNote({ color: c.id })}
                    title={c.label}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: c.bg,
                      border: activeNote.color === c.id ? `2px solid ${c.text}` : '1px solid rgba(0, 0, 0, 0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: activeNote.color === c.id ? 'scale(1.15)' : 'scale(1)'
                    }}
                  >
                    {activeNote.color === c.id && <Check size={12} color={c.text} />}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={exportNoteToVFS}
                  title="Exporter sous format .txt sur le Bureau"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.15)',
                    background: 'rgba(0, 0, 0, 0.05)',
                    color: currentColorConfig.text,
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <FileDown size={13} /> Exporter .txt
                </button>

                <button
                  onClick={() => deleteNote(activeNote.id)}
                  title="Supprimer cette note"
                  style={{
                    padding: '5px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#ef4444',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Note Title Input */}
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => updateActiveNote({ title: e.target.value })}
              placeholder="Titre du post-it..."
              style={{
                padding: '14px 18px 6px 18px',
                fontSize: '16px',
                fontWeight: 700,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: currentColorConfig.text,
                fontFamily: 'inherit'
              }}
            />

            {/* Note Content Textarea */}
            <textarea
              value={activeNote.content}
              onChange={(e) => updateActiveNote({ content: e.target.value })}
              placeholder="Écrivez vos pensées, idées ou listes de tâches..."
              style={{
                flex: 1,
                padding: '10px 18px 18px 18px',
                fontSize: '13.5px',
                lineHeight: 1.6,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: currentColorConfig.text,
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          Sélectionnez ou créez une note
        </div>
      )}
    </div>
  );
};
