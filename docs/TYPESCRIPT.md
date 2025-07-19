# TypeScript Guide

This guide covers TypeScript-specific features and best practices for the Discord bot template.

## TypeScript Configuration

### tsconfig.json Features

The template uses strict TypeScript configuration for maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Path Mapping

Clean imports using path aliases:

```typescript
// Instead of: import { Logger } from '../../../utils/logger';
import { Logger } from '@/utils/logger';
import { createStandardCommand } from '@/utils/commandTemplate';
import type { CommandConfig } from '@/types/bot';
```

Available aliases:
- `@/*` - src root
- `@/commands/*` - commands directory
- `@/events/*` - events directory
- `@/utils/*` - utilities directory
- `@/types/*` - type definitions
- `@/fonctions/*` - business logic

## Type Definitions

### Core Types

The bot uses comprehensive type definitions in `src/types/bot.ts`:

```typescript
// Command interface
export interface BotCommand {
  data: SlashCommandBuilder;
  execute: (interaction: any) => Promise<void>;
}

// Extended client with commands collection
export interface ExtendedClient extends Client {
  commands: Collection<string, BotCommand>;
}

// Command configuration with strict typing
export interface CommandConfig {
  name: string;
  description: string;
  category?: string;
  permissions?: string[];
  cooldown?: number;
  data: SlashCommandBuilder;
  parameters?: CommandParameter[];
  handler: CommandHandler;
}
```

### Parameter Types

Strongly typed parameter definitions:

```typescript
export interface CommandParameter {
  type: ParameterType;
  name: string;
  description: string;
  required?: boolean;
  choices?: ParameterChoice[];
  validation?: ParameterValidation;
}

export type ParameterType = 
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'user'
  | 'channel'
  | 'role'
  | 'mentionable'
  | 'attachment';
```

### Command Handlers

Type-safe command handlers:

```typescript
export type CommandHandler = (
  interaction: ChatInputCommandInteraction, 
  params: Record<string, any>
) => Promise<void>;
```

## Creating Typed Commands

### Basic Typed Command

```typescript
import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('An example command'),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply('Hello World!');
  },
};
```

### Template Command with Types

```typescript
import { SlashCommandBuilder } from 'discord.js';
import { createStandardCommand } from '@/utils/commandTemplate';
import type { ChatInputCommandInteraction, User } from 'discord.js';

const commandData = new SlashCommandBuilder()
  .setName('greet')
  .setDescription('Greet a user')
  .addUserOption(option =>
    option.setName('user').setDescription('User to greet').setRequired(true)
  );

export default createStandardCommand({
  name: 'greet',
  description: 'Greet a user',
  category: 'social',
  data: commandData,
  parameters: [
    {
      type: 'user',
      name: 'user',
      description: 'User to greet',
      required: true,
    },
  ],
  handler: async (
    interaction: ChatInputCommandInteraction,
    params: Record<string, any>
  ): Promise<void> => {
    const user = params.user as User; // Type assertion for safety
    await interaction.reply(`Hello, ${user.toString()}!`);
  },
});
```

### Generic Command Template

For advanced type safety, you can create generic command templates:

```typescript
interface TypedParams {
  user?: User;
  message?: string;
  count?: number;
}

const handler = async (
  interaction: ChatInputCommandInteraction,
  params: TypedParams
): Promise<void> => {
  // params are now strictly typed
  if (params.user) {
    // TypeScript knows this is a User
    await interaction.reply(`Hello ${params.user.username}!`);
  }
};
```

## Type-Safe Utilities

### Logger with Types

```typescript
import type { LogContext } from '@/types/bot';

interface CustomLogContext extends LogContext {
  commandName: string;
  userId: string;
  guildId?: string;
}

const context: CustomLogContext = {
  commandName: 'ping',
  userId: interaction.user.id,
  guildId: interaction.guild?.id,
};

Logger.info('Command executed', context);
```

### Configuration Types

```typescript
import type { ConfigType } from '@/types/bot';

// Type-safe configuration access
const config: ConfigType = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
  },
  bot: {
    isDevelopment: process.env.NODE_ENV === 'development',
  },
};
```

## Command Generation with Types

### Typed Command Generator

