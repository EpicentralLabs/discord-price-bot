import { Client, REST, Routes, MessageFlags, ChatInputCommandInteraction } from "discord.js";
import * as price from "./price";
import { config } from "../config";

// Create a map of command handlers
const commandHandlers = {
  [price.command.name]: price.handlePriceCommand,
} as const;

export async function setupCommands(client: Client) {
  if (!client.application) {
    throw new Error("Client application is not ready");
  }

  console.log("Setting up commands...");

  const commands = [
    price.command,
  ].map((command) => command.toJSON());
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
  try {
    // Global commands (can take up to 1 hour) with our a guild ID 
    await rest.put(Routes.applicationGuildCommands(client.application.id, config.DEFAULT_GUILD_ID), {
    // await rest.put(Routes.applicationCommands(client.application.id), {
      body: commands,
    });
    console.log("Successfully reloaded application (/) commands:");
    commands.forEach((cmd) => {
      console.log(`- /${cmd.name}: ${cmd.description}`);
    });
  } catch (error) {
    console.error("Error registering commands:", error);
  }

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    console.log(
      `${commandName} command used by ${interaction.user.tag} (${interaction.user.id})`
    );

    try {
      const handler = commandHandlers[commandName];
      if (handler) {
        await handler(interaction);
      } else {
        await interaction.reply({
          content: "Unknown command",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      console.error(`Error handling command ${commandName}:`, error);
      await interaction.reply({
        content: "There was an error executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  });
}
