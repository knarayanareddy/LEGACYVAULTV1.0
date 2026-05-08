import { redis } from '../config/redis';
import { config } from '../config/constants';

interface PriceData {
  price: number;
  change24h: number | null;
}

interface TokenMetadata {
  symbol: string;
  name: string;
  icon: string | null;
  decimals: number;
}

const PRICE_CACHE_TTL = 60;        // 60 seconds
const METADATA_CACHE_TTL = 3600;   // 1 hour

const SOL_MINT = 'So11111111111111111111111111111111111111112';

// ─────────────────────────────────────────────────────────────────────────────
// Price fetching
// ─────────────────────────────────────────────────────────────────────────────

async function fetchPriceFromJupiter(mint: string): Promise<PriceData> {
  try {
    const res = await fetch(
      `https://price.jup.ag/v6/price?ids=${mint}&vsToken=USDC`
    );
    const json = (await res.json()) as any;
    const priceData = json?.data?.[mint];

    if (!priceData) return { price: 0, change24h: null };

    return {
      price: priceData.price ?? 0,
      change24h: null, // Jupiter v6 doesn't return 24h change
    };
  } catch {
    return { price: 0, change24h: null };
  }
}

async function fetchPriceFromBirdeye(mint: string): Promise<PriceData> {
  if (!config.birdeyeApiKey) return { price: 0, change24h: null };

  try {
    const res = await fetch(
      `https://public-api.birdeye.so/defi/price?address=${mint}`,
      { headers: { 'X-API-KEY': config.birdeyeApiKey } }
    );
    const json = (await res.json()) as any;
    const data = json?.data;

    return {
      price: data?.value ?? 0,
      change24h: data?.priceChange24h ?? null,
    };
  } catch {
    return { price: 0, change24h: null };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Token metadata fetching
// ─────────────────────────────────────────────────────────────────────────────

async function fetchMetadataFromHelius(mint: string): Promise<TokenMetadata> {
  if (!config.heliusApiKey) {
    return { symbol: mint.slice(0, 6), name: 'Unknown Token', icon: null, decimals: 9 };
  }

  try {
    const res = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${config.heliusApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mintAccounts: [mint] }),
      }
    );
    const json = (await res.json()) as any[];
    const token = json?.[0];

    if (!token) {
      return { symbol: mint.slice(0, 6), name: 'Unknown Token', icon: null, decimals: 9 };
    }

    const offChain = token?.offChainMetadata?.metadata;

    return {
      symbol: token?.onChainMetadata?.metadata?.data?.symbol ?? mint.slice(0, 6),
      name: token?.onChainMetadata?.metadata?.data?.name ?? 'Unknown Token',
      icon: offChain?.image ?? null,
      decimals: token?.onChainAccountInfo?.accountInfo?.data?.parsed?.info?.decimals ?? 9,
    };
  } catch {
    return { symbol: mint.slice(0, 6), name: 'Unknown Token', icon: null, decimals: 9 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public service interface
// ─────────────────────────────────────────────────────────────────────────────

export const marketDataService = {
  async getPrice(mint: string): Promise<PriceData> {
    const cacheKey = `price:${mint}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Try Jupiter first, then Birdeye
    let priceData = await fetchPriceFromJupiter(mint);
    if (priceData.price === 0) {
      priceData = await fetchPriceFromBirdeye(mint);
    }

    // SOL fallback price
    if (mint === SOL_MINT && priceData.price === 0) {
      priceData = { price: 150, change24h: null }; // reasonable default
    }

    await redis.setex(cacheKey, PRICE_CACHE_TTL, JSON.stringify(priceData));
    return priceData;
  },

  async getTokenMetadata(mint: string): Promise<TokenMetadata> {
    const cacheKey = `metadata:${mint}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const metadata = await fetchMetadataFromHelius(mint);
    await redis.setex(cacheKey, METADATA_CACHE_TTL, JSON.stringify(metadata));
    return metadata;
  },

  async capturePortfolioSnapshot(
    vaultPubkey: string,
    prisma: any
  ): Promise<void> {
    try {
      // Get assets via vaultService (circular import avoided by passing prisma)
      const { getVaultAssets } = await import('./vaultService');
      const assets = await getVaultAssets(vaultPubkey, 'all');

      const breakdown = assets.reduce(
        (acc, asset) => {
          const key = asset.type.toLowerCase() as 'sol' | 'spl' | 'nft' | 'position';
          acc[key] = (acc[key] || 0) + asset.usdValue;
          return acc;
        },
        { sol: 0, spl: 0, nft: 0, position: 0 } as Record<string, number>
      );

      const totalUsdValue = Object.values(breakdown).reduce((a, b) => a + b, 0);

      await prisma.portfolioSnapshot.create({
        data: {
          vaultPubkey,
          totalUsdValue,
          breakdown,
        },
      });
    } catch (error) {
      console.error(`Portfolio snapshot failed for vault ${vaultPubkey}:`, error);
    }
  },
};
