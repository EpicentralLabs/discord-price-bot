import { Client, REST, Routes, MessageFlags } from "discord.js";
import * as price from "./price";
import * as wattlabs from "./wattlabs";
import { config } from "../config";

// Create a map of command handlers
const commandHandlers = {
  [price.command.name]: price.handlePriceCommand,
  [wattlabs.command.name]: wattlabs.handleWattlabsCommand,
} as const;

/**
 * Registers global Discord slash commands and sets up interaction handlers for the client.
 *
 * Throws an error if the client application is not ready. Registers commands globally using the Discord REST API and logs the registration status. Listens for chat input command interactions and dispatches them to the appropriate handler, replying with an error message if the command is unknown or if an exception occurs during handling.
 */
export async function setupCommands(client: Client) {
  if (!client.application) {
    throw new Error("Client application is not ready");
  }

  console.log("Setting up commands...");

  const commands = [
    price.command,
    wattlabs.command,
  ].map((command) => command.toJSON());
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
  try {
    // Global commands (can take up to 1 hour) without a guild ID 
    // await rest.put(Routes.applicationGuildCommands(client.application.id, config.DEFAULT_GUILD_ID), {
    await rest.put(Routes.applicationCommands(client.application.id), {
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
