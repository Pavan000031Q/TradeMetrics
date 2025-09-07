import { showPage } from './ui.js';

const staticNews = [
    { category: 'Market Analysis', headline: 'Nifty 50 Faces Resistance at 23,500; Analysts Advise Caution', summary: 'The benchmark Nifty 50 index is showing signs of consolidation after a strong rally. Key technical indicators suggest a possible pullback before the next leg up.', source: 'Economic Times', date: 'Aug 15, 2025', company: 'Nifty' },
    { category: 'Corporate News', headline: 'Reliance Industries Announces Major Investment in Green Energy Sector', summary: 'Reliance Industries has unveiled a ₹75,000 crore plan to build four giga-factories for renewable energy, aiming to become a global leader in green hydrogen.', source: 'Livemint', date: 'Aug 15, 2025', company: 'Reliance' },
    { category: 'Global Impact', headline: 'US Federal Reserve Hints at Tapering; Emerging Markets on Alert', summary: 'Recent statements from the US Federal Reserve suggest a potential reduction in its bond-buying program, which could lead to volatility in emerging markets like India.', source: 'Reuters', date: 'Aug 14, 2025', company: 'Federal Reserve' },
    { category: 'Corporate News', headline: 'Tata Motors Reports Strong Q2 Sales Growth Driven by EV Demand', summary: 'Tata Motors has posted a 25% year-on-year increase in passenger vehicle sales for the second quarter, largely fueled by the soaring popularity of its electric vehicle lineup.', source: 'Business Standard', date: 'Aug 14, 2025', company: 'Tata Motors' },
    { category: 'Economy', headline: 'RBI Holds Repo Rate Steady Amid Inflation Concerns', summary: 'The Reserve Bank of India\'s Monetary Policy Committee has decided to keep the repo rate unchanged at 4%, citing persistent inflationary pressures in the economy.', source: 'The Hindu', date: 'Aug 13, 2025', company: 'RBI' },
    { category: 'IPO News', headline: 'Paytm IPO: Analysts Divided on Valuation Ahead of Mega Listing', summary: 'With one of India\'s largest IPOs on the horizon, market analysts are expressing mixed views on Paytm\'s high valuation, advising investors to weigh the risks and growth potential carefully.', source: 'Moneycontrol', date: 'Aug 12, 2025', company: 'Paytm' }
];

export function setupNews() {
    const newsContainer = document.getElementById('news-container');
    const newsSearchInput = document.getElementById('newsSearchInput');

    renderNews(); // Initial render of all news articles

    if (newsSearchInput) {
        newsSearchInput.addEventListener('input', (e) => {
            renderNews(e.target.value);
        });
    }

    function renderNews(filter = '') {
        if (!newsContainer) return;
        newsContainer.innerHTML = '';
        const filteredNews = staticNews.filter(article => article.headline.toLowerCase().includes(filter.toLowerCase()) || article.company.toLowerCase().includes(filter.toLowerCase()));

        if (filteredNews.length === 0) {
            newsContainer.innerHTML = '<p class="text-center col-span-full text-gray-500">No news found for your search.</p>';
            return;
        }

        filteredNews.forEach(article => {
            const newsEl = document.createElement('div');
            newsEl.className = 'bg-black border border-gray-800 rounded-lg p-4 flex flex-col';
            newsEl.innerHTML = `
                <div>
                    <span class="text-xs font-semibold uppercase primary-text">${article.category}</span>
                    <h3 class="text-lg font-bold mt-2 text-white">${article.headline}</h3>
                    <p class="text-sm text-gray-400 mt-2 flex-grow">${article.summary}</p>
                </div>
                <div class="text-xs text-gray-500 mt-4">
                    <span>${article.source}</span> | <span>${article.date}</span>
                </div>
            `;
            newsContainer.appendChild(newsEl);
        });
    }
}
