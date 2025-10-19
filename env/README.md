# Configuration des Variables d'Environnement

Ce dossier contient tous les fichiers de configuration des variables d'environnement pour le bot Discord.

## Structure

- `.env` - Fichier principal de configuration (à créer)
- `.env.local` - Configuration locale (optionnel, à créer)
- `.env.production` - Configuration de production (optionnel, à créer)

## Variables Requises

Créer un fichier `.env` avec les variables suivantes :

```bash
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_guild_id_here

# Steam API Configuration
STEAM_API_KEY=your_steam_api_key_here

# Twitch API Configuration
TWITCH_CLIENT_ID=your_twitch_client_id_here
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here

# RAWG API Configuration
RAWG_API_KEY=your_rawg_api_key_here

# Vote Configuration
DEFAULT_VOTE_GAMES_COUNT=10
DEFAULT_VOTE_DURATION=24

# Logging Configuration
LOG_LEVEL=info

# Auto-deploy commands on startup
AUTO_DEPLOY_COMMANDS=false

# Node Environment
NODE_ENV=production
```

## Utilisation

1. Copier le contenu ci-dessus dans un fichier `.env` dans ce dossier
2. Remplacer les valeurs par vos vraies clés API et tokens
3. Le bot chargera automatiquement ces variables au démarrage

## Sécurité

- Ne jamais commiter les fichiers `.env` contenant de vraies valeurs
- Utiliser des fichiers séparés pour différents environnements
- Les fichiers `.env*` sont automatiquement ignorés par git
