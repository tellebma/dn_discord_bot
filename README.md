# Game Pool Discord Bot

A Discord bot for managing weekly game plans and extra activities, built with TypeScript using the [Discord Bot Template (TypeScript)](https://github.com/tellebma/template_discord_bot_ts).

## Features

- 🎮 **Game Pool Management** - Add, view, and manage a pool of games
- 📅 **Weekly Game Plans** - Automatic Monday game plan generation with random game selection
- 🗓️ **Extra Activities** - Schedule day-specific activities (e.g., AfterWork on Mondays)
- 🚀 **TypeScript** - Full type safety and modern JavaScript features
- 🤖 **Slash Commands** - Modern Discord slash commands with comprehensive options
- 📁 **Organized Architecture** - Clean, modular file structure with path aliases
- 🔧 **Persistent Storage** - JSON-based data storage for games and activities
- 🛡️ **Permission Management** - Admin controls for sensitive operations
- 📋 **Rich Embeds** - Beautiful Discord embeds with detailed information
- 🔄 **Hot Reload** - Development mode with tsx watch

## Commands

### Game Management
- `/addgame` - Add a game to the pool with details (name, description, category, player counts)
- `/gamepool` - View all games in the pool with rich formatting

### Activity Management  
- `/addactivity` - Add extra activities with specific days (e.g., "AfterWork" on Mondays)
- `/activities` - View all activities, optionally filtered to active only
- `/manageactivity` - Admin command to toggle, remove, or edit activities

### Weekly Planning
- `/weeklyplan` - Manually generate and send a weekly plan
- `/setchannel` - Set channel for automatic Monday 10 AM weekly plans

## Quick Start

1. **Clone the template and setup**
   ```bash
   git clone https://github.com/tellebma/template_discord_bot_ts.git divnum_discord_bot
   cd divnum_discord_bot
   cp .env.example .env
   npm install
   ```

2. **Configure your bot**
   - Create a new application at https://discord.com/developers/applications
   - Create a bot and copy the token to your `.env` file
   - Copy the Application ID to your `.env` file as DISCORD_CLIENT_ID

3. **Run the bot**
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Or build and run production
   npm run build
   npm start
   ```

4. **Set up weekly automation**
   ```bash
   # In Discord, use the bot commands:
   /setchannel channel:#your-channel
   ```

## Project Structure

```
divnum_discord_bot/
├── src/                       # TypeScript source code
│   ├── app.ts                # Main application entry point
│   ├── commands/             # Slash commands
│   │   ├── addgame.ts        # Add games to pool
│   │   ├── gamepool.ts       # View game pool
│   │   ├── addactivity.ts    # Add extra activities
│   │   ├── activities.ts     # View activities
│   │   ├── manageactivity.ts # Manage activities (admin)
│   │   ├── weeklyplan.ts     # Manual weekly plan generation
│   │   └── setchannel.ts     # Set auto-posting channel
│   ├── events/               # Discord.js event handlers
│   ├── utils/                # Utility modules
│   ├── types/                # TypeScript type definitions
│   │   ├── bot.ts            # Bot-specific types
│   │   └── game.ts           # Game and activity types
│   └── fonctions/            # Business logic modules
│       ├── database/         # Data management
│       │   ├── gamePool.ts   # Game pool manager
│       │   └── extraActivities.ts # Activities manager
│       └── scheduler/        # Scheduling logic
│           └── weeklyPlanner.ts # Weekly plan generation
├── data/                     # Generated data storage
│   ├── gamePool.json        # Games database
│   ├── extraActivities.json # Activities database
│   └── weeklyPlans.json     # Weekly plan history
├── dist/                     # Compiled JavaScript (generated)
└── [standard template files]
```

## Game Pool System

### Adding Games
```bash
/addgame name:"Among Us" description:"Social deduction game" category:"Party" minplayers:4 maxplayers:10
/addgame name:"Chess" description:"Strategic board game" category:"Strategy" minplayers:2 maxplayers:2
```

### Game Properties
- **Name** - Game title (required, unique)
- **Description** - Game description (optional)
- **Category** - Game category (optional, e.g., Strategy, Party, Action)
- **Min/Max Players** - Player count range (optional)
- **Added By** - User who added the game (automatic)
- **Added At** - Timestamp (automatic)

## Extra Activities System

### Adding Activities
```bash
/addactivity name:"AfterWork" day:1 description:"Drinks at the bar" location:"Local Pub" time:"18:00"
/addactivity name:"Team Lunch" day:5 description:"Friday team lunch" location:"Office" time:"12:00"
```

### Activity Properties
- **Name** - Activity title (required, unique)
- **Day** - Day of week (0=Sunday, 1=Monday, etc.) (required)
- **Description** - Activity description (optional)
- **Location** - Activity location (optional)
- **Time** - Activity time (optional, e.g., "18:00" or "6 PM")
- **Active** - Whether activity is active (default: true)

### Managing Activities
```bash
# Toggle activity on/off
/manageactivity toggle activity:"AfterWork"

# Edit activity details
/manageactivity edit activity:"AfterWork" time:"19:00" location:"New Bar"

# Remove activity permanently
/manageactivity remove activity:"AfterWork"
```

## Weekly Planning System

### Automatic Scheduling
- **When**: Every Monday at 10:00 AM
- **Content**: Up to 5 random games + all active extra activities
- **Format**: Rich Discord embed with organized sections

### Manual Generation
```bash
/weeklyplan  # Generate plan for current channel
```

### Weekly Plan Content
- **Games Section**: Random selection from game pool (up to 5)
- **Extra Activities Section**: All active activities organized by day
- **Week Range**: Monday to Sunday date range
- **Rich Formatting**: Embeds with emojis, colors, and organized fields

## Data Storage

The bot uses JSON files for persistent storage:

### `data/gamePool.json`
```json
{
  "games": [
    {
      "id": "1642511234567",
      "name": "Among Us",
      "description": "Social deduction game",
      "category": "Party",
      "minPlayers": 4,
      "maxPlayers": 10,
      "addedBy": "123456789012345678",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### `data/extraActivities.json`
```json
{
  "activities": [
    {
      "id": "1642511234568",
      "name": "AfterWork",
      "description": "Drinks at the bar",
      "location": "Local Pub",
      "time": "18:00",
      "dayOfWeek": 1,
      "isActive": true,
      "addedBy": "123456789012345678",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Permissions

### Regular Users
- View game pool and activities
- Add games and activities
- Generate manual weekly plans

### Admins (Manage Messages permission)
- All regular user permissions
- Set auto-posting channel
- Manage activities (toggle, edit, remove)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_TOKEN` | Your bot's token | Yes |
| `DISCORD_CLIENT_ID` | Your application's client ID | Yes |
| `NODE_ENV` | Environment mode (development/production) | No |
| `AUTO_DEPLOY_COMMANDS` | Auto-deploy commands on startup (conditional deployment) | No |
| `LOG_LEVEL` | Logging level (info, debug, error) | No |

## Development

### Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the bot in production mode
- `npm run dev` - Start with hot reload for development
- `npm run lint` - Check code quality with ESLint
- `npm run format` - Format code with Prettier

### Development Features
- **Hot Reload** - Automatic restart during development
- **Type Safety** - Full TypeScript coverage
- **Data Persistence** - Automatic JSON file management
- **Error Handling** - Comprehensive error management

## Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment

#### Docker Compose (Recommended)

The easiest way to deploy the bot is using Docker Compose:

**Production deployment:**
```bash
# Copy environment file
cp .env.example .env
# Edit .env with your Discord token and client ID

# Start the bot
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the bot
docker-compose down
```

**Development with hot reload:**
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs with hot reload
docker-compose -f docker-compose.dev.yml logs -f
```

**Conditional deployment:**
```bash
# Set environment variable for conditional deployment
export AUTO_DEPLOY_COMMANDS=true

# Start with conditional deployment
docker-compose -f docker-compose.conditional.yml up -d

# Or deploy commands separately
docker-compose -f docker-compose.conditional.yml --profile deploy-only run deploy-commands
```

#### Docker Compose Configurations

The project includes several Docker Compose configurations:

| File | Purpose | Features |
|------|---------|----------|
| `docker-compose.yml` | **Production** | Auto-deploy commands, persistent data, health checks |
| `docker-compose.dev.yml` | **Development** | Hot reload, source mounting, development tools |
| `docker-compose.conditional.yml` | **Conditional** | Environment-controlled deployment, separate deploy service |
| `docker-compose.override.yml` | **Local Override** | Automatic local development overrides |

#### Data Persistence

Docker Compose automatically creates persistent volumes for:
- **Game Pool**: `./data/gamePool.json`
- **Activities**: `./data/extraActivities.json`
- **Weekly Plans**: `./data/weeklyPlans.json`
- **Logs**: `./logs/` (optional)

#### Manual Docker Deployment

If you prefer manual Docker commands:

```bash
# Build the image
docker build -t divnum-discord-bot .

# Run with environment file
docker run -d --env-file .env \
  -v $(pwd)/data:/app/data \
  --name divnum-discord-bot \
  divnum-discord-bot

# Or run with individual environment variables
docker run -d \
  -e DISCORD_TOKEN=your_token_here \
  -e DISCORD_CLIENT_ID=your_client_id_here \
  -v $(pwd)/data:/app/data \
  --name divnum-discord-bot \
  divnum-discord-bot
```

#### Docker Deployment Options

**Option 1: Automatic deployment (default)**
Commands are automatically deployed on every container start using `npm run start:deploy`.

**Option 2: Conditional deployment**
Use the alternative Dockerfile and control deployment with environment variables:

```bash
# Build alternative version
docker build -f Dockerfile.alternative -t divnum-discord-bot-conditional .

# Run with auto-deployment
docker run -d --env-file .env -e AUTO_DEPLOY_COMMANDS=true divnum-discord-bot-conditional

# Run without auto-deployment
docker run -d --env-file .env divnum-discord-bot-conditional
```

**Option 3: Manual deployment**
Deploy commands manually before starting:

```bash
# Deploy commands once
docker run --rm --env-file .env divnum-discord-bot npm run deploy:commands:built

# Then run the bot normally
docker run -d --env-file .env divnum-discord-bot npm start
```

### Command Deployment Details

The bot includes several scripts for command deployment:

- `npm run deploy:commands` - Deploy commands in development (uses tsx)
- `npm run deploy:commands:built` - Deploy commands from built JavaScript
- `npm run start:deploy` - Deploy commands then start bot (production)

Commands are automatically registered with Discord on startup when using Docker.

#### Docker Compose Management

**Common Docker Compose commands:**

```bash
# Start services
docker-compose up -d                    # Production
docker-compose -f docker-compose.dev.yml up -d    # Development

# View logs
docker-compose logs -f                  # Follow logs
docker-compose logs --tail=100          # Last 100 lines

# Restart services
docker-compose restart                  # Restart all services
docker-compose restart divnum-discord-bot   # Restart specific service

# Update and rebuild
docker-compose down                     # Stop services
docker-compose build --no-cache         # Rebuild images
docker-compose up -d                    # Start with new images

# Cleanup
docker-compose down -v                  # Stop and remove volumes
docker system prune                     # Clean up unused containers/images
```

**Environment file setup:**
```bash
# Copy the example environment file
cp .env.example .env

# Edit with your Discord credentials
nano .env  # or vim .env or code .env
```

**Health checks and monitoring:**
```bash
# Check service status
docker-compose ps

# Check health status
docker-compose exec divnum-discord-bot sh
docker inspect --format='{{.State.Health.Status}}' divnum-discord-bot

# View resource usage
docker stats divnum-discord-bot
```

**Data backup:**
```bash
# Backup game data
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Restore from backup
tar -xzf backup-20240101.tar.gz
```

## Template Credit

This bot is built using the [Discord Bot Template (TypeScript)](https://github.com/tellebma/template_discord_bot_ts) by tellebma, which provides:
- Modern TypeScript setup with strict type checking
- Discord.js v14 integration
- Command system architecture
- Development tooling (ESLint, Prettier, hot reload)
- Docker support
- Clean project structure with path aliases

## Example Usage Flow

1. **Setup**: Deploy bot and set auto-posting channel
2. **Add Games**: Build your game pool with various games
3. **Add Activities**: Schedule recurring weekly activities
4. **Automatic Plans**: Bot posts weekly plans every Monday
5. **Management**: Admins can toggle activities or generate manual plans

## License

MIT