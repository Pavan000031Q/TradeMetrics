import { PROXY_URL, MARKET_SYMBOLS } from '../config/apiConfig.js';

// --- Market Data Ticker (REBUILT FOR Your Personal Proxy) ---
async function fetchProxyQuote(marketSymbol) {
    const response = await fetch(`${PROXY_URL}?symbol=${marketSymbol.symbol}`);
    if (!response.ok) {
        throw new Error(`Proxy request failed with status: ${response.status}`);
    }
    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) {
        throw new Error(`Invalid data structure for symbol: ${marketSymbol.symbol}`);
    }
    return {
        name: marketSymbol.name,
        symbol: marketSymbol.symbol,
        current: meta.regularMarketPrice || 0,
        open: meta.chartPreviousClose || meta.regularMarketPrice || 0,
        change: meta.regularMarketPrice - meta.previousClose || 0,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 || 0
    };
}

export async function fetchMarketData() {
    const tickersContainer = document.getElementById('market-tickers');
    if (!tickersContainer) return;

    if (tickersContainer.innerHTML.trim() === '') {
        tickersContainer.innerHTML = '<div class="col-span-full text-center text-gray-500">Fetching live market data...</div>';
    }

    if (!PROXY_URL || PROXY_URL === 'https://YOUR_WORKER_URL') {
        renderMarketDataError('Please configure your Cloudflare Worker URL in src/config/apiConfig.js');
        return;
    }

    try {
        const promises = Object.values(MARKET_SYMBOLS).map(symbolInfo => fetchProxyQuote(symbolInfo));
        const marketData = await Promise.all(promises);
        renderMarketData(marketData);
    } catch (error) {
        console.error('Proxy fetch failed:', error.message);
        renderMarketDataError('Could not fetch live market data at this time.');
    }
}

function renderMarketData(marketData) {
    const tickersContainer = document.getElementById('market-tickers');
    if (!tickersContainer) return;

    if (tickersContainer.querySelector('div.col-span-full')) {
        tickersContainer.innerHTML = '';
    }

    marketData.forEach(market => {
        const tickerId = `ticker-${market.symbol.replace('^', '')}`;
        const existingTickerEl = document.getElementById(tickerId);

        const colorClass = market.current >= market.open ? 'text-green-400' : 'text-red-400';
        const flashClass = market.current >= market.open ? 'flash-green' : 'flash-red';
        const sign = market.change >= 0 ? '+' : '';

        if (existingTickerEl) {
            // UPDATE
            const priceEl = document.getElementById(`${tickerId}-price`);
            const changeEl = document.getElementById(`${tickerId}-change`);

            if (priceEl.textContent !== market.current.toFixed(2)) {
                priceEl.textContent = market.current.toFixed(2);
                changeEl.textContent = `${sign}${market.change.toFixed(2)} (${sign}${market.changePercent.toFixed(2)}%)`;

                priceEl.className = `font-semibold text-lg ${colorClass}`;
                changeEl.className = `text-xs ${colorClass}`;

                existingTickerEl.classList.add(flashClass);
                setTimeout(() => {
                    existingTickerEl.classList.remove(flashClass);
                }, 700);
            }
        } else {
            // CREATE
            const tickerEl = document.createElement('div');
            tickerEl.id = tickerId;
            tickerEl.className = 'bg-gray-900 bg-opacity-50 border border-gray-800 rounded-lg p-3';

            tickerEl.innerHTML = `
                <p class="font-bold text-sm text-white">${market.name}</p>
                <p id="${tickerId}-price" class="font-semibold text-lg ${colorClass}">${market.current.toFixed(2)}</p>
                <p id="${tickerId}-change" class="text-xs ${colorClass}">${sign}${market.change.toFixed(2)} (${sign}${market.changePercent.toFixed(2)}%)</p>
            `;
            tickersContainer.appendChild(tickerEl);
        }
    });
}

function renderMarketDataError(message) {
    const tickersContainer = document.getElementById('market-tickers');
    if (!tickersContainer) return;
    tickersContainer.innerHTML = `<div class="col-span-full text-center text-red-400 p-4">${message}</div>`;
}
