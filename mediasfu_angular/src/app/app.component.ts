import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Renderer2
} from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { Socket } from 'socket.io-client';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// FontAwesome
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faSun,
  faMoon,
  faSyncAlt,
  faCamera,
  faEye,
  faEyeSlash,
  faCommentSlash,
  faComments,
  faAssistiveListeningSystems,
  faDeaf
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Components & Services
import { AudioVisualizerComponent } from './components/agents/audio-visualizer-components/audio-visualizer.component';
import { CustomModalComponent } from './components/agents/custom-modal-components/custom-modal.component';
import {
  MediaSfuHandlerComponent,
  MediaSFUHandlerOptions
} from './components/media-sfu-handler-components/media-sfu-handler.component';
import { UseMediasfuSdkService } from './services/use-mediasfu-sdk.service';

/** Simple interface for chat messages **/
interface ChatMessage {
  sender: string;   // "Agent", "You", "System"
  message: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    FontAwesomeModule,
    AudioVisualizerComponent,
    CustomModalComponent,
    MediaSfuHandlerComponent,
    CommonModule,
    FormsModule
  ],
})
export class AppComponent implements OnInit, OnDestroy {

  /** ==================== FontAwesome Icons ===================== */
  faMicrophone = faMicrophone;
  faMicrophoneSlash = faMicrophoneSlash;
  faVideo = faVideo;
  faVideoSlash = faVideoSlash;
  faSun = faSun;
  faMoon = faMoon;
  faSyncAlt = faSyncAlt;
  faCamera = faCamera;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faCommentSlash = faCommentSlash;
  faComments = faComments;
  faAssistiveListeningSystems = faAssistiveListeningSystems;
  faDeaf = faDeaf;

  /** ==================== Child Component Refs ================== */
  @ViewChild('videoRef') videoRef!: ElementRef<HTMLVideoElement>;

  /** For auto-scrolling the chat **/
  @ViewChild('chatBox') chatBox!: ElementRef<HTMLDivElement>;

  /** ==================== State Variables ======================== */
  transcript: string = '';
  isCapturing: boolean = false;
  micOn: boolean = false;
  tempMicOn: boolean = false;
  videoOn: boolean = false;
  videoInputs: MediaDeviceInfo[] = [];
  selectedVideoInput: string = '';
  isModalOpen: boolean = true;
  isDarkMode: boolean = false;
  roomConnected: boolean = false;
  agentRoom: string = '';

  animate: boolean = false;            // For audio visualizer
  toast: string = '';                  // Toast message
  toastType: 'error' | 'success' | 'info' = 'info';
  isAudioPlaying: boolean = false;     // For disabling mic/cam
  audioContext: AudioContext | null = null; // For audio visualizer
  audioUnlocked = false;

  // AEC Toggle
  doAEC: boolean = false;

  // Chat messages and toggle
  showChat: boolean = true;
  chatMessages: ChatMessage[] = [
    { sender: 'System', message: 'Welcome to the AI Agent!' },
    { sender: 'System', message: 'Please wait while we connect you...' },
  ];

  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  // Socket
  socket: Socket | null = null;

  // Manage pipeline-related source parameters from child
  sourceParameters: BehaviorSubject<Record<string, any>> =
    new BehaviorSubject<Record<string, any>>({});
  sourceChanged: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  updateSourceParameters = (params: Record<string, any>) => {
    this.sourceParameters.next(params);
    this.sourceChanged.next(this.sourceChanged.value + 1);
  };

  // Audio Playback Queue
  audioQueue: string[] = [];

  audioLevel: number = 0;
  localStream: MediaStream | null = null;

  // For the MediaSFUHandler
  showRoomDetails: BehaviorSubject<MediaSFUHandlerOptions | null> =
    new BehaviorSubject<MediaSFUHandlerOptions | null>(null);

