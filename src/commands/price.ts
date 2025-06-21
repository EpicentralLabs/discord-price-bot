import {
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { formatters } from "../utils/formatters";
import { CONSTANTS } from "../utils/constants";
import {
  fetchTokenPrice,
  fetchTokenOverview,
  fetchLabsHistoricalChange,
} from "../utils/api";
import { config } from "../config";

export const command = new SlashCommandBuilder()
  .setName("price")
  .setDescription("Get the current prices and liquidity for LABS and SOL.");

export async function handlePriceCommand(
  interaction: ChatInputCommandInteraction
) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  console.log("Fetching prices and liquidity...");

  try {
    const labsPrice = await fetchTokenPrice(CONSTANTS.TOKEN.LABS);
    const solPrice = await fetchTokenPrice(CONSTANTS.TOKEN.SOL);
    const labsOverview = await fetchTokenOverview(CONSTANTS.TOKEN.LABS);
    const { change1w, change1m } = await fetchLabsHistoricalChange(labsPrice);

    if (labsPrice && solPrice) {
      const formattedLabs = `$${labsPrice.toFixed(4)}`;
      const formattedSOL = `$${solPrice.toFixed(config.PRICE_DECIMAL_PLACES)}`;
      const labsPerSol = labsPrice / solPrice;
      const formattedLabsSol = labsPerSol.toFixed(6);

      const formattedLabsLiquidity = labsOverview
        ? `$${formatters.usdValue(labsOverview.liquidity)}`
        : "N/A";
      const formattedMarketCap = labsOverview
        ? `$${formatters.usdValue(labsOverview.marketCap)}`
        : "N/A";
      const formattedHolders = labsOverview
        ? labsOverview.holder.toString()
        : "N/A";
      const formattedPercent = labsOverview
        ? `${labsOverview.priceChange24hPercent.toFixed(2)}%`
        : "N/A";
      const formattedChange1w = change1w ? `${change1w.toFixed(2)}%` : "N/A";
      const formattedChange1m = change1m ? `${change1m.toFixed(2)}%` : "N/A";

      const embed = new EmbedBuilder()
        .setColor(CONSTANTS.COLORS.PRIMARY)
        .setTitle("🟦 Labs Token Prices & Liquidity")
        .addFields(
          {
            name: "Price",
            value: formatters.codeBlock(formattedLabs),
            inline: true,
          },
          {
            name: "Liquidity",
            value: formatters.codeBlock(formattedLabsLiquidity),
            inline: true,
          },
          {
            name: "LABS/SOL",
            value: formatters.codeBlock(formattedLabsSol),
            inline: true,
          },
          {
            name: "Market Cap",
            value: formatters.codeBlock(formattedMarketCap),
            inline: true,
          },
          {
            name: "Holders",
            value: formatters.codeBlock(formattedHolders),
            inline: true,
          },
          { name: "\u200B", value: "\u200B", inline: true }, // filler for layout
          {
            name: "1d Change",
            value: formatters.codeBlock(formattedPercent),
            inline: true,
          },
          {
            name: "1w Change",
            value: formatters.codeBlock(formattedChange1w),
            inline: true,
          },
          {
            name: "1m Change",
            value: formatters.codeBlock(formattedChange1m),
            inline: true,
          },
          { name: "**📈 Market Tokens**", value: "", inline: false },
          {
            name: "SOL",
            value: formatters.codeBlock(formattedSOL),
            inline: true,
          }
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
