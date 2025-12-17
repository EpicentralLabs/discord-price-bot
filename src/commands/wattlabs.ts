import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { CONSTANTS } from "../utils/constants";
import { handleTokenPriceCommand } from "./price";

export const command = new SlashCommandBuilder()
  .setName("price-wattlabs")
  .setDescription("Get the current prices and liquidity for WATTLABS and SOL.");

/**
 * Handles the `/price-wattlabs` Discord slash command by fetching and displaying current price, liquidity, market cap, holder count, and recent price changes for WATTLABS and SOL tokens.
 *
 * Responds with an embedded message containing up-to-date token metrics, or an error message if data retrieval fails.
 */
export async function handleWattlabsCommand(
  interaction: ChatInputCommandInteraction
) {
  await handleTokenPriceCommand(interaction, CONSTANTS.TOKEN.WATTLABS, "WattLabs");
}