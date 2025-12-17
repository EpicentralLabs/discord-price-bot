import { Client, ActivityType } from "discord.js";
import { config } from "../config";
import { fetchTokenPrice } from "../utils/api";
import { CONSTANTS } from "../utils/constants";
import { TokenType } from "../utils/types";

export class StatusManager {
  private client: Client;
  private updateInterval: NodeJS.Timeout | null;
  private currentTokenIndex: number;
  private readonly tokens: TokenType[];

  constructor(client: Client) {
    this.client = client;
    this.updateInterval = null;
    this.currentTokenIndex = 0;
    this.tokens = [TokenType.LABS, TokenType.WATTLABS];
  }

  async updateBotStatus(token: TokenType): Promise<void> {
    try {
      console.log(`Attempting to update status...`);

      let tokenAddress = "";

      switch (token) {
        case TokenType.LABS:
          console.log("Updating status for LABS...")
          tokenAddress = CONSTANTS.TOKEN.LABS;
          break;
        case TokenType.WATTLABS:
          console.log("Updating status for wattLABS...")
          tokenAddress = CONSTANTS.TOKEN.WATTLABS;
          break;
        default:
          console.log("New token type detected, defaulting to LABS...");
          tokenAddress = CONSTANTS.TOKEN.LABS;
          break;
      }

      if (this.client.user) {
        const price = await fetchTokenPrice(tokenAddress);

        // Update nickname in all guilds
        for (const guild of this.client.guilds.cache.values()) {
          try {
            const me = guild.members.cache.get(this.client.user.id);
            if (me) {
              await me.setNickname("$"+price.toFixed(4));
            }
          } catch (err) {
            console.error(
              `Failed to update nickname in guild ${guild.name}:`,
              err
            );
          }
        }

        // Keep the existing watching status
        const status = `Tracking ${token} Price`;
        await this.client.user.setActivity(status, {
          type: ActivityType.Watching,
        });

        console.log(
          `Nickname and status updated successfully: ${price} | ${status}`
        );
      } else {
        console.error(`Failed to update status`);
      }
    } catch (error) {
      console.error(`Error updating status:`, error);
    }
  }

  startStatusLoop(): void {
    console.log("Starting status update loop...");

    // Clear any existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Immediate first update
    this.updateBotStatus(this.tokens[this.currentTokenIndex]);

    // Set up the interval
    this.updateInterval = setInterval(() => {
      this.currentTokenIndex =
        (this.currentTokenIndex + 1) % this.tokens.length;
      this.updateBotStatus(this.tokens[this.currentTokenIndex]);
    }, config.UPDATE_INTERVAL * 1000);

    console.log(
      `Status loop initialized with ${config.UPDATE_INTERVAL} second interval`
    );
  }

  stopStatusLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log("Status update loop stopped");
    }
  }
}
