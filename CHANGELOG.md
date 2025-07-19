# Changelog (TypeScript)

## [2.1.0] - 2025-07-19

### Added - Game Pool Management System
- **Game Pool Commands**: Complete CRUD operations for game management
  - `/addgame` - Add games with detailed properties (name, description, category, player counts)
  - `/gamepool` - View all games with rich Discord embeds and filtering
- **Game Properties**: Comprehensive game data structure with metadata
  - Name, description, category, min/max players, timestamps, user tracking
  - Unique game validation and duplicate prevention
  - Rich embed formatting with player counts and categories

### Added - Extra Activities System
- **Activity Management**: Day-specific scheduling system
  - `/addactivity` - Schedule activities for specific days of the week
  - `/activities` - View activities grouped by day with active/inactive filtering
  - `/manageactivity` - Admin controls with toggle, edit, and remove subcommands
- **Activity Properties**: Comprehensive activity data structure
  - Name, description, location, time, day-of-week, active status
  - Day-specific scheduling (Sunday=0 to Saturday=6)
  - Location and time tracking for real-world events

### Added - Weekly Planning System
- **Automatic Scheduling**: Monday morning game plan generation
  - Weekly plans posted every Monday at 10:00 AM automatically
  - Random game selection (up to 5 games per week)
  - Integration of all active extra activities organized by day
- **Manual Planning**: On-demand plan generation
  - `/weeklyplan` - Generate immediate weekly plans for any channel
  - `/setchannel` - Configure automatic posting channel with admin permissions
- **Rich Plan Format**: Professional Discord embeds with organized sections
  - Games section with detailed information and player counts
  - Extra activities section organized by day of week
  - Week date ranges and comprehensive formatting

### Added - Data Persistence System
- **JSON Storage**: File-based persistent storage system
  - `data/gamePool.json` - Game pool database with full metadata
  - `data/extraActivities.json` - Activities database with scheduling info
  - `data/weeklyPlans.json` - Historical weekly plan storage (last 10 plans)
- **Data Management**: Automatic file handling and error recovery
  - Singleton pattern managers for thread-safe operations
  - Automatic directory creation and file initialization
  - Error handling with graceful fallbacks

### Added - Permission System
- **Role-Based Access**: Tiered permission system for bot operations
  - Regular users: View pools, add games/activities, generate manual plans
  - Admins (Manage Messages): Set channels, manage activities, full controls
- **Command Security**: Permission validation on sensitive operations
  - Channel management requires administrative permissions
  - Activity management (toggle/edit/remove) restricted to admins

### Added - Docker Deployment System
- **Multiple Docker Configurations**: Comprehensive containerization
  - `Dockerfile` - Production deployment with automatic command deployment
  - `Dockerfile.alternative` - Conditional deployment with environment control
  - Multi-stage builds for optimized production images
- **Docker Compose Setup**: Complete orchestration configurations
  - `docker-compose.yml` - Production deployment with data persistence
  - `docker-compose.dev.yml` - Development environment with hot reload
  - `docker-compose.conditional.yml` - Environment-controlled deployment
  - `docker-compose.override.yml` - Local development overrides
- **Automatic Command Deployment**: Startup command registration
  - `npm run start:deploy` - Production script with command deployment
  - `npm run deploy:commands:built` - Built JavaScript command deployment
  - Environment-controlled deployment options
- **Data Persistence**: Volume mounting for persistent storage
  - Game pool and activity data preserved across container restarts
  - Optional log directory mounting for debugging
  - Backup and restore procedures documented

### Added - Development Tools
- **Enhanced Scripts**: Additional npm scripts for deployment
  - Command deployment scripts for development and production
  - Conditional deployment options for flexible environments
- **Startup Scripts**: Shell scripts for controlled deployment
  - `scripts/start.sh` - Basic startup with command deployment
  - `scripts/conditional-start.sh` - Environment-controlled startup
- **Docker Optimization**: Improved build performance and security
  - Updated `.dockerignore` for faster builds
  - Multi-stage builds reducing final image size
  - Non-root user configuration for enhanced security

### Enhanced - Type System
- **New Type Definitions**: Comprehensive TypeScript interfaces
  - `Game` interface with full metadata properties
  - `ExtraActivity` interface with scheduling properties
  - `WeeklyPlan` interface combining games and activities
  - Manager classes with full type safety
- **Data Validation**: Type-safe operations throughout the system
  - Strict input validation on all commands
  - Type-safe storage and retrieval operations
  - Comprehensive error handling with type checking

### Enhanced - Documentation
- **Complete README**: Comprehensive documentation overhaul
  - Feature overview with command explanations
  - System architecture documentation
  - Docker deployment guide with multiple options
  - Template attribution and credit
- **Usage Examples**: Real-world command examples and workflows
  - JSON data structure examples
  - Docker Compose usage scenarios
  - Development and production deployment guides

### Changed - Architecture
- **Modular Design**: Clean separation of concerns
  - Database managers for game pool and activities
  - Scheduler system for weekly planning automation
  - Command organization by functionality
- **Singleton Patterns**: Thread-safe data management
  - GamePoolManager and ExtraActivitiesManager singletons
  - WeeklyPlanner singleton for consistent scheduling

## [2.0.0] - 2025-07-18

### Updated
- **Node.js**: Updated minimum version from v18 to v20 (latest LTS)
- **TypeScript**: Updated to v5.7.2 (latest stable)
- **discord.js**: Updated to v14.17.0 (latest stable)
- **dotenv**: Updated to v16.4.5
- **@types/node**: Updated to v22.10.2
- **@typescript-eslint**: Updated to v8.18.1
- **eslint**: Updated to v9.17.0 with new flat config format
- **prettier**: Updated to v3.4.2
- **tsx**: Updated to v4.19.2
- **rimraf**: Updated to v6.0.1

### Added
- New ESLint v9 flat configuration format with TypeScript support
- Enhanced TypeScript configuration with ES2023 target
- NodeNext module resolution for better compatibility
- Multi-stage Docker builds for optimized production images
- Improved type safety with stricter compiler options

### Changed
- Docker base image updated to node:22-alpine
- TypeScript target updated to ES2023
- Module system updated to NodeNext for better Node.js compatibility
- Enhanced ESLint configuration with latest TypeScript rules
- Improved Docker security with proper user permissions

### TypeScript Specific
- Updated tsconfig.json with latest TypeScript 5.7 features
- Enhanced type definitions for better IntelliSense
- Improved module resolution with NodeNext
- Better ESM/CommonJS interoperability
- Stricter type checking with latest compiler options

### Security
- Updated all dependencies to latest secure versions
- Improved Docker security with multi-stage builds
- Enhanced type safety preventing runtime errors
- Better input validation with strict TypeScript types

## [1.0.0] - Initial Release

### Added
- TypeScript Discord bot template with Discord.js v14
- Full type safety with strict TypeScript configuration
- Advanced command system with generics
- Path mapping for clean imports
- Hot reload development with tsx
- Comprehensive type definitions
- Docker support with TypeScript builds