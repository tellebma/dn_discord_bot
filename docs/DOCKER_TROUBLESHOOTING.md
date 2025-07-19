# Docker Compose Troubleshooting Guide

## Common Build Errors and Solutions

### 1. Missing version field (RESOLVED)
**Error**: Warning about obsolete `version` attribute
**Solution**: Removed `version: '3.8'` from all compose files (modern Docker Compose doesn't require it)

### 2. Build target not found
**Error**: `target "builder" not found in Dockerfile`
**Solution**: Fixed Dockerfile multi-stage build targets

### 3. Environment variables not loading
**Error**: Bot fails to start due to missing Discord credentials
**Solution**: 
```bash
# Ensure .env file exists
cp .env.example .env
# Edit with your actual Discord credentials
nano .env
```

### 4. Permission issues with volumes
**Error**: `permission denied` when accessing mounted volumes
**Solution**:
```bash
# Create directories with proper permissions
mkdir -p data logs
chmod 755 data logs
```

### 5. Port conflicts
**Error**: Port already in use
**Solution**: Bot doesn't expose ports by default (Discord bots don't need them)

## Validation Commands

Before building, validate your setup:

```bash
# Check compose file syntax
docker-compose config --quiet

# Check if .env file exists and has required variables
cat .env | grep -E "(DISCORD_TOKEN|DISCORD_CLIENT_ID)"

# Verify Docker is running
docker info

# Check available disk space
df -h
```

## Build and Run Commands

```bash
# Clean build (recommended for troubleshooting)
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# View build logs
docker-compose build --progress=plain

# View runtime logs
docker-compose logs -f
```

## Development Issues

### Hot reload not working
**Solution**: Use the development compose file:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Source code changes not reflected
**Solution**: Ensure proper volume mounting:
```yaml
volumes:
  - ./src:/app/src
  - ./tsconfig.json:/app/tsconfig.json
```

## Production Issues

### Commands not deploying
**Solution**: Check startup script execution:
```bash
# Check logs for deployment messages
docker-compose logs divnum-discord-bot | grep -E "(deploy|command)"
```

### Data not persisting
**Solution**: Verify volume mounts:
```bash
# Check if data directory exists
ls -la data/
# Check volume mounting
docker-compose exec divnum-discord-bot ls -la /app/data/
```

## Emergency Recovery

If everything fails:

```bash
# Complete cleanup
docker-compose down -v
docker system prune -a
docker volume prune

# Remove all local data (WARNING: This deletes your game pool!)
rm -rf data/ logs/

# Fresh start
cp .env.example .env
# Edit .env with your credentials
docker-compose up -d --build
```

## Getting Help

1. Check logs: `docker-compose logs -f`
2. Validate syntax: `docker-compose config`
3. Check Discord credentials in `.env`
4. Ensure Docker daemon is running
5. Verify disk space availability

## Useful Debug Commands

```bash
# Check container status
docker-compose ps

# Execute commands in running container
docker-compose exec divnum-discord-bot sh

# Check resource usage
docker stats

# Inspect container configuration
docker inspect divnum-discord-bot
```