document.addEventListener('DOMContentLoaded', function() {
    // --- Elements ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pageContents = document.querySelectorAll('.page-content');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    
    // P/L Calculator Elements
    const calculatePlBtn = document.getElementById('calculatePl');
    const plResultEl = document.getElementById('plResult');
    const plAmountEl = document.getElementById('plAmount');
    const plTotalValueEl = document.getElementById('plTotalValue');
    const plPercentageEl = document.getElementById('plPercentage');

    // T/S Calculator Elements
    const calculateTsBtn = document.getElementById('calculateTs');
    const tsResultEl = document.getElementById('tsResult');
    const stopLossPriceEl = document.getElementById('stopLossPrice');
    const targetPriceEl = document.getElementById('targetPrice');
    const quantityToBuyEl = document.getElementById('quantityToBuy');

    // Portfolio Elements
    const addStockBtn = document.getElementById('addStockBtn');
    const stockModal = document.getElementById('stockModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const stockForm = document.getElementById('stockForm');
    const portfolioList = document.getElementById('portfolioList');
    const portfolioInvestmentEl = document.getElementById('portfolioInvestment');
    const checkHealthBtn = document.getElementById('checkHealthBtn');
    
    // Sell Modal Elements
    const sellStockModal = document.getElementById('sellStockModal');
    const sellStockForm = document.getElementById('sellStockForm');
    const closeSellModalBtn = document.getElementById('closeSellModalBtn');
    const sellStockIdInput = document.getElementById('sellStockId');

    // Trade History
    const tradeHistoryContainer = document.getElementById('tradeHistory');

    // Watchlist Elements
    const watchlistForm = document.getElementById('watchlistForm');
    const watchlistContainer = document.getElementById('watchlistContainer');

    // News Elements
    const newsContainer = document.getElementById('news-container');
    const newsSearchInput = document.getElementById('newsSearchInput');
    
    let portfolio = [];
    let tradeHistory = [];
    let watchlist = [];
    let editingStockId = null;
    let portfolioChart = null;
    let chartImageBase64 = null;

    // --- Local Storage Functions ---
    function savePortfolio() { localStorage.setItem('tradeMetricsPortfolio', JSON.stringify(portfolio)); }
    function loadPortfolio() {
        const saved = localStorage.getItem('tradeMetricsPortfolio');
        if (saved) portfolio = JSON.parse(saved);
    }
    function saveTradeHistory() { localStorage.setItem('tradeMetricsHistory', JSON.stringify(tradeHistory)); }
    function loadTradeHistory() {
        const saved = localStorage.getItem('tradeMetricsHistory');
        if (saved) tradeHistory = JSON.parse(saved);
    }
    function saveWatchlist() { localStorage.setItem('tradeMetricsWatchlist', JSON.stringify(watchlist)); }
    function loadWatchlist() {
        const saved = localStorage.getItem('tradeMetricsWatchlist');
        if (saved) watchlist = JSON.parse(saved);
    }

    // --- Page Navigation Logic ---
    function showPage(pageId) {
        pageContents.forEach(page => { page.style.display = 'none'; });
        const activePage = document.getElementById(pageId);
        if (activePage) { 
            activePage.style.display = 'block'; 
            if (pageId === 'portfolio') {
                renderPortfolio();
                renderTradeHistory();
            } else if (pageId === 'watchlist') {
                renderWatchlist();
            } else if (pageId === 'news') {
                renderNews();
            } else if (pageId === 'home') {
                renderMarketData();
            }
        }
        document.querySelectorAll('a[data-page]').forEach(link => {
            link.classList.remove('active');
            if(link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });
        if (!mobileMenu.classList.contains('hidden')) { mobileMenu.classList.add('hidden'); }
    }
    
    document.querySelectorAll('a[data-page]').forEach(link => {
         link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(link.getAttribute('data-page'));
        });
    });

    mobileMenuButton.addEventListener('click', () => { mobileMenu.classList.toggle('hidden'); });

    // --- Calculator Logic ---
    if(calculatePlBtn) {
        calculatePlBtn.addEventListener('click', () => {
            const investedAmount = parseFloat(document.getElementById('plInvestedAmount').value);
            const buyPrice = parseFloat(document.getElementById('plBuyPrice').value);
            const sellPrice = parseFloat(document.getElementById('plSellPrice').value);
            if (isNaN(investedAmount) || isNaN(buyPrice) || isNaN(sellPrice) || buyPrice <= 0) {
                alert('Please enter valid Invested Amount, Buy Price, and Sell Price.');
                return;
            }
            const quantity = investedAmount / buyPrice;
            const totalSellValue = sellPrice * quantity;
            const netPl = totalSellValue - investedAmount;
            const netPlPercentage = (netPl / investedAmount) * 100;
            plTotalValueEl.textContent = `₹${totalSellValue.toFixed(2)}`;
            plAmountEl.textContent = `₹${netPl.toFixed(2)}`;
            plPercentageEl.textContent = `${netPlPercentage.toFixed(2)}%`;
            const plClass = netPl >= 0 ? 'text-green-400' : 'text-red-400';
            plAmountEl.className = `font-bold ${plClass}`;
            plPercentageEl.className = `font-bold ${plClass}`;
            plTotalValueEl.className = `font-bold`;
            plResultEl.classList.remove('hidden');
        });
    }

    if(calculateTsBtn) {
        calculateTsBtn.addEventListener('click', () => {
            const capital = parseFloat(document.getElementById('tsCapital').value);
            const currentPrice = parseFloat(document.getElementById('tsCurrentPrice').value);
            const riskPercent = parseFloat(document.getElementById('tsRiskPercent').value);
            const rewardMultiplier = parseFloat(document.getElementById('tsRewardMultiplier').value);
            if (isNaN(capital) || isNaN(currentPrice) || isNaN(riskPercent) || isNaN(rewardMultiplier) || capital <= 0 || currentPrice <= 0 || riskPercent <= 0 || rewardMultiplier <= 0) {
                alert('Please enter valid values for all fields.');
                return;
            }
            const quantity = Math.floor(capital / currentPrice);
            const stopLossPrice = currentPrice * (1 - riskPercent / 100);
            const riskAmount = currentPrice - stopLossPrice;
            const targetPrice = currentPrice + (riskAmount * rewardMultiplier);
            quantityToBuyEl.textContent = `${quantity} shares`;
            stopLossPriceEl.textContent = `₹${stopLossPrice.toFixed(2)}`;
            targetPriceEl.textContent = `₹${targetPrice.toFixed(2)}`;
            tsResultEl.classList.remove('hidden');
        });
    }

    // --- Portfolio Management Logic ---
    if(addStockBtn) {
        addStockBtn.addEventListener('click', () => {
            editingStockId = null;
            stockForm.reset();
            document.getElementById('modalTitle').textContent = 'Add New Holding';
            document.getElementById('modalSubmitBtn').textContent = 'Add to Portfolio';
            stockModal.style.display = 'flex';
        });
    }
    
    if(closeModalBtn) {
        closeModalBtn.addEventListener('click', () => { stockModal.style.display = 'none'; });
    }
    window.addEventListener('click', (event) => {
        if (event.target == stockModal) { stockModal.style.display = 'none'; }
    });

    if(stockForm) {
        stockForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const stockData = {
                name: document.getElementById('stockName').value,
                quantity: parseFloat(document.getElementById('stockQuantity').value),
                buyPrice: parseFloat(document.getElementById('stockBuyPrice').value)
            };

            if (editingStockId) {
                const stockIndex = portfolio.findIndex(s => s.id === editingStockId);
                if (stockIndex > -1) {
                    portfolio[stockIndex] = { ...portfolio[stockIndex], ...stockData };
                }
            } else {
                portfolio.push({ ...stockData, id: Date.now() });
            }
            
            renderPortfolio();
            savePortfolio();
            stockForm.reset();
            stockModal.style.display = 'none';
        });
    }
    
    function handleEditStock(e) {
        const id = Number(e.currentTarget.dataset.id);
        const stock = portfolio.find(s => s.id === id);
        if (stock) {
            editingStockId = id;
            document.getElementById('modalTitle').textContent = 'Edit Holding';
            document.getElementById('modalSubmitBtn').textContent = 'Save Changes';
            document.getElementById('stockId').value = stock.id;
            document.getElementById('stockName').value = stock.name;
            document.getElementById('stockQuantity').value = stock.quantity;
            document.getElementById('stockBuyPrice').value = stock.buyPrice;
            stockModal.style.display = 'flex';
        }
    }

    function handleDeleteStock(e) {
        const id = Number(e.currentTarget.dataset.id);
        if (confirm('Are you sure you want to delete this holding? This action cannot be undone.')) {
            portfolio = portfolio.filter(s => s.id !== id);
            renderPortfolio();
            savePortfolio();
        }
    }

    function handleOpenSellModal(e) {
        const id = Number(e.currentTarget.dataset.id);
        const stock = portfolio.find(s => s.id === id);
        if(stock) {
            sellStockIdInput.value = id;
            document.getElementById('sellStockName').textContent = stock.name;
            document.getElementById('sellStockQuantity').textContent = stock.quantity;
            sellStockModal.style.display = 'flex';
        }
    }
    
    if(closeSellModalBtn) {
        closeSellModalBtn.addEventListener('click', () => { sellStockModal.style.display = 'none'; });
    }
     window.addEventListener('click', (event) => {
        if (event.target == sellStockModal) { sellStockModal.style.display = 'none'; }
    });

    if(sellStockForm) {
        sellStockForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sellPrice = parseFloat(document.getElementById('sellPrice').value);
            const stockId = Number(sellStockIdInput.value);
            
            if(isNaN(sellPrice) || sellPrice <= 0) {
                alert('Please enter a valid sell price.');
                return;
            }

            const stockIndex = portfolio.findIndex(s => s.id === stockId);
            if (stockIndex > -1) {
                const stock = portfolio[stockIndex];
                const profitLoss = (sellPrice - stock.buyPrice) * stock.quantity;

                tradeHistory.unshift({
                    name: stock.name,
                    quantity: stock.quantity,
                    buyPrice: stock.buyPrice,
                    sellPrice: sellPrice,
                    profitLoss: profitLoss,
                    date: new Date().toLocaleDateString()
                });

                portfolio.splice(stockIndex, 1);

                savePortfolio();
                saveTradeHistory();
                renderPortfolio();
                renderTradeHistory();
                
                sellStockForm.reset();
                sellStockModal.style.display = 'none';
            }
        });
    }

    function renderPortfolio() {
        if (!portfolioList) return;
        portfolioList.innerHTML = '';
        if (portfolio.length === 0) {
            portfolioList.innerHTML = '<div class="text-center text-gray-500 p-4">Your portfolio is empty. Add a holding to get started.</div>';
        } else {
            portfolio.forEach(stock => {
                const stockEl = document.createElement('div');
                stockEl.className = 'p-3 border-b border-gray-800 grid grid-cols-6 gap-2 items-center hover:bg-gray-900 transition-colors duration-200';
                stockEl.innerHTML = `
                    <div class="font-bold col-span-2 text-white">${stock.name}</div>
                    <div class="text-sm text-gray-400 text-center">Qty: ${stock.quantity}</div>
                    <div class="text-sm text-gray-400 text-center">Avg: ₹${stock.buyPrice.toFixed(2)}</div>
                    <div class="col-span-2 text-right flex justify-end gap-2">
                        <button class="sell-btn p-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded px-2" data-id="${stock.id}">SELL</button>
                        <button class="edit-btn p-1 text-blue-400 hover:text-blue-300" data-id="${stock.id}"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg></button>
                        <button class="delete-btn p-1 text-red-500 hover:text-red-400" data-id="${stock.id}"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                `;
                portfolioList.appendChild(stockEl);
            });
        }
        
        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEditStock));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteStock));
        document.querySelectorAll('.sell-btn').forEach(btn => btn.addEventListener('click', handleOpenSellModal));
        
        calculatePortfolioHealth();
        renderPortfolioChart();
    }
    
    function renderTradeHistory() {
        if (!tradeHistoryContainer) return;
        tradeHistoryContainer.innerHTML = '';
         if (tradeHistory.length === 0) {
            tradeHistoryContainer.innerHTML = '<div class="text-center text-gray-500 p-4 text-sm">No completed trades yet.</div>';
        } else {
            tradeHistory.forEach(trade => {
                const plColor = trade.profitLoss >= 0 ? 'text-green-400' : 'text-red-400';
                const tradeEl = document.createElement('div');
                tradeEl.className = 'p-2 border-b border-gray-800 text-xs';
                tradeEl.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-white">${trade.name}</span>
                        <span class="${plColor} font-semibold">₹${trade.profitLoss.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between items-center text-gray-400 mt-1">
                        <span>Qty: ${trade.quantity} @ ₹${trade.buyPrice.toFixed(2)} -> ₹${trade.sellPrice.toFixed(2)}</span>
                        <span>${trade.date}</span>
                    </div>
                `;
                tradeHistoryContainer.appendChild(tradeEl);
            });
        }
    }

    function calculatePortfolioHealth() {
        if (!portfolioInvestmentEl) return;
        let totalInvestment = portfolio.reduce((acc, stock) => acc + (stock.quantity * stock.buyPrice), 0);
        portfolioInvestmentEl.textContent = `₹${totalInvestment.toFixed(2)}`;
    }

    function renderPortfolioChart() {
        const ctx = document.getElementById('portfolioChart')?.getContext('2d');
        if (!ctx) return;

        if (portfolioChart) { portfolioChart.destroy(); }
        
        if(portfolio.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#6b7280';
            ctx.fillText('No holdings to display in chart', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        const labels = portfolio.map(s => s.name);
        const data = portfolio.map(s => s.quantity * s.buyPrice);

        portfolioChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#daa520', '#c0c0c0', '#cd7f32', '#ffdf00', '#d4af37', '#b8860b'],
                    borderColor: '#1a1a1a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- Watchlist Logic ---
    if(watchlistForm) {
        watchlistForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const stockName = document.getElementById('watchlistStockName').value;
            const targetPrice = parseFloat(document.getElementById('watchlistTargetPrice').value);

            if(stockName && !isNaN(targetPrice) && targetPrice > 0) {
                watchlist.push({ id: Date.now(), name: stockName, target: targetPrice });
                saveWatchlist();
                renderWatchlist();
                watchlistForm.reset();
            } else {
                alert('Please enter a valid stock name and target price.');
            }
        });
    }

    function renderWatchlist() {
        if (!watchlistContainer) return;
        watchlistContainer.innerHTML = '';
        if (watchlist.length === 0) {
            watchlistContainer.innerHTML = '<div class="text-center text-gray-500 p-4">Your watchlist is empty.</div>';
        } else {
            watchlist.forEach(stock => {
                const itemEl = document.createElement('div');
                itemEl.className = 'p-3 flex justify-between items-center bg-gray-900 rounded-lg';
                itemEl.innerHTML = `
                    <div>
                        <p class="font-bold text-white">${stock.name}</p>
                        <p class="text-sm text-gray-400">Target: ₹${stock.target.toFixed(2)}</p>
                    </div>
                    <button class="delete-watchlist-btn p-1 text-red-500 hover:text-red-400" data-id="${stock.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                `;
                watchlistContainer.appendChild(itemEl);
            });
            document.querySelectorAll('.delete-watchlist-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = Number(e.currentTarget.dataset.id);
                    watchlist = watchlist.filter(item => item.id !== id);
                    saveWatchlist();
                    renderWatchlist();
                });
            });
        }
    }
    
    // --- Swing Trade Image Analysis ---
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const imagePreview = document.getElementById('image-preview');
    const dropPrompt = document.getElementById('drop-prompt');
    const analyzePatternBtn = document.getElementById('analyzePatternBtn');
    const aiSwingAnalysisResult = document.getElementById('aiSwingAnalysisResult');

    if (dropArea) {
        dropArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => handleFiles(fileInput.files));
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
        });

        dropArea.addEventListener('drop', handleDrop, false);
    }
    document.addEventListener('paste', handlePaste);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    }

    function handlePaste(e) {
        const swingPage = document.getElementById('swing');
        if(swingPage && swingPage.style.display === 'block') {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let index in items) {
                const item = items[index];
                if (item.kind === 'file') {
                    const blob = item.getAsFile();
                    handleFiles([blob]);
                }
            }
        }
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    chartImageBase64 = reader.result.split(',')[1];
                    imagePreview.src = reader.result;
                    imagePreview.classList.remove('hidden');
                    dropPrompt.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please upload an image file.');
            }
        }
    }

    if(analyzePatternBtn) {
        analyzePatternBtn.addEventListener('click', () => {
            const stockName = document.getElementById('swingStockName').value;
            const exchange = document.getElementById('swingExchange').value;

            if (!stockName || !exchange || !chartImageBase64) {
                alert('Please provide a stock name, exchange, and upload a chart image.');
                return;
            }
            
            aiSwingAnalysisResult.classList.remove('hidden');
            aiSwingAnalysisResult.innerHTML = '<div class="loader"></div><p class="text-center">Analyzing pattern...</p>';
            
            setTimeout(() => {
                const pdfFileName = `${stockName}_${exchange}_Analysis.pdf`;
                const pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'; // Sample PDF
                aiSwingAnalysisResult.innerHTML = `
                    <div class="text-center">
                        <h4 class="text-lg font-semibold text-white">Analysis Complete</h4>
                        <p class="text-gray-400 mt-2">Report generated: <span class="font-semibold text-daa520">${pdfFileName}</span></p>
                        <a href="${pdfUrl}" download="${pdfFileName}" class="mt-4 inline-block btn-primary py-2 px-4 rounded-md">Download Report</a>
                    </div>
                    <div class="mt-6 border-t border-gray-800 pt-6">
                         <h4 class="text-lg font-semibold text-white text-center mb-4">Report Preview</h4>
                        <iframe src="${pdfUrl}" class="w-full h-96 rounded-lg"></iframe>
                    </div>
                `;
            }, 2000);
        });
    }


    // --- AI Health Check Logic ---
    if(checkHealthBtn) {
        checkHealthBtn.addEventListener('click', () => {
            if (portfolio.length === 0) {
                alert('Your portfolio is empty. Add some stocks to analyze.');
                return;
            }
            const aiAnalysisModal = document.getElementById('aiAnalysisModal');
            const aiAnalysisContent = document.getElementById('aiAnalysisContent');
            aiAnalysisModal.style.display = 'flex';
            aiAnalysisContent.innerHTML = '<div class="loader"></div><p class="text-center">Analyzing portfolio with AI...</p>';
            setTimeout(() => {
                aiAnalysisContent.innerHTML = 'AI Analysis feature is coming soon!';
            }, 1500);
        });
    }
    const closeAiModalBtn = document.getElementById('closeAiModalBtn');
    if(closeAiModalBtn) {
        closeAiModalBtn.addEventListener('click', () => {
            document.getElementById('aiAnalysisModal').style.display = 'none';
        });
    }
    window.addEventListener('click', (event) => {
        const aiAnalysisModal = document.getElementById('aiAnalysisModal');
        if (event.target == aiAnalysisModal) {
            aiAnalysisModal.style.display = 'none';
        }
    });
    
    // --- News Logic ---
    const staticNews = [
        { category: 'Market Analysis', headline: 'Nifty 50 Faces Resistance at 23,500; Analysts Advise Caution', summary: 'The benchmark Nifty 50 index is showing signs of consolidation after a strong rally. Key technical indicators suggest a possible pullback before the next leg up.', source: 'Economic Times', date: 'Aug 15, 2025', company: 'Nifty' },
        { category: 'Corporate News', headline: 'Reliance Industries Announces Major Investment in Green Energy Sector', summary: 'Reliance Industries has unveiled a ₹75,000 crore plan to build four giga-factories for renewable energy, aiming to become a global leader in green hydrogen.', source: 'Livemint', date: 'Aug 15, 2025', company: 'Reliance' },
        { category: 'Global Impact', headline: 'US Federal Reserve Hints at Tapering; Emerging Markets on Alert', summary: 'Recent statements from the US Federal Reserve suggest a potential reduction in its bond-buying program, which could lead to volatility in emerging markets like India.', source: 'Reuters', date: 'Aug 14, 2025', company: 'Federal Reserve' },
        { category: 'Corporate News', headline: 'Tata Motors Reports Strong Q2 Sales Growth Driven by EV Demand', summary: 'Tata Motors has posted a 25% year-on-year increase in passenger vehicle sales for the second quarter, largely fueled by the soaring popularity of its electric vehicle lineup.', source: 'Business Standard', date: 'Aug 14, 2025', company: 'Tata Motors' },
        { category: 'Economy', headline: 'RBI Holds Repo Rate Steady Amid Inflation Concerns', summary: 'The Reserve Bank of India\'s Monetary Policy Committee has decided to keep the repo rate unchanged at 4%, citing persistent inflationary pressures in the economy.', source: 'The Hindu', date: 'Aug 13, 2025', company: 'RBI' },
        { category: 'IPO News', headline: 'Paytm IPO: Analysts Divided on Valuation Ahead of Mega Listing', summary: 'With one of India\'s largest IPOs on the horizon, market analysts are expressing mixed views on Paytm\'s high valuation, advising investors to weigh the risks and growth potential carefully.', source: 'Moneycontrol', date: 'Aug 12, 2025', company: 'Paytm' }
    ];

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

    if(newsSearchInput) {
        newsSearchInput.addEventListener('input', (e) => {
            renderNews(e.target.value);
        });
    }

    // --- Market Data Ticker ---
    function renderMarketData() {
        const marketData = [
            { name: 'Nifty 50', open: 23450.75, current: 23510.40 },
            { name: 'Sensex', open: 77100.20, current: 76990.80 },
            { name: 'BankNifty', open: 51200.50, current: 51450.10 },
            { name: 'S&P 500', open: 5400.60, current: 5395.30 }
        ];

        const tickersContainer = document.getElementById('market-tickers');
        if (!tickersContainer) return;
        tickersContainer.innerHTML = '';

        marketData.forEach(market => {
            const change = market.current - market.open;
            const changePercent = (change / market.open) * 100;
            const colorClass = change >= 0 ? 'text-green-400' : 'text-red-400';
            const sign = change >= 0 ? '+' : '';

            const tickerEl = document.createElement('div');
            tickerEl.className = 'bg-gray-900 bg-opacity-50 border border-gray-800 rounded-lg p-3';
            tickerEl.innerHTML = `
                <p class="font-bold text-sm text-white">${market.name}</p>
                <p class="font-semibold text-lg ${colorClass}">${market.current.toFixed(2)}</p>
                <p class="text-xs ${colorClass}">${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)</p>
            `;
            tickersContainer.appendChild(tickerEl);
        });
    }


    // Initial Load
    loadPortfolio();
    loadTradeHistory();
    loadWatchlist();
    showPage('home');
});
