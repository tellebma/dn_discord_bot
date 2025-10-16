# 🔄 CI/CD

## GitHub Actions

Le projet utilise 3 workflows automatiques :

### 1. Tests (`.github/workflows/ci.yml`)

**Déclenchement :** À chaque push et PR

**Actions :**
- Lint du code (ESLint)
- Vérification du formatage (Prettier)
- Type checking (TypeScript)
- Build de l'application

### 2. Publication Docker (`.github/workflows/docker-publish.yml`)

**Déclenchement :** Push sur `main` ou création de tag

**Actions :**
- Build de l'image Docker (multi-platform : amd64, arm64)
- Scan de sécurité (Trivy)
- Publication sur GitHub Container Registry (GHCR)

**Images publiées :**
```
ghcr.io/tellebma/divnum-discord-bot:latest
ghcr.io/tellebma/divnum-discord-bot:main
ghcr.io/tellebma/divnum-discord-bot:main-<sha>
```

### 3. Releases (`.github/workflows/release.yml`)

**Déclenchement :** Création d'un tag `v*.*.*`

**Actions :**
- Création de release GitHub
- Génération de notes de release automatiques
- Création d'archives `.tar.gz`

## Utilisation

### Déploiement sur NAS

Le NAS détecte automatiquement les nouvelles images Docker sur GHCR.

**Configuration NAS :**
1. Configurer le registry : `ghcr.io`
2. Image : `tellebma/divnum-discord-bot:latest`
3. Variables d'environnement : depuis `.env`
4. Volume : monter `./data` sur `/app/data`

### Créer une Release

```bash
# Tag la version
git tag v2.2.0
git push origin v2.2.0

# Le workflow release.yml se déclenche automatiquement
# - Crée la release GitHub
# - Publie l'image Docker avec le tag v2.2.0
```

### Tester en Local

```bash
# Pull l'image depuis GHCR
docker pull ghcr.io/tellebma/divnum-discord-bot:latest

# Run
docker run -d \
  --name discord-bot \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  ghcr.io/tellebma/divnum-discord-bot:latest
```

## Configuration Secrets GitHub

Pour que les workflows fonctionnent, configurer dans GitHub :

**Settings → Secrets and variables → Actions**

Aucun secret nécessaire pour la publication GHCR (utilise `GITHUB_TOKEN` automatique).

## Badges

[![CI](https://github.com/tellebma/divnum-discord-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/tellebma/divnum-discord-bot/actions/workflows/ci.yml)
[![Docker](https://github.com/tellebma/divnum-discord-bot/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/tellebma/divnum-discord-bot/actions/workflows/docker-publish.yml)