  /** ================== Pipeline Config ========================== */
  config: any = {
    audio: {
      format: 'wav',
      channels: 1,
      sampleRate: 16000,
      denoise: {
        enable: true,
        highpass: 200,
        lowpass: 3000,
        detectSilence: true,
        silenceThreshold: -35,
        silenceDuration: 0.25,
        silenceMinDuration: 0.25,
        pauseOnSilence: true
      },
      pipeline: ['stt', 'ttllm', 'tts'],
      sttNickName: "yourSTT",
      llmNickName: "yourLLM",
      ttsNickName: "yourTTS",
      returnAll: true,
      returnAudioFormat: 'base64'
    },
    vision: {
      fps: 0.5,
      pipeline: ['visionllm', 'tts'],
      llmNickName: "yourLLM",
      ttsNickName: "yourTTS",
      returnAll: true,
      returnAudioFormat: 'base64'
    }
  };

  /** ================== Large Session Limits ===================== */
  MAX_HOURLY_SESSIONS = 200000;
  MAX_DAILY_SESSIONS = 500000;

  /** ================== Periodic Reminder Timer ================== */
  private reminderInterval: any;
  private lastMicAlert: number = Date.now();

  constructor(
    private audioVideoSdk: UseMediasfuSdkService,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    /** 1) Session Limit Checks */
    const limit = this.checkSessionLimit();
    if (!limit.allowed) {
      this.showToast(limit.reason!, 'error');
      // Possibly block further usage...
    } else {
      this.startNewSession();
    }

    /** 2) Show the SFU Handler with config */
    this.showRoomDetails.next({
      action: 'create',
      name: 'agent',
      sourceParameters: this.sourceParameters.value,
      updateSourceParameters: this.updateSourceParameters
    });

    /** 3) Initialize Dark Mode */
    const savedTheme = localStorage.getItem('isDarkMode');
    if (savedTheme !== null) {
      this.isDarkMode = JSON.parse(savedTheme);
    }
    if (this.isDarkMode) {
      this.renderer.addClass(document.body, 'dark-mode');
    }

    /** 4) Combine latest source parameters changes */
    const sourceSubscription = combineLatest([
      this.sourceParameters,
      this.sourceChanged
    ]).subscribe(([params, _]) => {
      if (Object.keys(params).length > 0) {
        this.handleSourceParamsChange(params);
      }
    });
    this.subscriptions.add(sourceSubscription);

    /** 5) Start periodic reminder check (every 15s) */
    this.reminderInterval = setInterval(() => {
      this.checkMicReminder();
    }, 15000);
  }

  ngOnDestroy(): void {
    // Cancel intervals & subscriptions
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }
    this.subscriptions.unsubscribe();

    // Disconnect from SFU
    this.audioVideoSdk.disconnectRoom({
      sourceParameters: this.sourceParameters.value
    });

    // Cleanup socket
    if (this.socket) {
      this.socket.off('audio');
      this.socket.off('pipelineResult');
      this.socket.off('pipelineResultVision');
      this.socket.off('pipelineError');
      this.socket.off('pipelineErrorVision');
      this.socket.off('disconnect');
      this.socket = null;
    }

