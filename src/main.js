import { showPage, setupNav, showCustomMessage } from './modules/ui.js';
import { fetchMarketData } from './modules/marketData.js';
import { setupSwingTradeAnalysis } from './modules/aiInsights.js';
import { setupCalculators } from './modules/calculators.js';
import { setupPortfolio } from './modules/portfolio.js';
import { setupWatchlist } from './modules/watchlist.js';
import { setupNews } from './modules/news.js';

document.addEventListener('DOMContentLoaded', function() {
    setupNav();
    showPage('home');
    fetchMarketData();
    setupSwingTradeAnalysis();
    setupCalculators();
    setupPortfolio();
    setupWatchlist();
    setupNews();

    // Fetch market data every 3 minutes
    setInterval(fetchMarketData, 180000);
});
