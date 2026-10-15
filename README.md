# 🌿 FloraOS — Système d'Exploitation Web Moderne

**FloraOS** est un environnement de bureau virtuel et système d'exploitation web interactif développé avec **React 19** et **Vite**. Il offre une expérience moderne inspirée des systèmes Linux et Unix récents (Zorin OS, GNOME) directement dans votre navigateur web.

---

## ✨ Fonctionnalités Clés

- **🌐 Navigateur FloraWeb & FloraTube** :
  - Lecteur officiel YouTube intégré (*FloraTube*) sans refus de connexion ni blocage `X-Frame-Options`.
  - Moteur de recherche web en direct (*FloraSearch*) avec réponses instantanées et synthèses Wikipédia.
  - Gestion des onglets, favoris, raccourcis et ouverture externe.
- **📁 Explorateur de fichiers & VFS persistant** :
  - Système de fichiers complet (`Système`, `Pilotes`, `Configuration`, `Journaux`, `Applications`, `Utilisateurs`).
  - Copie de chemin d'accès dans le fil d'Ariane, propriétés des fichiers et raccourcis dynamiques.
- **🔄 FloraUpdate (Gestionnaire de Mises à Jour)** :
  - Détection automatique et manuelle des nouvelles versions via *GitHub Releases* et `version.json`.
  - Notifications système toast cliquables et écran d'installation immersif avec redémarrage automatique.
- **🎨 Personnalisation Avancée** :
  - Fonds d'écran dynamiques avec le fond officiel `floraos_default.png`.
  - Couleurs d'accentuation, mode sombre, flou de verre (glassmorphism) personnalisable.
  - Gestion du stockage réel alloué par le navigateur et métriques matérielles.
- **🎵 Moteur Audio Personnalisable** :
  - Prise en charge des fichiers audio locaux (`/public/sounds/` : clics, notifications, alertes, fenêtres, démarrage).
  - Synthétiseur Web Audio procédural de secours sans interruption.
- **👥 Multi-utilisateurs & Sécurité** :
  - Jusqu'à 5 profils locaux avec ou sans mot de passe, rôles administrateur et invité.

---

## 🚀 Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) (version 20 ou supérieure recommandée)
- npm ou pnpm

### Installation et Lancement
```bash
# Cloner le dépôt
git clone https://github.com/VOTRE-PSEUDO/FloraOS.git
cd FloraOS

# Installer les dépendances
npm install

# Lancer le serveur de développement local
npm run dev
```
Ouvrez votre navigateur sur `http://localhost:5173`.

### Compilation pour la Production
```bash
npm run build
```
Les fichiers compilés et optimisés seront générés dans le dossier `dist/`.

---

## 📄 Licence & Propriété Intellectuelle

**Copyright © 2026 Luca. Tous droits réservés.**

Ce projet est sous licence **Tous droits réservés (Propriétaire)**.  
Il est formellement interdit de copier, dupliquer, cloner, redistribuer, modifier, republier ou commercialiser tout ou partie du code source, des interfaces, des assets graphiques et des ressources de ce projet sans autorisation écrite préalable et expresse de l'auteur.

Pour plus de précisions, consultez le fichier [LICENSE](./LICENSE).
