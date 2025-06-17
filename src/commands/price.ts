import {
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { formatters } from "../utils/formatters";
import { CONSTANTS } from "../utils/constants";
import { fetchTokenPrice } from "../utils/api";
import { config } from "../config";

async function fetchLiquidity(address: string): Promise<number | null> {
  const token = process.env.BIRDEYE_TOKEN;

  if (!token) {
    console.warn("BirdEye API token is missing.");
    return null;
  }
  try {
    const res = await fetch(
      `https://public-api.birdeye.so/defi/price?include_liquidity=true&address=${address}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-chain": "solana",
          "X-API-KEY": token,
        },
      }
    );
    if (!res.ok) {
      console.warn(`BirdEye API error for ${address}: ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data?.success ? data.data.liquidity ?? null : null;
  } catch (err) {
    console.error(`Failed to fetch liquidity for ${address}:`, err);
    return null;
  }
}

export const command = new SlashCommandBuilder()
  .setName("price")
  .setDescription("Get the current prices and liquidity for LABS and SOL.");

export async function handlePriceCommand(
  interaction: ChatInputCommandInteraction
) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  console.log("Fetching prices and liquidity...");

  try {
    const liquidity = await fetchLiquidity(CONSTANTS.TOKEN.LABS)
    const labsPrice = await fetchTokenPrice(CONSTANTS.TOKEN.LABS)
    const solPrice = await fetchTokenPrice(CONSTANTS.TOKEN.SOL);

    if (labsPrice && solPrice) {
      const formattedLabs = `$${labsPrice.toFixed(4)}`;
      const formattedSOL = `$${solPrice.toFixed(config.PRICE_DECIMAL_PLACES)}`;
      const labsPerSol = labsPrice / solPrice;
      const formattedLabsSol = labsPerSol.toFixed(6);

      const formattedLabsLiquidity =
        liquidity !== null ? `$${formatters.usdValue(liquidity)}` : "N/A";

      const embed = new EmbedBuilder()
        .setColor(CONSTANTS.COLORS.PRIMARY)
        .setTitle("🟦 Labs Token Prices & Liquidity")
        .addFields(
          { name: "Price", value: formatters.codeBlock(formattedLabs), inline: true },
          {
            name: "Liquidity",
            value: formatters.codeBlock(formattedLabsLiquidity),
            inline: true,
          },
          { name: "LABS/SOL", value: formatters.codeBlock(formattedLabsSol), inline: true },

          { name: "**📈 Market Tokens**", value: "", inline: false },
          { name: "SOL", value: formatters.codeBlock(formattedSOL), inline: true },
        )
        .setFooter({ text: "Prices from BirdEye and Jupiter APIs" });

      await interaction.editReply({ embeds: [embed] });
    } else {
      console.error("Missing price data");
      await interaction.editReply({
        content: "Could not fetch all token prices at the moment.",
      });
    }
  } catch (error) {
    console.error("Error in /price command:", error);
    await interaction.editReply({
      content: "An error occurred while fetching prices and liquidity.",
    });
  }
}
