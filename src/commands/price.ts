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
  fetchHistoricalChange,
  fetchTokenPriceVolume,
} from "../utils/api";
import { config } from "../config";

export const command = new SlashCommandBuilder()
  .setName("price-labs")
  .setDescription("Get the current prices and liquidity for LABS and SOL.");

/**
 * Handles the `/price-labs` Discord slash command by fetching and displaying current price, liquidity, market cap, holder count, and recent price changes for LABS and SOL tokens.
 *
 * Responds with an embedded message containing up-to-date token metrics, or an error message if data retrieval fails.
 */
export async function handlePriceCommand(
  interaction: ChatInputCommandInteraction
) {
  await handleTokenPriceCommand(interaction, CONSTANTS.TOKEN.LABS, "Labs");
}

/**
 * Generic handler for token price commands.
 * @param interaction - The Discord slash command interaction
 * @param token - The token address to fetch price data for
 * @param tokenName - Display name for the token (e.g., "Labs", "WattLabs")
 */
export async function handleTokenPriceCommand(
  interaction: ChatInputCommandInteraction,
  token: string,
  tokenName: string
) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  console.log("Fetching prices and liquidity...");

  try {
    const tokenPrice = await fetchTokenPrice(token);
    const solPrice = await fetchTokenPrice(CONSTANTS.TOKEN.SOL);
    const tokenOverview = await fetchTokenOverview(token);
    const { change1w, change1m } = await fetchHistoricalChange(
      token,
      tokenPrice
    );
    const [volumeData24h, volumeData1h] = await Promise.all([
      fetchTokenPriceVolume(token, "24h"),
      fetchTokenPriceVolume(token, "1h"),
    ]);

    if (tokenPrice && solPrice) {
      const formattedToken = `$${tokenPrice.toFixed(4)}`;
      const formattedSOL = `$${solPrice.toFixed(config.PRICE_DECIMAL_PLACES)}`;
      const tokenPerSol = tokenPrice / solPrice;
      const formattedTokenSol = tokenPerSol.toFixed(6);
      const formattedVolumeDUSD = volumeData24h
        ? `$${formatters.usdValue(volumeData24h.volumeUSD)}`
        : "N/A";
      const formattedVolumeHrUsd = volumeData1h
        ? `$${formatters.usdValue(volumeData1h.volumeUSD)}`
        : "N/A";

      const formattedTokenLiquidity = tokenOverview
        ? `$${formatters.usdValue(tokenOverview.liquidity)}`
        : "N/A";
      const formattedMarketCap = tokenOverview
        ? `$${formatters.usdValue(tokenOverview.marketCap)}`
        : "N/A";
      const formattedHolders = tokenOverview
        ? tokenOverview.holder.toString()
        : "N/A";
      const formattedPercent = tokenOverview
        ? `${tokenOverview.priceChange24hPercent.toFixed(2)}%`
        : "N/A";
      const formattedChange1w = change1w ? `${change1w.toFixed(2)}%` : "N/A";
      const formattedChange1m = change1m ? `${change1m.toFixed(2)}%` : "N/A";

      const embed = new EmbedBuilder()
        .setColor(CONSTANTS.COLORS.PRIMARY)
        .setTitle(`🟦 ${tokenName} Token Prices & Liquidity`)
        .addFields(
          {
            name: "Price",
            value: formatters.codeBlock(formattedToken),
            inline: true,
          },
          {
            name: "Liquidity",
            value: formatters.codeBlock(formattedTokenLiquidity),
            inline: true,
          },
          {
            name: `${tokenName}/SOL`,
            value: formatters.codeBlock(formattedTokenSol),
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
            name: "1D Change",
            value: formatters.codeBlock(formattedPercent),
            inline: true,
          },
          {
            name: "1W Change",
            value: formatters.codeBlock(formattedChange1w),
            inline: true,
          },
          {
            name: "1Mo Change",
            value: formatters.codeBlock(formattedChange1m),
            inline: true,
          },
          {
            name: "1Hr Volume",
            value: formatters.codeBlock(formattedVolumeHrUsd),
            inline: true,
          },
          {
            name: "1D Volume",
            value: formatters.codeBlock(formattedVolumeDUSD),
            inline: true,
          },
          { name: "\u200B", value: "\u200B", inline: true }, // filler for layout
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
