import { config } from "../config";

export const formatters = {
  usdValue: (value: string | number): string => {
    // Remove any existing commas
    const cleanValue = typeof value === "string" ? value.replace(/,/g, "") : value.toString();
    // Parse to float and fix decimal places
    const numberValue = parseFloat(cleanValue);
    // Format with locale string to handle grouping correctly
    return numberValue.toLocaleString("en-US", {
      minimumFractionDigits: config.PRICE_DECIMAL_PLACES,
      maximumFractionDigits: config.PRICE_DECIMAL_PLACES,
    });
  },

  codeBlock: (value: string | number): string => {
    return `\`${value}\``;
  },
};
