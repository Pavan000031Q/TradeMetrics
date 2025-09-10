import { showToastNotification } from '../main.js';
import { showPage } from './ui.js';

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
                showToastNotification('Please upload an image file.', 'error');
            }
        }
    }

    if (analyzePatternBtn) {
        analyzePatternBtn.addEventListener('click', () => {
            const stockName = document.getElementById('swingStockName').value;
            const exchange = document.getElementById('swingExchange').value;

            if (!stockName || !exchange || !chartImageBase64) {
                showToastNotification('Please provide a stock name, exchange, and upload a chart image.', 'error');
                return;
            }

            aiSwingAnalysisResult.classList.remove('hidden');
            aiSwingAnalysisResult.innerHTML = `
                <div class="text-center">
                    <div class="loader mb-4"></div>
                    <h3 class="text-xl font-bold primary-text mb-2">🚀 Sending data for AI analysis...</h3>
                    <p class="text-gray-400 mb-2">This process may take 3-4 minutes to complete.</p>
                    <p class="text-gray-500 text-sm">Please do not close this window.</p>
                </div>
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
                            <h3 class="text-xl font-bold text-yellow-400 mb-4">Analysis Complete</h3>
                            <p class="text-gray-400 mb-2">The n8n workflow finished, but did not return a PDF link.</p>
                            <div class="bg-gray-800 p-4 rounded-lg mt-4">
                                <p class="text-sm text-gray-300">Response from webhook: ${JSON.stringify(data)}</p>
                            </div>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                aiSwingAnalysisResult.innerHTML = `
                    <div class="text-center">
                        <h3 class="text-xl font-bold text-red-400 mb-4">Connection Error</h3>
                        <p class="text-gray-400 mb-2">Could not connect to the n8n webhook.</p>
                        <p class="text-gray-400 mb-4">Please ensure your local n8n instance is running and the webhook URL is correct.</p>
                        <div class="bg-gray-800 p-4 rounded-lg mt-4">
                            <p class="text-sm text-gray-300">Details: ${error.message}</p>
                        </div>
                    </div>
                `;
            });
        });
    }

    function displayPdf(pdfUrl) {
        aiSwingAnalysisResult.innerHTML = `
            <div class="text-center">
                <h3 class="text-xl font-bold text-green-400 mb-4">✅ Your PDF report is ready.</h3>
                <div class="mb-4">
                    <a href="${pdfUrl}" target="_blank" class="btn-primary inline-block px-6 py-3 rounded-lg">
                        📄 Download Report
                    </a>
                </div>
                <div class="mt-6">
                    <iframe src="${pdfUrl}" width="100%" height="600" class="border border-gray-700 rounded-lg">
                        <p class="text-gray-400">Report Preview</p>
                        <p class="text-gray-500 text-sm">Note: Display may not work on all browsers.</p>
                    </iframe>
                </div>
            </div>
        `;
    }
}
