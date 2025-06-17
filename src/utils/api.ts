export async function fetchTokenPrice(token: string): Promise<number> {
      const [jupData] = await Promise.all([
      fetch(
        `https://lite-api.jup.ag/price/v2?ids=${token}`
      ).then((res) => res.json()),
    ]);

    const price = parseFloat(
      jupData.data[token]?.price ?? "0"
    );

    return price 
}