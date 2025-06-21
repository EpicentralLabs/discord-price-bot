import { CONSTANTS } from "./constants";

export async function fetchTokenPrice(token: string): Promise<number> {
  const [jupData] = await Promise.all([
    fetch(`https://lite-api.jup.ag/price/v2?ids=${token}`).then((res) =>
      res.json()
    ),
  ]);

  const price = parseFloat(jupData.data[token]?.price ?? "0");

  return price;
}

export async function fetchLiquidity(address: string): Promise<number | null> {
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

export async function fetchTokenOverview(address: string): Promise<{
  marketCap: number;
  priceChange24hPercent: number;
  holder: number;
  liquidity: number;
  raw: any;
} | null> {
  const token = process.env.BIRDEYE_TOKEN;
  if (!token) {
    console.warn("BirdEye API token is missing.");
    return null;
  }
  try {
    const res = await fetch(
      `https://public-api.birdeye.so/defi/token_overview?address=${address}&frames=24h`,
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
      console.warn(`BirdEye API error (token_overview): ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    if (!data?.success || !data.data) return null;
    return {
      marketCap: data.data.marketCap,
      priceChange24hPercent: data.data.priceChange24hPercent,
      holder: data.data.holder,
      liquidity: data.data.liquidity,
      raw: data.data,
    };
  } catch (err) {
    console.error("Failed to fetch LABS token overview:", err);
    return null;
  }
}

export async function fetchLabsHistoricalChange(currentPrice: number): Promise<{
  change1w: number | null;
  change1m: number | null;
}> {
  const token = process.env.BIRDEYE_TOKEN;
  if (!token) {
    console.warn("BirdEye API token is missing.");
    return { change1w: null, change1m: null };
  }

  const address = CONSTANTS.TOKEN.LABS;
  const now = Math.floor(Date.now() / 1000);
  const oneWeekAgo = now - 7 * 24 * 60 * 60;
  const oneMonthAgo = now - 30 * 24 * 60 * 60;
  const MAX_TIMESTAMP = 10000000000; // Maximum Unix timestamp for API queries

  const url = `https://public-api.birdeye.so/defi/history_price?address=${address}&address_type=token&type=1D&time_from=${oneMonthAgo}&time_to=${MAX_TIMESTAMP}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-chain": "solana",
        "X-API-KEY": token,
      },
    });
    if (!res.ok) {
      console.warn(`BirdEye API error (history_price): ${res.statusText}`);
      return { change1w: null, change1m: null };
    }
    const data = await res.json();
    if (!data?.success || !data.data?.items?.length)
      return { change1w: null, change1m: null };

    // Find the closest price to 1w and 1m ago
    let price1w: number | null = null;
    let price1m: number | null = null;
    let minDiff1w = Infinity;
    let minDiff1m = Infinity;

    for (const item of data.data.items) {
      const diff1w = Math.abs(item.unixTime - oneWeekAgo);
      if (diff1w < minDiff1w) {
        minDiff1w = diff1w;
        price1w = item.value;
      }
      const diff1m = Math.abs(item.unixTime - oneMonthAgo);
      if (diff1m < minDiff1m) {
        minDiff1m = diff1m;
        price1m = item.value;
      }
    }

    const change1w = price1w
      ? ((currentPrice - price1w) / price1w) * 100
      : null;
    const change1m = price1m
      ? ((currentPrice - price1m) / price1m) * 100
      : null;

    return { change1w, change1m };
  } catch (err) {
    console.error("Failed to fetch LABS historical price:", err);
    return { change1w: null, change1m: null };
  }
}
