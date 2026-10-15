import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../../context/OSContext';

export const Terminal = () => {
  const { user, fileSystem, getActiveDesktopId, createFile, createFolder, deleteNode } = useOS();

  const initialFolderId = (getActiveDesktopId && getActiveDesktopId()) || 'root';
  const [currentFolderId, setCurrentFolderId] = useState(initialFolderId);

  const [history, setHistory] = useState([
    { text: 'FloraOS Magnolia Kernel v2.5 (x86_64-web)', type: 'system' },
    { text: 'Tapez "help" pour afficher la liste des commandes ou "neofetch" pour les infos système.', type: 'info' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Ensure currentFolder is always a valid object
  const currentFolder = fileSystem[currentFolderId] ||
                        (getActiveDesktopId && fileSystem[getActiveDesktopId()]) ||
                        fileSystem.root ||
                        { id: 'root', name: 'système', children: [] };

  const handleCommand = (e) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Save to command history for Up/Down arrow navigation
    setCmdHistory(prev => [...prev, cmd]);
    setHistoryIdx(-1);

    const parts = cmd.split(' ').filter(Boolean);
    const command = (parts[0] || '').toLowerCase();
    const args = parts.slice(1);

    const promptUser = user?.name || 'utilisateur';
    const folderName = currentFolder.name || 'bureau';

    const newHistory = [...history, { text: `${promptUser}@floraos:~/${folderName}$ ${cmd}`, type: 'input' }];

    switch (command) {
      case 'help':
        newHistory.push({
          text: `Commandes disponibles dans FloraShell :
  • help           : Affiche cette aide
  • neofetch       : Affiche les informations système stylisées
  • ls             : Liste les fichiers et dossiers
  • cd <dossier>   : Change de dossier (.. pour remonter, ~ pour le bureau)
  • pwd            : Affiche le chemin actuel
  • cat <fichier>  : Affiche le contenu d'un document texte
  • mkdir <nom>    : Crée un nouveau dossier
  • touch <nom>    : Crée un nouveau fichier texte
  • rm <nom>       : Supprime un fichier ou dossier
  • clear          : Efface l'écran du terminal
  • whoami         : Affiche l'utilisateur actuel
  • date           : Affiche la date et l'heure actuelles`,
          type: 'output'
        });
        break;

      case 'clear':
        setHistory([]);
        setInputVal('');
        return;

      case 'whoami':
        newHistory.push({ text: `${user?.name || 'Luca'} (${user?.role || 'Utilisateur'})`, type: 'output' });
        break;

      case 'date':
        newHistory.push({ text: new Date().toLocaleString('fr-FR'), type: 'output' });
        break;

      case 'pwd':
        newHistory.push({ text: `/${folderName}`, type: 'output' });
        break;

      case 'ls': {
        const children = (currentFolder.children || [])
          .map(cid => fileSystem[cid])
          .filter(Boolean);
        if (children.length === 0) {
          newHistory.push({ text: '(Dossier vide)', type: 'output' });
        } else {
          const list = children.map(c => c.type === 'folder' ? `📁 ${c.name}/` : `📄 ${c.name}`).join('   ');
          newHistory.push({ text: list, type: 'output' });
        }
        break;
      }

      case 'cd': {
        const target = args[0];
        if (!target || target === '~' || target === 'desktop' || target === 'bureau') {
          const deskId = (getActiveDesktopId && getActiveDesktopId()) || 'root';
          setCurrentFolderId(deskId);
        } else if (target === '..') {
          if (currentFolder.parentId && fileSystem[currentFolder.parentId]) {
            setCurrentFolderId(currentFolder.parentId);
          }
        } else if (target === '/' || target === 'root' || target === 'system') {
          setCurrentFolderId('root');
        } else {
          const found = (currentFolder.children || [])
            .map(cid => fileSystem[cid])
            .find(n => n && n.type === 'folder' && n.name.toLowerCase() === target.toLowerCase());
          if (found) {
            setCurrentFolderId(found.id);
          } else {
            newHistory.push({ text: `cd: aucun dossier nommé '${target}'`, type: 'error' });
          }
        }
        break;
      }

      case 'cat': {
        const fileName = args[0];
        if (!fileName) {
          newHistory.push({ text: 'Usage: cat <nom_fichier>', type: 'error' });
        } else {
          const file = (currentFolder.children || [])
            .map(cid => fileSystem[cid])
            .find(n => n && n.name.toLowerCase() === fileName.toLowerCase());
          if (!file) {
            newHistory.push({ text: `cat: ${fileName}: Fichier introuvable`, type: 'error' });
          } else if (file.type === 'folder') {
            newHistory.push({ text: `cat: ${fileName}: Est un dossier`, type: 'error' });
          } else {
            newHistory.push({ text: file.content || `[Contenu binaire ou URL média: ${file.url || 'Non textuel'}]`, type: 'output' });
          }
        }
        break;
      }

      case 'mkdir': {
        const folderName = args.join(' ');
        if (!folderName) {
          newHistory.push({ text: 'Usage: mkdir <nom_dossier>', type: 'error' });
        } else {
          createFolder(currentFolder.id, folderName);
          newHistory.push({ text: `Dossier '${folderName}' créé avec succès.`, type: 'success' });
        }
        break;
      }

      case 'touch': {
        const fName = args.join(' ');
        if (!fName) {
          newHistory.push({ text: 'Usage: touch <nom_fichier>', type: 'error' });
        } else {
          createFile(currentFolder.id, fName, '// Document créé via Flora Terminal\n');
          newHistory.push({ text: `Fichier '${fName}' créé avec succès.`, type: 'success' });
        }
        break;
      }

      case 'rm': {
        const item = args.join(' ');
        if (!item) {
          newHistory.push({ text: 'Usage: rm <nom>', type: 'error' });
        } else {
          const target = (currentFolder.children || [])
            .map(cid => fileSystem[cid])
            .find(n => n && n.name.toLowerCase() === item.toLowerCase());
          if (!target) {
            newHistory.push({ text: `rm: ${item}: Introuvable`, type: 'error' });
          } else {
            deleteNode(target.id);
            newHistory.push({ text: `'${target.name}' déplacé vers la corbeille.`, type: 'success' });
          }
        }
        break;
      }

      case 'neofetch':
        newHistory.push({
          text: `
      🌿🌿🌿🌿🌿🌿🌿       ${promptUser}@floraos
    🌿🌿🌿🌿🌿🌿🌿🌿🌿     --------------
   🌿🌿🌿  🌿🌿🌿  🌿🌿🌿   OS: FloraOS Release 2.5 x86_64
  🌿🌿🌿    🌿    🌿🌿🌿   Hôte: Navigateur Web Moderne
  🌿🌿🌿         🌿🌿🌿   Kernel: FloraCore 2.5-isolated
   🌿🌿🌿       🌿🌿🌿    Uptime: Session active
    🌿🌿🌿🌿🌿🌿🌿🌿🌿     Shell: FloraShell 2.0 (bash-compatible)
      🌿🌿🌿🌿🌿🌿🌿       WM: FloraWM Glass Compositor
                            Thème: Émeraude Glassmorphism
                            Terminal: Flora Terminal Pro
                            Mémoire: 16384 MB (Virtuelle)
`,
          type: 'neofetch'
        });
        break;

      default:
        newHistory.push({ text: `flora: commande introuvable: '${command}'. Tapez 'help' pour afficher la liste.`, type: 'error' });
    }

    setHistory(newHistory);
    setInputVal('');
  };

  // Keyboard navigation for command history & auto-complete
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= cmdHistory.length) {
        setHistoryIdx(-1);
        setInputVal('');
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      // Auto-complete files/folders
      e.preventDefault();
      const parts = inputVal.split(' ');
      const lastWord = parts[parts.length - 1].toLowerCase();
      if (!lastWord) return;

      const matches = (currentFolder.children || [])
        .map(cid => fileSystem[cid]?.name)
        .filter(n => n && n.toLowerCase().startsWith(lastWord));

      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0];
        setInputVal(parts.join(' '));
      }
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#090d16',
        color: '#34d399',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        padding: '16px',
        overflow: 'hidden',
        cursor: 'text'
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {history.map((item, idx) => (
          <div
            key={idx}
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: item.type === 'error' ? '#f87171' :
                     item.type === 'success' ? '#34d399' :
                     item.type === 'info' ? '#94a3b8' :
                     item.type === 'neofetch' ? '#38bdf8' :
                     item.type === 'input' ? '#f8fafc' : '#cbd5e1'
            }}
          >
            {item.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleCommand} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <span style={{ color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {user?.name || 'Luca'}@floraos:~/{currentFolder.name || 'bureau'}$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            outline: 'none'
          }}
        />
      </form>
    </div>
  );
};
