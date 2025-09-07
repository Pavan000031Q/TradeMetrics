// --- API Configuration (Using Your Personal Proxy) ---
// ⚠️ IMPORTANT: Paste your Cloudflare Worker URL here
export const PROXY_URL = 'https://trade-metrics-proxy.pacef58714.workers.dev/';

export const MARKET_SYMBOLS = {
    nifty: { name: 'Nifty 50', symbol: '^NSEI' },
    sensex: { name: 'Sensex', symbol: '^BSESN' },
    banknifty: { name: 'Bank Nifty', symbol: '^NSEBANK' },
    sp500: { name: 'S&P 500', symbol: '^GSPC' },
    nasdaq: { name: 'Nasdaq', symbol: '^IXIC' }
};
