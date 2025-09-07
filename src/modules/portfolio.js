import { showCustomMessage } from './ui.js';

let portfolio = [];
let tradeHistory = [];
let editingStockId = null;
let portfolioChart = null;

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

export function setupPortfolio() {
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
    const tradeHistoryContainer = document.getElementById('tradeHistory');
    
    // --- Initial Load ---
    loadPortfolio();
    loadTradeHistory();
    renderPortfolio();
    renderTradeHistory();

    // --- Portfolio Management Logic ---
    if (addStockBtn) {
        addStockBtn.addEventListener('click', () => {
            editingStockId = null;
            stockForm.reset();
            document.getElementById('modalTitle').textContent = 'Add New Holding';
            document.getElementById('modalSubmitBtn').textContent = 'Add to Portfolio';
            stockModal.style.display = 'flex';
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => { stockModal.style.display = 'none'; });
    }
    window.addEventListener('click', (event) => {
        if (event.target == stockModal) { stockModal.style.display = 'none'; }
    });

    if (stockForm) {
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
        const userConfirmed = window.confirm('Are you sure you want to delete this holding? This action cannot be undone.');
        if (userConfirmed) {
            portfolio = portfolio.filter(s => s.id !== id);
            renderPortfolio();
            savePortfolio();
        }
    }

    function handleOpenSellModal(e) {
        const id = Number(e.currentTarget.dataset.id);
        const stock = portfolio.find(s => s.id === id);
        if (stock) {
            sellStockIdInput.value = id;
            document.getElementById('sellStockName').textContent = stock.name;
            document.getElementById('sellStockQuantity').textContent = stock.quantity;
            sellStockModal.style.display = 'flex';
        }
    }

    if (closeSellModalBtn) {
        closeSellModalBtn.addEventListener('click', () => { sellStockModal.style.display = 'none'; });
    }
    window.addEventListener('click', (event) => {
        if (event.target == sellStockModal) { sellStockModal.style.display = 'none'; }
    });

    if (sellStockForm) {
        sellStockForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sellPrice = parseFloat(document.getElementById('sellPrice').value);
            const stockId = Number(sellStockIdInput.value);

            if (isNaN(sellPrice) || sellPrice <= 0) {
                showCustomMessage('Please enter a valid sell price.', 'error');
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

        if (portfolio.length === 0) {
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
}
