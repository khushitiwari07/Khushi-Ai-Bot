class AudioRecorder {
    constructor(onStopCallback) {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
        this.onStopCallback = onStopCallback;
        
        this.startTime = null;
        this.timerInterval = null;
        
        this.recordBtn = document.getElementById('record-btn');
        this.recordIcon = document.getElementById('record-icon');
        this.recordStatus = document.getElementById('record-status');
        this.recordTimer = document.getElementById('record-timer');
    }

    async init() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.audioChunks = []; // reset
                if (this.onStopCallback) {
                    this.onStopCallback(audioBlob);
                }
            };
            
            return true;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please ensure permissions are granted.");
            return false;
        }
    }

    toggleRecording() {
        if (!this.isRecording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    async startRecording() {
        if (!this.mediaRecorder) {
            const initialized = await this.init();
            if (!initialized) return;
        }
        
        this.audioChunks = [];
        this.mediaRecorder.start();
        this.isRecording = true;
        
        // UI Updates
        this.recordBtn.parentElement.classList.add('recording');
        this.recordIcon.classList.remove('fa-microphone');
        this.recordIcon.classList.add('fa-stop');
        this.recordStatus.textContent = "Recording...";
        this.recordTimer.classList.remove('hidden');
        
        // Start Timer
        this.startTime = Date.now();
        this.updateTimer();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // UI Updates
            this.recordBtn.parentElement.classList.remove('recording');
            this.recordIcon.classList.remove('fa-stop');
            this.recordIcon.classList.add('fa-microphone');
            this.recordStatus.textContent = "Processing recording...";
            
            clearInterval(this.timerInterval);
        }
    }

    updateTimer() {
        const diff = Date.now() - this.startTime;
        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        
        const pad = (num) => num.toString().padStart(2, '0');
        this.recordTimer.textContent = `${pad(minutes)}:${pad(seconds)}`;
    }
}
