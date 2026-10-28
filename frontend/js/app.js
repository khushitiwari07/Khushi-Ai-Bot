document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elements ---
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const fileDisplay = document.getElementById('file-display');
    const fileName = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const processBtn = document.getElementById('process-btn');
    
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    
    const emptyState = document.getElementById('empty-state');
    const resultsContainer = document.getElementById('results-container');
    const exportActions = document.getElementById('export-actions');
    
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Result containers
    const summaryContent = document.getElementById('summary-content');
    const topicsContent = document.getElementById('topics-content');
    const actionsContent = document.getElementById('actions-content');
    const transcriptContent = document.getElementById('transcript-content');
    
    // State
    let currentFile = null;
    let currentResults = null;
    
    // --- Tab Switching Logic ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active classes
            tabBtns.forEach(b => {
                b.classList.remove('active', 'text-primary', 'border-b-2', 'border-primary');
                b.classList.add('text-gray-500');
            });
            tabContents.forEach(c => c.classList.add('hidden'));
            
            // Add active class to clicked
            btn.classList.add('active', 'text-primary', 'border-b-2', 'border-primary');
            btn.classList.remove('text-gray-500');
            
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // --- File Upload Logic ---
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('bg-indigo-100', 'border-indigo-500');
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('bg-indigo-100', 'border-indigo-500');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('bg-indigo-100', 'border-indigo-500');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    function handleFileSelect() {
        if (fileInput.files.length > 0) {
            setFile(fileInput.files[0]);
        }
    }
    
    removeFileBtn.addEventListener('click', () => {
        setFile(null);
        fileInput.value = '';
    });

    function setFile(file) {
        currentFile = file;
        if (file) {
            fileName.textContent = file.name;
            dropZone.classList.add('hidden');
            fileDisplay.classList.remove('hidden');
            processBtn.disabled = false;
        } else {
            dropZone.classList.remove('hidden');
            fileDisplay.classList.add('hidden');
            processBtn.disabled = true;
        }
    }

    // --- Recorder Logic ---
    const recorderBtn = document.getElementById('record-btn');
    const recorder = new AudioRecorder((audioBlob) => {
        // When recording stops
        const file = new File([audioBlob], `Recording_${new Date().getTime()}.webm`, { type: 'audio/webm' });
        setFile(file);
        
        // Auto process if desired, or let user click process
        document.getElementById('record-status').textContent = "Recording saved. Ready to process.";
        setTimeout(() => {
            document.getElementById('record-timer').classList.add('hidden');
            document.getElementById('record-status').textContent = "Ready to record";
        }, 3000);
    });

    recorderBtn.addEventListener('click', () => {
        recorder.toggleRecording();
    });

    // --- Process Logic ---
    processBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        // Show loading
        loadingOverlay.classList.remove('hidden');
        processBtn.disabled = true;
        
        const formData = new FormData();
        formData.append('file', currentFile);
        
        const targetLanguage = document.getElementById('target-language').value;
        formData.append('target_language', targetLanguage);
        
        // Cycle messages
        const msgs = [
            "Transcribing with Faster-Whisper (GPU)...",
            "Extracting topics and sentiment...",
            "Summarizing with Gemini AI...",
            "Formatting Action Items...",
            "Almost done..."
        ];
        let msgIdx = 0;
        const msgInterval = setInterval(() => {
            msgIdx = (msgIdx + 1) % msgs.length;
            loadingMessage.textContent = msgs[msgIdx];
        }, 4000);

        try {
            const response = await fetch('/api/process-audio', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Processing failed");
            }

            const data = await response.json();
            currentResults = data;
            renderResults(data);

        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            clearInterval(msgInterval);
            loadingOverlay.classList.add('hidden');
            processBtn.disabled = false;
        }
    });

    // --- Render Results ---
    function renderResults(data) {
        emptyState.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        exportActions.classList.remove('hidden');

        // Render Summary
        summaryContent.innerHTML = '';
        if (data.executive_summary) {
            data.executive_summary.forEach(point => {
                const li = document.createElement('li');
                li.textContent = point;
                summaryContent.appendChild(li);
            });
        }

        // Render Topics
        topicsContent.innerHTML = '';
        if (data.key_topics) {
            data.key_topics.forEach(topic => {
                const span = document.createElement('span');
                span.className = 'px-3 py-1 bg-indigo-50 text-primary rounded-full text-sm font-medium border border-indigo-100 shadow-sm';
                span.textContent = topic;
                topicsContent.appendChild(span);
            });
        }

        // Render Actions
        actionsContent.innerHTML = '';
        if (data.action_items && data.action_items.length > 0) {
            data.action_items.forEach(item => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-gray-50 transition';
                
                // Priority badge styling
                let pClass = 'priority-medium';
                if (item.priority.toLowerCase().includes('high')) pClass = 'priority-high';
                if (item.priority.toLowerCase().includes('low')) pClass = 'priority-low';

                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-normal text-gray-800 font-medium">${item.task}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-600">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">${item.owner.charAt(0).toUpperCase()}</div>
                            ${item.owner}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap"><span class="${pClass}">${item.priority}</span></td>
                `;
                actionsContent.appendChild(tr);
            });
        } else {
            actionsContent.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">No action items found.</td></tr>`;
        }

        // Render Transcript
        if (data.transcript) {
            transcriptContent.textContent = data.transcript;
        }
    }

    // --- Export Logic ---
    document.getElementById('download-txt').addEventListener('click', () => downloadFile('txt'));
    document.getElementById('download-md').addEventListener('click', () => downloadFile('md'));
    document.getElementById('download-json').addEventListener('click', () => downloadFile('json'));

    function downloadFile(format) {
        if (!currentResults) return;

        let content = '';
        let mimeType = 'text/plain';
        let ext = format;

        if (format === 'json') {
            content = JSON.stringify(currentResults, null, 2);
            mimeType = 'application/json';
        } 
        else if (format === 'md') {
            content = `# Khushi AI - Meeting Summary\n\n`;
            content += `## Executive Summary\n`;
            currentResults.executive_summary.forEach(s => content += `- ${s}\n`);
            
            content += `\n## Key Topics\n`;
            currentResults.key_topics.forEach(t => content += `- ${t}\n`);
            
            content += `\n## Action Items\n`;
            content += `| Task | Owner | Priority |\n|---|---|---|\n`;
            currentResults.action_items.forEach(a => {
                content += `| ${a.task} | ${a.owner} | ${a.priority} |\n`;
            });
            
            content += `\n## Full Transcript\n\n${currentResults.transcript}\n`;
            mimeType = 'text/markdown';
        }
        else if (format === 'txt') {
            content = `KHUSHI AI - MEETING SUMMARY\n===========================\n\n`;
            content += `EXECUTIVE SUMMARY:\n`;
            currentResults.executive_summary.forEach(s => content += `- ${s}\n`);
            
            content += `\nKEY TOPICS:\n`;
            currentResults.key_topics.forEach(t => content += `- ${t}\n`);
            
            content += `\nACTION ITEMS:\n`;
            currentResults.action_items.forEach(a => {
                content += `- [${a.priority}] ${a.task} (Owner: ${a.owner})\n`;
            });
            
            content += `\nFULL TRANSCRIPT:\n${currentResults.transcript}\n`;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting_results_${new Date().getTime()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});
