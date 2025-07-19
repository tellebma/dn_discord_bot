import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
import type { BotCommand, ExtendedClient } from '@/types/bot';

dotenvConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
}) as ExtendedClient;

client.commands = new Collection<string, BotCommand>();

async function loadCommands(): Promise<void> {
  const commands: any[] = [];
  const commandsPath = join(__dirname, 'commands');

  try {
    const commandFiles = readdirSync(commandsPath).filter(file => 
      file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      
      try {
        // Dynamic import for ES modules compatibility
        const commandModule = await import(filePath);
        const command = commandModule.default || commandModule;

        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command as BotCommand);
          commands.push(command.data.toJSON());
          console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
          console.log(`⚠️ Command at ${filePath} is missing required "data" or "execute" property.`);
        }
      } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error);
      }
    }
  } catch (error) {
    console.log('Commands directory not found, creating...');
    // In a real implementation, you might want to create the directory here
  }

  // Deploy commands
  if (commands.length > 0) {
    await deployCommands(commands);
  }
}

async function loadEvents(): Promise<void> {
  const eventsPath = join(__dirname, 'events');

  try {
    const eventFiles = readdirSync(eventsPath).filter(file => 
      file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);
      
      try {
        const eventModule = await import(filePath);
        const event = eventModule.default || eventModule;

        if (event.once) {
          client.once(event.name, (...args: any[]) => event.execute(...args));
        } else {
          client.on(event.name, (...args: any[]) => event.execute(...args));
        }
        console.log(`✅ Loaded event: ${event.name}`);
      } catch (error) {
        console.error(`❌ Error loading event ${file}:`, error);
      }
    }
  } catch (error) {
    console.log('Events directory not found, creating...');
  }
}

async function deployCommands(commands: any[]): Promise<void> {
  if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
    throw new Error('Missing required environment variables: DISCORD_TOKEN or DISCORD_CLIENT_ID');
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('🔄 Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);

    const errorMessage = {
      content: 'There was an error while executing this command!',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

client.once('ready', async () => {
  console.log(`🤖 Bot is ready! Logged in as ${client.user?.tag}`);
});

// Global error handlers
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Initialize the bot
async function start(): Promise<void> {
  try {
    await loadEvents();
    await loadCommands();
    
    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN is required');
    }
    
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

void start();