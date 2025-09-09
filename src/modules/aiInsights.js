// src/modules/aiInsights.js

import { showCustomMessage, showPage } from './ui.js';

export function setupSwingTradeAnalysis() {
    const swingPage = document.getElementById('swing');
    if (!swingPage) return;

    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const imagePreview = document.getElementById('image-preview');
    const dropPrompt = document.getElementById('drop-prompt');
    const analyzePatternBtn = document.getElementById('analyzePatternBtn');
    const aiSwingAnalysisResult = document.getElementById('aiSwingAnalysisResult');
    let chartImageBase64 = null;

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
        if(document.getElementById('swing').style.display === 'block') {
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
                showCustomMessage('Please upload an image file.', 'error');
            }
        }
    }

    if (analyzePatternBtn) {
        analyzePatternBtn.addEventListener('click', () => {
            const stockName = document.getElementById('swingStockName').value;
            const exchange = document.getElementById('swingExchange').value;

            if (!stockName || !exchange || !chartImageBase64) {
                showCustomMessage('Please provide a stock name, exchange, and upload a chart image.', 'error');
                return;
            }

            aiSwingAnalysisResult.classList.remove('hidden');
            aiSwingAnalysisResult.innerHTML = `
                <div class="loader"></div>
                <p class="text-center text-yellow-400">
                    🚀 Sending data for AI analysis...
                </p>
                <p class="text-center text-gray-400 mt-2">
                    This process may take 3-4 minutes to complete.
                </p>
                <p class="text-center text-gray-400 mt-1">
                    Please do not close this window.
                </p>
            `;

            const dataToSend = {
                stockName: stockName,
                exchange: exchange,
                imageBase64: chartImageBase64
            };
            
            // NOTE: The user needs to add their own webhook URL here
            const webhookUrl = 'http://localhost:5678/webhook/swing-trade-analysis';

            fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Webhook response was not ok: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                if (data && data.signedUrl) {
                    displayPdf(data.signedUrl);
                } else {
                    aiSwingAnalysisResult.innerHTML = `
                        <div class="text-center">
                            <h4 class="text-lg font-semibold text-yellow-400">⚠️ Analysis Complete, No PDF URL Found</h4>
                            <p class="text-gray-400 mt-2">The n8n workflow finished, but did not return a PDF link.</p>
                            <p class="text-xs text-gray-500 mt-4">Response from webhook: ${JSON.stringify(data)}</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error sending data to webhook:', error);
                aiSwingAnalysisResult.innerHTML = `
                    <div class="text-center">
                        <h4 class="text-lg font-semibold text-red-400">❌ Error Triggering Workflow</h4>
                        <p class="text-gray-400 mt-2">Could not connect to the n8n webhook.</p>
                        <p class="text-xs text-gray-500 mt-2">Please ensure your local n8n instance is running and the webhook URL is correct.</p>
                        <p class="text-xs text-gray-600 mt-4">Details: ${error.message}</p>
                    </div>
                `;
            });
        });
    }

    function displayPdf(pdfUrl) {
        aiSwingAnalysisResult.innerHTML = `
            <div class="space-y-4">
                <div class="text-center">
                    <h4 class="text-lg font-semibold text-green-400">✅ Analysis Complete!</h4>
                    <p class="text-gray-400">Your PDF report is ready.</p>
                </div>
                <div class="flex justify-center">
                    <a href="${pdfUrl}" download class="btn-primary py-2 px-4 rounded-md">
                        Download Report PDF
                    </a>
                </div>
                <hr class="divider">
                <div class="text-center text-gray-400">
                    <p>Report Preview</p>
                    <p class="text-xs text-gray-500">Note: Display may not work on all browsers.</p>
                </div>
                <div class="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden">
                    <iframe src="${pdfUrl}" class="w-full h-full border-0"></iframe>
                </div>
            </div>
        `;
    }
}