    // Remove dark mode class
    this.renderer.removeClass(document.body, 'dark-mode');
  }

  /**
 * Unlocks the AudioContext for playback.
 * Ensures the AudioContext is initialized and resumed if suspended.
 */
  private async unlockAudioContext(): Promise<void> {
    // Initialize AudioContext if not already created
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Resume AudioContext if it is suspended
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        this.audioUnlocked = true;
      } catch (error) {
        console.error('Failed to unlock AudioContext:', error);
      }
    }
  }

  /**
   * ================================================================
   * Periodic Reminder if capturing but mic & camera are both off
   * ================================================================
   */
  private checkMicReminder(): void {
    if (
      this.isCapturing &&
      !this.micOn &&
      !this.videoOn &&
      !this.isAudioPlaying
    ) {
      const now = Date.now();
      if (now - this.lastMicAlert > 30000) {
        this.showToast(
          'Your microphone is off. Click the mic button to speak.',
          'info'
        );
        this.addChatMessage('Agent',
          "I can't hear you. Please unmute your mic or turn on your camera."
        );
        this.lastMicAlert = now;
      }
    } else {
      this.lastMicAlert = Date.now();
    }
  }

  /**
   * ================================================================
   *  Handling sourceParameters changes from the child
   * ================================================================
   */
  private handleSourceParamsChange(p: Record<string, any>): void {
    // Sync Microphone & Camera
    if (p['audioAlreadyOn'] !== this.micOn) {
      this.micOn = p['audioAlreadyOn'];
    }
    if (p['videoAlreadyOn'] !== this.videoOn) {
      this.videoOn = p['videoAlreadyOn'];
    }

    // Sync audio level
    if (p['audioLevel'] !== this.audioLevel) {
      this.audioLevel = p['audioLevel'];
    }

    // Local Stream
    if (p['localStreamVideo'] && p['localStreamVideo'] !== this.localStream) {
      this.localStream = p['localStreamVideo'];
    }

    // Socket
    if (p['socket'] && (!this.socket || !this.socket.id)) {
      this.socket = p['socket'];
    }
    if (p['localSocket'] && p['localSocket'].id && (!this.socket || !this.socket.id)) {
      this.socket = p['localSocket'];
    }

    // If newly connected
    if (this.socket?.id && !this.roomConnected) {
      this.roomConnected = true;
      this.showToast('Connected to the agent room!', 'success');

      this.addChatMessage('System', 'Connected to the agent room.');
      this.addChatMessage('Agent', 'Hello! How can I help you today?');
      this.addChatMessage('System', 'Please start speaking.');

      if (!p['audioAlreadyOn']) {
        this.addChatMessage('System',
          'You are currently muted. Please unmute to speak or turn on camera.'
        );
      }

      this.setupSocketListeners();
      if (p['roomName'] && p['roomName'] !== this.agentRoom) {
        this.agentRoom = p['roomName'];
        if (!this.isCapturing) {
          setTimeout(() => {
            this.startCapture();
          }, 500);
        }
      }
    }

    // userDefaultVideoInputDevice changed?
    if (
      p['userDefaultVideoInputDevice'] &&
      p['userDefaultVideoInputDevice'] !== this.selectedVideoInput
    ) {
      this.selectedVideoInput = p['userDefaultVideoInputDevice'];
    }

    // alertMessage
    if (p['alertMessage']) {
      this.showToast(p['alertMessage'], 'info');
      if (p['alertMessage'].includes('You have been disconnected')) {
        if (confirm('You have been disconnected. Reload the page?')) {
          window.location.reload();
        }
      }
    }
  }

  /**
   * ================================================================
   *  Large Session Limits
   * ================================================================
   */
  private getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith(name + '=')) {
        return trimmed.substring((name + '=').length);
      }
    }
    return null;
  }

  private setCookie(name: string, value: string, days: number): void {
    let expires = '';
    if (days > 0) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
  }

  private removeCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  checkSessionLimit(): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const data = this.getCookie('user_sessions');
    const sessions: number[] = data ? JSON.parse(data) : [];

    const validSessions = sessions.filter(t => now - t < oneDay);
    const hourlySessions = validSessions.filter(t => now - t < oneHour);

    if (hourlySessions.length >= this.MAX_HOURLY_SESSIONS) {
      return {
        allowed: false,
        reason: 'You can only start two sessions per hour.'
      };
    }
    if (validSessions.length >= this.MAX_DAILY_SESSIONS) {
      return {
        allowed: false,
        reason: 'You can only start five sessions per day.'
      };
    }
    return { allowed: true };
  }

  startNewSession(): void {
    const data = this.getCookie('user_sessions');
    const now = Date.now();
    const sessions: number[] = data ? JSON.parse(data) : [];
    sessions.push(now);
    this.setCookie('user_sessions', JSON.stringify(sessions), 1);
  }

  /**
   * ================================================================
   *  Socket Setup
   * ================================================================
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('pipelineResult', (data: any) => {
      if (data.transcript) {
        this.transcript = data.transcript;
      }
      if (data.audio) {
        this.playQueuedBase64(data.audio);
      }
      if (data.text) {
        this.addChatMessage('Agent', data.text);
      }
    });

    this.socket.on('pipelineResultVision', (data: any) => {
      if (data.audio) {
        this.playQueuedBase64(data.audio);
      }
      if (data.text) {
        this.addChatMessage('Agent', data.text);
      }
    });

    this.socket.on('pipelineError', (data: any) => {
      this.showToast(`Voice pipeline error: ${data.error}`, 'error');
    });

    this.socket.on('pipelineErrorVision', (data: any) => {
      this.showToast(`Vision pipeline error: ${data.error}`, 'error');
    });

    this.socket.on('disconnect', () => {
      this.roomConnected = false;
      this.showToast('Disconnected from the agent room.', 'info');
      this.addChatMessage('System', 'You have been disconnected.');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    });
  }

  /**
   * ================================================================
   *  Start Capture => "startDataBuffer"
   * ================================================================
   */
  startCapture(): void {
    if (!this.roomConnected) {
      this.showToast('Cannot capture until room is connected.', 'error');
      return;
    }
    if (this.isCapturing) return;
    if (this.socket) {
      this.socket.emit(
        'startDataBuffer',
        { roomName: this.agentRoom, config: this.config },
        (response: any) => {
          if (response?.success) {
            this.isCapturing = true;
            this.showToast('Session capture started.', 'success');

            // If the server also emits "startBuffers"
            this.socket?.on('startBuffers', () => {
              this.socket?.emit('startBuffer', {
                roomName: this.agentRoom,
                member: 'agent'
              });
            });
          } else {
            let reason = 'Check your connection and try again.';
            if (response?.reason) {
              reason = response.reason;
            }
            this.showToast(`Failed to start session. ${reason}`, 'error');
          }
        }
      );
    }
  }

  /**
   * ================================================================
   *  Playback Audio from server
   * ================================================================
   */

  /**
   * Plays base64-encoded audio using AudioContext.
   * Handles audio queue and ensures proper mic handling during playback.
   * @param base64 - Base64-encoded audio string.
   */
  private async playQueuedBase64(base64: string): Promise<void> {
    // Check if audio playback is already in progress
    if (this.isAudioPlaying) {
      this.audioQueue.push(base64);
      return;
    }

    try {
      // Decode base64 string to a Uint8Array
      const byteCharacters = atob(base64);
      const byteArray = Uint8Array.from(byteCharacters, (char) =>
        char.charCodeAt(0)
      );

      // Initialize AudioContext if not already created
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Decode audio data using AudioContext
      const audioBuffer = await this.audioContext.decodeAudioData(
        byteArray.buffer
      );

      // Create an audio buffer source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Connect the source to the destination (speakers)
      source.connect(this.audioContext.destination);

      // Manage microphone state during playback
      if (this.micOn && this.doAEC) {
        this.tempMicOn = true;
        this.toggleMic();
      }

      // Set state for playback animation
      this.isAudioPlaying = true;
      this.animate = true;

      // Start audio playback
      source.start();

      // Handle audio playback completion
      source.onended = () => {
        this.animate = false;
        this.isAudioPlaying = false;

        // Re-enable mic if it was disabled during playback
        if (this.tempMicOn) {
          this.tempMicOn = false;
          this.toggleMic();
        }

        // Play the next audio in the queue if available
        if (this.audioQueue.length > 0) {
          const nextAudio = this.audioQueue.shift();
          if (nextAudio) {
            this.playQueuedBase64(nextAudio);
          }
        }
      };
    } catch (error) {
      console.error('Failed to play audio:', error);
      this.isAudioPlaying = false;
      this.animate = false;

      // Re-enable mic if it was disabled during playback
      if (this.tempMicOn) {
        this.tempMicOn = false;
        this.toggleMic();
      }
    }
  }


  /**
   * ================================================================
   *  Microphone / Camera / AEC Toggles
   * ================================================================
   */
  async toggleMic(): Promise<void> {
    if (!this.audioUnlocked) {
      await this.unlockAudioContext();
    }
    if (!Object.keys(this.sourceParameters.value).length) return;
    await this.audioVideoSdk.toggleAudio({
      sourceParameters: this.sourceParameters.value
    });
    this.micOn = !this.micOn;
  }

  async toggleCamera(): Promise<void> {
    if (!this.audioUnlocked) {
      await this.unlockAudioContext();
    }
    if (!Object.keys(this.sourceParameters.value).length) return;
    await this.audioVideoSdk.toggleVideo({
      sourceParameters: this.sourceParameters.value
    });

    this.videoOn = !this.videoOn;
    if (this.videoOn && this.videoInputs.length === 0) {
      this.enumerateVideoInputs();
      if (!this.isModalOpen) {
        this.isModalOpen = true;
      }
    }
  }

  async swapCamera(): Promise<void> {
    if (!Object.keys(this.sourceParameters.value).length) return;
    await this.audioVideoSdk.switchCamera({
      sourceParameters: this.sourceParameters.value
    });
    this.showToast('Camera switched.', 'success');
  }

  async pickCamera(deviceId: string): Promise<void> {
    if (!Object.keys(this.sourceParameters.value).length) return;
    await this.audioVideoSdk.selectCamera({
      deviceId,
      sourceParameters: this.sourceParameters.value
    });
    this.selectedVideoInput = deviceId;
  }

  toggleAEC(): void {
    this.doAEC = !this.doAEC;
    if (this.doAEC) {
      this.showToast(
        'AEC enabled (for echo issues on loudspeaker).',
        'info'
      );
    } else {
      this.showToast(
        'AEC disabled (faster, but might echo).',
        'info'
      );
    }
  }

  private enumerateVideoInputs(): void {
    navigator.mediaDevices
      .enumerateDevices()
      .then(devices => {
        const videoInputList = devices.filter(d => d.kind === 'videoinput');
        this.videoInputs = videoInputList;
        if (videoInputList.length > 0) {
          this.selectedVideoInput = videoInputList[0].deviceId;
        }
      })
      .catch(err => {
        console.error('Error enumerating devices:', err);
      });
  }

  onVideoInputChange(event: any): void {
    const deviceId = event.target.value;
    this.pickCamera(deviceId);
  }

  /**
   * ================================================================
   *  Chat & UI Helpers
   * ================================================================
   */
  toggleChat(): void {
    this.showChat = !this.showChat;
  }

  toggleModal(): void {
    this.isModalOpen = !this.isModalOpen;
  }

  addChatMessage(sender: string, message: string): void {
    this.chatMessages.push({ sender, message });
    // Auto-scroll after a brief delay
    setTimeout(() => {
      if (this.chatBox?.nativeElement) {
        this.chatBox.nativeElement.scrollTop =
          this.chatBox.nativeElement.scrollHeight;
      }
    }, 50);
  }

  getChatBubbleClass(sender: string): string {
    const s = sender.toLowerCase();
    if (s === 'agent') return 'chatMessage agent';
    if (s === 'you') return 'chatMessage user';
    return 'chatMessage system'; // for "System"
  }

  /**
   * ================================================================
   *  Toast / Dark Mode
   * ================================================================
   */
  showToast(msg: string, type: 'error' | 'success' | 'info' = 'info'): void {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toast = '';
    }, 5000);
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('isDarkMode', JSON.stringify(this.isDarkMode));
    if (this.isDarkMode) {
      this.renderer.addClass(document.body, 'dark-mode');
    } else {
      this.renderer.removeClass(document.body, 'dark-mode');
    }
  }

  get connectedClass() {
    return this.roomConnected ? 'status-dot connected' : 'status-dot disconnected';
  }

  get statusTextClass() {
    return this.roomConnected ? 'status-text active' : 'status-text inactive';
  }
}
