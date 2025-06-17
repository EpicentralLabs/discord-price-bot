import { Client, ActivityType } from "discord.js";
import { config } from "../config";
import { fetchTokenPrice } from "../utils/api";
import { CONSTANTS } from "../utils/constants";

export class StatusManager {
  private client: Client;
  private updateInterval: NodeJS.Timeout | null;

  constructor(client: Client) {
    this.client = client;
    this.updateInterval = null;
  }

  async updateBotStatus(): Promise<void> {
    try {
      console.log(`Attempting to update status...`);

      if (this.client.user) {
        const labsPrice = await fetchTokenPrice(CONSTANTS.TOKEN.LABS);

        // Update nickname in all guilds
        for (const guild of this.client.guilds.cache.values()) {
          try {
            const me = guild.members.cache.get(this.client.user.id);
            if (me) {
              await me.setNickname("$"+labsPrice.toFixed(4));
            }
          } catch (err) {
            console.error(
              `Failed to update nickname in guild ${guild.name}:`,
              err
            );
          }
        }

        // Keep the existing watching status
        const status = `LABS Price`;
        await this.client.user.setActivity(status, {
          type: ActivityType.Watching,
        });

        console.log(
          `Nickname and status updated successfully: ${labsPrice} | ${status}`
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
    this.updateBotStatus();

    // Set up the interval
    this.updateInterval = setInterval(() => {
      this.updateBotStatus();
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
