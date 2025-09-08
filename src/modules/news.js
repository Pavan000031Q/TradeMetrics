import { showCustomMessage } from './ui.js';

// Configuration
const NEWS_FEEDS = [
    { name: 'Investing.com', url: 'https://www.investing.com/rss/news_25.rss' },
    { name: 'Reuters (Business)', url: 'http://feeds.reuters.com/reuters/businessNews' },
    { name: 'Moneycontrol (Indian Markets)', url: 'https://www.moneycontrol.com/rss/markets.xml' },
    { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms' },
    { name: 'Livemint (Markets)', url: 'https://lifestyle.livemint.com/rss/smart-living/innovation' },
    { name: 'The Hindu Business Line', url: 'https://www.thehindubusinessline.com/news/fe/feed/' }
];
const CORS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';
const MAX_ARTICLES_TO_STORE = 200; // Limit to prevent unlimited document growth
const DB_NAME = 'TradeMetricsNewsDB';
const DB_VERSION = 1;
const STORE_NAME = 'newsCache';

// Module state
let allNewsCache = [];
let newsDB = null;
let articleModal = null;
let articleContent = null;
let closeArticleModalBtn = null;

// --- IndexedDB Data Functions ---

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.errorCode);
            reject("Error opening DB");
        };

        request.onsuccess = (event) => {
            newsDB = event.target.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

async function saveNewsToDB() {
    if (!newsDB) return;
    const limitedCache = allNewsCache.slice(0, MAX_ARTICLES_TO_STORE);
    const transaction = newsDB.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put({ id: 'cachedArticles', articles: limitedCache, lastUpdated: new Date() });
}

async function loadNewsFromDB() {
    if (!newsDB) return [];
    return new Promise((resolve) => {
        const transaction = newsDB.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('cachedArticles');

        request.onsuccess = () => {
            resolve(request.result ? request.result.articles : []);
        };
        request.onerror = () => {
            resolve([]); // Resolve with empty array on error
        };
    });
}


async function fetchAndRenderNews() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    // Display cached news immediately
    displayNews(allNewsCache);
    if (allNewsCache.length === 0) {
        newsContainer.innerHTML = '<div class="col-span-full text-center p-4"><div class="loader"></div><p class="text-gray-400 mt-2">Fetching live news...</p></div>';
    }

    try {
        const liveNews = await fetchAllNews();
        
        const existingLinks = new Set(allNewsCache.map(article => article.link));
        const newArticles = liveNews.filter(article => !existingLinks.has(article.link));

        if (newArticles.length > 0) {
            allNewsCache = [...newArticles, ...allNewsCache];
            await saveNewsToDB();
            displayNews(allNewsCache, document.getElementById('newsSearchInput').value);
        }

    } catch (error) {
        console.error('Error fetching and rendering news:', error);
        if (allNewsCache.length === 0) {
             newsContainer.innerHTML = '<div class="col-span-full text-center text-red-400 p-4">Could not fetch live news at this time.</div>';
        }
    }
}

function displayNews(newsData, filter = '') {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;
    newsContainer.innerHTML = '';

    const lowercaseFilter = filter.toLowerCase();
    const filteredNews = newsData.filter(article => 
        (article.title && article.title.toLowerCase().includes(lowercaseFilter)) || 
        (article.source && article.source.toLowerCase().includes(lowercaseFilter))
    );

    if (filteredNews.length === 0 && allNewsCache.length > 0) {
        newsContainer.innerHTML = '<p class="text-center col-span-full text-gray-500">No news found for your search.</p>';
        return;
    }

    filteredNews.forEach(article => {
        const newsEl = document.createElement('div');
        newsEl.className = 'news-card bg-black border border-gray-800 rounded-lg p-4 flex flex-col hover:border-daa520 transition-colors duration-200 cursor-pointer';
        newsEl.dataset.content = JSON.stringify(article);
        
        const imageUrl = article.image;
        const imageHtml = imageUrl ? `<div class="w-full h-36 mb-4 overflow-hidden rounded-md"><img src="${imageUrl}" alt="News Image" class="w-full h-full object-cover"></div>` : '';

        newsEl.innerHTML = `
            ${imageHtml}
            <div>
                <span class="text-xs font-semibold uppercase primary-text">${article.source}</span>
                <h3 class="text-lg font-bold mt-2 text-white">${article.title}</h3>
                <p class="text-sm text-gray-400 mt-2 flex-grow">${article.summary}</p>
            </div>
            <div class="text-xs text-gray-500 mt-4 flex justify-between items-center">
                <span class="flex-grow">${article.source} | ${article.date} ${article.time}</span>
            </div>
        `;
        newsContainer.appendChild(newsEl);
    });

    document.querySelectorAll('.news-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const articleData = JSON.parse(e.currentTarget.dataset.content);
            openFullArticleModal(articleData);
        });
    });
}