```typescript
import { CommandGenerator } from '@/utils/commandGenerator';
import type { CommandParameter } from '@/types/bot';

const parameters: CommandParameter[] = [
  {
    type: 'user',
    name: 'target',
    description: 'User to mention',
    required: true,
  },
  {
    type: 'string',
    name: 'message',
    description: 'Message to send',
    required: false,
    validation: {
      minLength: 1,
      maxLength: 100,
    },
  },
];

const content = CommandGenerator.generateCommand('mention', {
  description: 'Mention a user with a message',
  parameters,
  useTemplate: true,
});
```

## Error Handling with Types

### Typed Error Context

```typescript
interface ErrorContext extends LogContext {
  commandName: string;
  errorType: string;
  stackTrace?: string;
}

try {
  await someOperation();
} catch (error) {
  const errorContext: ErrorContext = {
    commandName: 'example',
    errorType: error instanceof Error ? error.name : 'UnknownError',
    stackTrace: error instanceof Error ? error.stack : undefined,
    userId: interaction.user.id,
  };
  
  Logger.error('Command execution failed', errorContext);
}
```

### Type Guards

Use type guards for runtime type checking:

```typescript
function isUser(value: any): value is User {
  return value && typeof value === 'object' && 'id' in value && 'username' in value;
}

// Usage in command handler
if (isUser(params.target)) {
  // TypeScript now knows params.target is a User
  await interaction.reply(`Hello ${params.target.username}!`);
}
```

## Development Workflow

### Type Checking

```bash
# Check types without compilation
npm run type-check

# Watch mode for type checking
npx tsc --noEmit --watch
```

### Building

```bash
# Compile TypeScript
npm run build

# Clean and rebuild
npm run clean && npm run build
```

### Development

```bash
# Hot reload with tsx
npm run dev

# TypeScript compiler watch
npm run dev:build
```

## Best Practices

### 1. Strict Typing

Always use strict types instead of `any`:

```typescript
// Bad
const params: any = getParams();

// Good
const params: Record<string, unknown> = getParams();
const user = params.user as User; // Type assertion when needed
```

### 2. Interface Over Type

Use interfaces for object types:

```typescript
// Preferred
interface CommandOptions {
  name: string;
  description: string;
  category?: string;
}

// Less preferred for objects
type CommandOptions = {
  name: string;
  description: string;
  category?: string;
};
```

### 3. Utility Types

Leverage TypeScript utility types:

```typescript
// Pick specific properties
type CommandBasics = Pick<CommandConfig, 'name' | 'description'>;

// Make properties optional
type PartialCommand = Partial<CommandConfig>;

// Exclude properties
type CommandWithoutHandler = Omit<CommandConfig, 'handler'>;
```

### 4. Async/Await Types

Properly type async functions:

```typescript
// Explicit return type
async function fetchUser(id: string): Promise<User | null> {
  try {
    const user = await client.users.fetch(id);
    return user;
  } catch {
    return null;
  }
}
```

### 5. Generic Functions

Create reusable generic functions:

```typescript
function createTypedHandler<T>(
  validator: (params: any) => params is T,
  handler: (interaction: ChatInputCommandInteraction, params: T) => Promise<void>
) {
  return async (interaction: ChatInputCommandInteraction, params: any): Promise<void> => {
    if (validator(params)) {
      await handler(interaction, params);
    } else {
      throw new Error('Invalid parameters');
    }
  };
}
```

## Common TypeScript Errors

### 1. Strict Null Checks

```typescript
// Error: Object is possibly 'null'
const guild = interaction.guild;
const name = guild.name; // ❌

// Fix: Check for null
const guild = interaction.guild;
if (guild) {
  const name = guild.name; // ✅
}

// Or use optional chaining
const name = interaction.guild?.name; // ✅
```

### 2. Index Access

```typescript
// Error: Element implicitly has 'any' type
const value = params[key]; // ❌

// Fix: Type the object
const params: Record<string, unknown> = getParams();
const value = params[key]; // ✅
```

### 3. Type Assertions

```typescript
// Use type assertions carefully
const user = params.user as User; // Only if you're certain

// Better: Use type guards
if (isUser(params.user)) {
  // TypeScript knows it's a User here
  const username = params.user.username;
}
```

This TypeScript integration provides excellent developer experience with compile-time error checking, intelligent autocomplete, and maintainable code structure.