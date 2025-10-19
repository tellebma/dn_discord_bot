# 🎮 Bot Discord - Gestion de Jeux Hebdomadaires

Bot Discord en TypeScript pour gérer et planifier des sessions de jeux hebdomadaires avec vote communautaire.

## ✨ Fonctionnalités

- **Gestion de jeux** : Ajout, modification, suppression de jeux
- **Activités extras** : Gestion d'activités complémentaires
- **Plans hebdomadaires** : Génération automatique chaque lundi
- **Votes anonymes** : Système de vote communautaire pour choisir les jeux
- **Statistiques** : Stats internes + tendances Steam/Twitch/RAWG
- **Rappels automatiques** : Notifications avant la fin des votes

## 🚀 Installation

### Prérequis
- Node.js 18+
- npm
- Docker (optionnel)

### Installation locale

```bash
# Cloner le dépôt
git clone <votre-repo>
cd divnum_discord_bot

# Installer les dépendances
npm install

# Configuration des variables d'environnement
# Copier le template et éditer avec vos tokens
cp env/.env.template env/.env
# Éditer env/.env avec vos tokens

# Build
npm run build

# Démarrer
npm start
```

### Docker

```bash
# Build
docker build -t discord-bot .

# Run
docker run -d --env-file env/.env -v $(pwd)/data:/app/data discord-bot
```

## ⚙️ Configuration

### Variables d'environnement

Les variables d'environnement sont organisées dans le dossier `env/` :

```bash
env/
├── .env.template    # Template avec toutes les variables
├── .env            # Votre configuration (à créer)
└── README.md       # Documentation détaillée
```

#### Configuration rapide

```bash
# Copier le template
cp env/.env.template env/.env

# Éditer avec vos valeurs
nano env/.env
```

#### Variables requises

```env
# Discord (OBLIGATOIRE)
DISCORD_TOKEN=votre_token
DISCORD_CLIENT_ID=votre_client_id
DISCORD_GUILD_ID=votre_guild_id

# APIs Externes (OPTIONNEL - pour /stats trending)
STEAM_API_KEY=votre_cle_steam
TWITCH_CLIENT_ID=votre_client_id_twitch
TWITCH_CLIENT_SECRET=votre_secret_twitch
RAWG_API_KEY=votre_cle_rawg

# Votes
DEFAULT_VOTE_GAMES_COUNT=10
DEFAULT_VOTE_DURATION=24

# Logs
LOG_LEVEL=info

# Auto-déploiement des commandes
AUTO_DEPLOY_COMMANDS=false
```

### Obtenir les API Keys (optionnel)

**Steam API** (2 min) : https://steamcommunity.com/dev/apikey  
**Twitch API** (5 min) : https://dev.twitch.tv/console  
**RAWG API** (3 min) : https://rawg.io/apidocs

Toutes gratuites, pour activer `/stats type:trending`.

## 📋 Commandes

### Jeux
- `/addgame` - Ajouter un jeu
- `/editgame` - Modifier un jeu
- `/removegame` - Supprimer un jeu
- `/gamepool` - Liste des jeux

### Activités
- `/addactivity` - Ajouter une activité
- `/activities` - Liste des activités
- `/manageactivity` - Gérer les activités

### Planification
- `/weeklyplan` - Générer un plan manuel
- `/setchannel` - Configurer le canal automatique

### Votes
- `/startvote` - Démarrer un vote
- `/votestatus` - Statut du vote
- `/cancelvote` - Annuler un vote

### Stats & Utilitaires
- `/stats` - Statistiques + tendances
- `/help` - Aide complète
- `/ping` - Latence
- `/serverinfo` - Info serveur
- `/userinfo` - Info utilisateur

## 🛠️ Développement

```bash
# Mode développement
npm run dev

# Lint
npm run lint

# Format
npm run format

# Déployer les commandes
npm run deploy:commands
```

## 🐳 CI/CD

Le projet utilise GitHub Actions pour :
- ✅ Tests automatiques (lint, build)
- ✅ Publication Docker sur GHCR
- ✅ Releases automatiques

Les images Docker sont publiées sur : `ghcr.io/tellebma/divnum-discord-bot`

Votre NAS détectera automatiquement les nouvelles versions.

### Workflows

**`.github/workflows/ci.yml`** - Tests à chaque push  
**`.github/workflows/docker-publish.yml`** - Publication Docker  
**`.github/workflows/release.yml`** - Releases sur tags

## 📦 Structure

```
.
├── src/
│   ├── commands/          # Commandes Discord
│   ├── events/            # Événements Discord
│   ├── fonctions/         # Logique métier
│   │   ├── analytics/     # Statistiques
│   │   ├── database/      # Persistence JSON
│   │   ├── external/      # APIs externes
│   │   ├── scheduler/     # Planificateur
│   │   └── voting/        # Système de votes
│   ├── types/             # Types TypeScript
│   └── utils/             # Utilitaires
├── data/                  # Données JSON
├── .github/workflows/     # CI/CD
└── Dockerfile
```

## 📄 License

MIT

## 🤝 Contribution

Voir `CHANGELOG.md` pour l'historique des versions.

