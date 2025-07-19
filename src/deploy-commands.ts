import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

async function deployCommands(): Promise<void> {
  const commands: any[] = [];
  const commandsPath = join(__dirname, 'commands');

  try {
    const commandFiles = readdirSync(commandsPath).filter(file => 
      file.endsWith('.ts') || file.endsWith('.js')
    );

    console.log('🔍 Loading commands for deployment...');

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      
      try {
        const commandModule = await import(filePath);
        const command = commandModule.default || commandModule;

        if ('data' in command && 'execute' in command) {
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
    console.error('❌ Error reading commands directory:', error);
    process.exit(1);
  }

  if (commands.length === 0) {
    console.log('⚠️ No commands found to deploy.');
    return;
  }

  if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
    console.error('❌ Missing required environment variables: DISCORD_TOKEN or DISCORD_CLIENT_ID');
    process.exit(1);
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    ) as any[];

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    process.exit(1);
  }
}

// Run the deployment
void deployCommands();