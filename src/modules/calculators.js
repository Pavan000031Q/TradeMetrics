import { showToastNotification } from '../main.js';

export function setupCalculators() {
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

    if (calculatePlBtn) {
        calculatePlBtn.addEventListener('click', () => {
            const investedAmount = parseFloat(document.getElementById('plInvestedAmount').value);
            const buyPrice = parseFloat(document.getElementById('plBuyPrice').value);
            const sellPrice = parseFloat(document.getElementById('plSellPrice').value);

            if (isNaN(investedAmount) || isNaN(buyPrice) || isNaN(sellPrice) || buyPrice <= 0) {
                showToastNotification('Please enter valid Invested Amount, Buy Price, and Sell Price.', 'error');
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

    if (calculateTsBtn) {
        calculateTsBtn.addEventListener('click', () => {
            const capital = parseFloat(document.getElementById('tsCapital').value);
            const currentPrice = parseFloat(document.getElementById('tsCurrentPrice').value);
            const riskPercent = parseFloat(document.getElementById('tsRiskPercent').value);
            const rewardMultiplier = parseFloat(document.getElementById('tsRewardMultiplier').value);

            if (isNaN(capital) || isNaN(currentPrice) || isNaN(riskPercent) || isNaN(rewardMultiplier) || 
                capital <= 0 || currentPrice <= 0 || riskPercent <= 0 || rewardMultiplier <= 0) {
                showToastNotification('Please enter valid values for all fields.', 'error');
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
}