export async function setupNews() {
    await initDB(); // Initialize the database first
    allNewsCache = await loadNewsFromDB(); // Load news from the local DB
    fetchAndRenderNews(); // Then fetch new articles
    
    const newsSearchInput = document.getElementById('newsSearchInput');
    newsSearchInput.addEventListener('input', (e) => {
        displayNews(allNewsCache, e.target.value);
    });
    
    // Refresh news every 30 minutes
    setInterval(fetchAndRenderNews, 1800000);
}

function openFullArticleModal(article) {
    if (!articleModal) {
        articleModal = document.createElement('div');
        articleModal.className = 'fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center';
        articleModal.innerHTML = `
            <div class="relative w-full h-full p-4 md:p-8 overflow-y-auto">
                <button id="closeArticleModalBtn" class="absolute top-4 right-4 md:top-8 md-right-8 text-white z-50 hover:text-red-400 transition-colors">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div id="articleContent" class="bg-gray-900 rounded-lg p-6 md:p-10 w-full md:w-3/4 lg:w-2/3 mx-auto"></div>
            </div>
        `;
        document.body.appendChild(articleModal);
        articleContent = document.getElementById('articleContent');
        closeArticleModalBtn = document.getElementById('closeArticleModalBtn');
        closeArticleModalBtn.addEventListener('click', () => {
            articleModal.classList.add('hidden');
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !articleModal.classList.contains('hidden')) {
                articleModal.classList.add('hidden');
            }
        });
    }
    let imageHtml = article.image ? `<img src="${article.image}" class="w-full h-auto rounded-lg mb-4" alt="Article image">` : '';
    articleContent.innerHTML = `
        ${imageHtml}
        <h2 class="text-3xl font-bold text-white mb-2">${article.title}</h2>
        <p class="text-sm text-gray-500 mb-4">${article.source} | ${article.date} ${article.time}</p>
        <p class="text-gray-400 mb-4">${article.summary}</p>
        <div class="text-gray-300 article-body">
            <p>${article.content.replace(/<[^>]*>/g, '').replace(/\n/g, '<br>')}</p>
        </div>
        <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="mt-6 inline-block btn-primary py-2 px-4 rounded-md">View Original Article</a>
    `;
    
    articleModal.classList.remove('hidden');
}

async function fetchAllNews() {
    let allNews = [];
    for (const feed of NEWS_FEEDS) {
        try {
            const response = await fetch(`${CORS_PROXY}${encodeURIComponent(feed.url)}`);
            const data = await response.json();
            if (data.status === 'ok' && data.items) {
                const articles = data.items.map(item => {
                    const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
                    const imageUrl = item.enclosure?.link || item.thumbnail || (imgMatch ? imgMatch[1] : null);

                    return {
                        title: item.title,
                        summary: item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
                        content: item.content,
                        link: item.link,
                        source: data.feed.title || feed.name,
                        pubDate: item.pubDate,
                        date: new Date(item.pubDate).toLocaleDateString(),
                        time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        image: imageUrl
                    };
                });
                allNews = allNews.concat(articles);
            }
        } catch (error) {
            console.error(`Error fetching news from ${feed.name}:`, error);
        }
    }
    // Sort all fetched news by date before returning
    return allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}