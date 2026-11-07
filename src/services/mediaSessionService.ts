// ========================================================================
// WEB MEDIA SESSION API SERVICE
// Detects active audio/video media playback and tracks metadata
// Coordinates with DynamicIsland to display currently playing audio info
// ========================================================================

import { dynamicIslandService, DynamicIslandAudioTrack } from './dynamicIslandService.ts';

export interface ActiveMediaInfo extends DynamicIslandAudioTrack {
  element?: HTMLMediaElement | null;
}

class MediaSessionService {
  private activeElement: HTMLMediaElement | null = null;
  private currentTrack: DynamicIslandAudioTrack | null = null;
  private isMonitoring = false;
  private demoAudioContext: AudioContext | null = null;
  private demoOscillators: OscillatorNode[] = [];
  private demoInterval: any = null;
  private isDemoPlaying = false;
  private demoCurrentTime = 0;
  private demoDuration = 180; // 3 minutes

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public init() {
    if (this.isMonitoring || typeof window === 'undefined') return;
    this.isMonitoring = true;

    // 1. Setup Web Media Session Action Handlers if supported
    this.setupMediaSessionHandlers();

    // 2. Global DOM listeners for HTML5 <audio> and <video> elements
    // Using capture phase to intercept any audio/video playing anywhere in the app
    window.addEventListener('play', this.handleMediaPlay, true);
    window.addEventListener('pause', this.handleMediaPause, true);
    window.addEventListener('ended', this.handleMediaEnded, true);
    window.addEventListener('timeupdate', this.handleTimeUpdate, true);

    // 3. Periodic check for navigator.mediaSession metadata changes
    this.checkExistingMediaSession();
  }

  public destroy() {
    if (!this.isMonitoring || typeof window === 'undefined') return;
    this.isMonitoring = false;

    window.removeEventListener('play', this.handleMediaPlay, true);
    window.removeEventListener('pause', this.handleMediaPause, true);
    window.removeEventListener('ended', this.handleMediaEnded, true);
    window.removeEventListener('timeupdate', this.handleTimeUpdate, true);

    this.stopDemoTrack();
  }

  /**
   * Check if navigator.mediaSession already has active metadata or playbackState
   */
  public checkExistingMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const ms = navigator.mediaSession;
      if (ms.playbackState === 'playing' || ms.metadata) {
        const metadata = ms.metadata;
        const track: DynamicIslandAudioTrack = {
          title: metadata?.title || 'Active Audio Track',
          artist: metadata?.artist || 'GKEDIT AI Player',
          album: metadata?.album || 'Web Media Session',
          artworkUrl: metadata?.artwork?.[0]?.src,
          isPlaying: ms.playbackState === 'playing',
          sourceType: 'mediaSession',
        };

        this.currentTrack = track;
        dynamicIslandService.setAudioMedia(track, {
          onTogglePlay: () => this.togglePlay(),
          onNextTrack: () => this.handleNextTrack(),
          onPreviousTrack: () => this.handlePreviousTrack(),
          onSeek: (sec) => this.seekTo(sec),
          onCancel: () => this.dismissMedia(),
        });
      }
    } catch (err) {
      console.warn('[MediaSessionService] Error inspecting mediaSession:', err);
    }
  }

  /**
   * Bind standard Web Media Session API action handlers
   */
  private setupMediaSessionHandlers() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const ms = navigator.mediaSession;
      const actions: MediaSessionAction[] = [
        'play',
        'pause',
        'previoustrack',
        'nexttrack',
        'seekto',
        'stop',
      ];

      actions.forEach((action) => {
        try {
          ms.setActionHandler(action, (details) => {
            switch (action) {
              case 'play':
                this.play();
                break;
              case 'pause':
                this.pause();
                break;
              case 'previoustrack':
                this.handlePreviousTrack();
                break;
              case 'nexttrack':
                this.handleNextTrack();
                break;
              case 'seekto':
                if (details?.seekTime !== undefined) {
                  this.seekTo(details.seekTime);
                }
                break;
              case 'stop':
                this.dismissMedia();
                break;
            }
          });
        } catch {
          // Action might not be supported in some browser variants
        }
      });
    } catch (err) {
      console.warn('[MediaSessionService] Failed to bind mediaSession action handlers:', err);
    }
  }

  /**
   * Intercept HTML5 <audio> / <video> play event
   */
  private handleMediaPlay = (e: Event) => {
    const el = e.target;
    if (!(el instanceof HTMLMediaElement)) return;

    this.activeElement = el;

    // Sync or create Web Media Session metadata
    let title = el.title || el.getAttribute('data-title') || el.getAttribute('aria-label');
    if (!title && el.currentSrc) {
      try {
        const urlParts = el.currentSrc.split('/');
        title = decodeURIComponent(urlParts[urlParts.length - 1].split('?')[0]);
      } catch {
        title = 'Audio Track';
      }
    }
    if (!title) title = 'GKEDIT Audio Stream';

    const artist = el.getAttribute('data-artist') || 'GKEDIT AI Studio';
    const album = el.getAttribute('data-album') || 'Media Player';

    // Update navigator.mediaSession
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        if (!navigator.mediaSession.metadata || navigator.mediaSession.metadata.title === '') {
          navigator.mediaSession.metadata = new MediaMetadata({
            title,
            artist,
            album,
            artwork: [
              {
                src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop&q=80',
                sizes: '200x200',
                type: 'image/jpeg',
              },
            ],
          });
        }
        navigator.mediaSession.playbackState = 'playing';
      } catch (err) {
        console.warn('[MediaSessionService] Error updating navigator.mediaSession:', err);
      }
    }

    const currentMetadata =
      typeof navigator !== 'undefined' && 'mediaSession' in navigator
        ? navigator.mediaSession.metadata
        : null;

    const track: DynamicIslandAudioTrack = {
      title: currentMetadata?.title || title,
      artist: currentMetadata?.artist || artist,
      album: currentMetadata?.album || album,
      artworkUrl: currentMetadata?.artwork?.[0]?.src,
      isPlaying: true,
      duration: isFinite(el.duration) && el.duration > 0 ? el.duration : 0,
      currentTime: el.currentTime || 0,
      sourceType: 'audioElement',
    };

    this.currentTrack = track;
    dynamicIslandService.setAudioMedia(track, {
      onTogglePlay: () => this.togglePlay(),
      onNextTrack: () => this.handleNextTrack(),
      onPreviousTrack: () => this.handlePreviousTrack(),
      onSeek: (sec) => this.seekTo(sec),
      onCancel: () => this.dismissMedia(),
    });
  };

  /**
   * Intercept HTML5 <audio> / <video> pause event
   */
  private handleMediaPause = (e: Event) => {
    const el = e.target;
    if (!(el instanceof HTMLMediaElement)) return;

    if (this.currentTrack) {
      this.currentTrack.isPlaying = false;
      this.currentTrack.currentTime = el.currentTime || 0;

      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'paused';
        } catch {}
      }

      dynamicIslandService.updateAudioTrack(this.currentTrack, false);
    }
  };

  /**
   * Intercept HTML5 <audio> / <video> ended event
   */
  private handleMediaEnded = (e: Event) => {
    const el = e.target;
    if (!(el instanceof HTMLMediaElement)) return;

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }

    if (this.currentTrack) {
      this.currentTrack.isPlaying = false;
      dynamicIslandService.updateAudioTrack(this.currentTrack, false);
    }

    // Auto-dismiss island after track completion
    setTimeout(() => {
      const state = dynamicIslandService.getState();
      if (state.mode === 'media' && !state.media?.isPlaying) {
        dynamicIslandService.setIdle();
      }
    }, 4000);
  };

  /**
   * Intercept HTML5 <audio> / <video> timeupdate event
   */
  private handleTimeUpdate = (e: Event) => {
    const el = e.target;
    if (!(el instanceof HTMLMediaElement)) return;

    if (this.currentTrack && this.currentTrack.isPlaying) {
      this.currentTrack.currentTime = el.currentTime;
      if (isFinite(el.duration) && el.duration > 0) {
        this.currentTrack.duration = el.duration;
      }
      dynamicIslandService.updateAudioTrack(this.currentTrack, true);
    }
  };

  /**
   * Play / Resume active media or demo track
   */
  public play() {
    if (this.isDemoPlaying) {
      this.resumeDemoTrack();
      return;
    }

    if (this.activeElement) {
      this.activeElement.play().catch((err) => {
        console.warn('[MediaSessionService] Failed to resume media playback:', err);
      });
    } else {
      // If no active audio element exists, start synthesized Cyber Resonance demo
      this.playDemoTrack();
    }
  }

  /**
   * Pause active media or demo track
   */
  public pause() {
    if (this.isDemoPlaying) {
      this.pauseDemoTrack();
      return;
    }

    if (this.activeElement) {
      this.activeElement.pause();
    }
  }

  /**
   * Toggle Play / Pause
   */
  public togglePlay() {
    if (this.isDemoPlaying) {
      this.pauseDemoTrack();
      return;
    }

    if (this.currentTrack?.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seek to timestamp in seconds
   */
  public seekTo(seconds: number) {
    if (this.isDemoPlaying) {
      this.demoCurrentTime = Math.max(0, Math.min(this.demoDuration, seconds));
      if (this.currentTrack) {
        this.currentTrack.currentTime = this.demoCurrentTime;
        dynamicIslandService.updateAudioTrack(this.currentTrack);
      }
      return;
    }

    if (this.activeElement && isFinite(this.activeElement.duration)) {
      this.activeElement.currentTime = Math.max(0, Math.min(this.activeElement.duration, seconds));
    }
  }

  /**
   * Handle Next Track
   */
  public handleNextTrack() {
    window.dispatchEvent(new CustomEvent('gkedit:media_next_track'));
    // If playing demo, cycle to next sample track
    if (this.isDemoPlaying || !this.activeElement) {
      this.playDemoTrack({
        title: 'Khammam Cyber Resonance · Track 02',
        artist: 'Gopi Krishna (@GKEDIT2141)',
        album: 'AI Matrix Waves',
      });
    }
  }

  /**
   * Handle Previous Track
   */
  public handlePreviousTrack() {
    window.dispatchEvent(new CustomEvent('gkedit:media_prev_track'));
    if (this.activeElement) {
      this.activeElement.currentTime = 0;
    } else if (this.isDemoPlaying) {
      this.demoCurrentTime = 0;
      if (this.currentTrack) {
        this.currentTrack.currentTime = 0;
        dynamicIslandService.updateAudioTrack(this.currentTrack);
      }
    }
  }

  /**
   * Dismiss Dynamic Island media state
   */
  public dismissMedia() {
    this.pause();
    this.stopDemoTrack();
    dynamicIslandService.setIdle();
  }

  /**
   * Explicitly set media track from any part of the app (e.g. TTS, Daily Chronicle, Devotional)
   */
  public setActiveTrack(track: DynamicIslandAudioTrack, element?: HTMLMediaElement) {
    if (element) {
      this.activeElement = element;
    }

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist || 'GKEDIT Studio',
          album: track.album || 'Web Media Session',
          artwork: [
            {
              src:
                track.artworkUrl ||
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop&q=80',
              sizes: '200x200',
              type: 'image/jpeg',
            },
          ],
        });
        navigator.mediaSession.playbackState = track.isPlaying ? 'playing' : 'paused';
      } catch (err) {
        console.warn('[MediaSessionService] Error setting mediaSession metadata:', err);
      }
    }

    this.currentTrack = track;
    dynamicIslandService.setAudioMedia(track, {
      onTogglePlay: () => this.togglePlay(),
      onNextTrack: () => this.handleNextTrack(),
      onPreviousTrack: () => this.handlePreviousTrack(),
      onSeek: (sec) => this.seekTo(sec),
      onCancel: () => this.dismissMedia(),
    });
  }

  /**
   * Play Interactive Demo Track using Web Audio API synthesis
   * Allows immediate testing & audition of the Dynamic Island Media State
   */
  public playDemoTrack(customTrack?: Partial<DynamicIslandAudioTrack>) {
    this.stopDemoTrack();

    const track: DynamicIslandAudioTrack = {
      title: customTrack?.title || 'Cyber Resonance (Ambient Lo-Fi)',
      artist: customTrack?.artist || 'Gopi Krishna • GK EDIT',
      album: customTrack?.album || 'HyperOS Audio Matrix',
      artworkUrl:
        customTrack?.artworkUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=300&fit=crop&q=80',
      isPlaying: true,
      duration: this.demoDuration,
      currentTime: 0,
      sourceType: 'mediaSession',
    };

    this.currentTrack = track;
    this.isDemoPlaying = true;
    this.demoCurrentTime = 0;

    // Set Web Media Session metadata
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist || 'GK EDIT',
          album: track.album || 'Dynamic Island',
          artwork: [
            {
              src: track.artworkUrl!,
              sizes: '300x300',
              type: 'image/jpeg',
            },
          ],
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch {}
    }

    // Play mellow soothing synthesized audio chords via Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.demoAudioContext = new AudioCtx();
        const ctx = this.demoAudioContext;

        const chordNotes = [220, 277.18, 329.63, 440]; // A major 7th chord
        chordNotes.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          // Gentle ambient low volume (non-jarring)
          gain.gain.setValueAtTime(0.02, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 3);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();

          this.demoOscillators.push(osc);
        });
      }
    } catch (e) {
      console.warn('[MediaSessionService] Web Audio API tone synthesis:', e);
    }

    // Tick timeline
    this.demoInterval = setInterval(() => {
      if (this.isDemoPlaying) {
        this.demoCurrentTime += 1;
        if (this.demoCurrentTime >= this.demoDuration) {
          this.stopDemoTrack();
          dynamicIslandService.setIdle();
        } else if (this.currentTrack) {
          this.currentTrack.currentTime = this.demoCurrentTime;
          dynamicIslandService.updateAudioTrack(this.currentTrack, true);
        }
      }
    }, 1000);

    dynamicIslandService.setAudioMedia(track, {
      onTogglePlay: () => this.togglePlay(),
      onNextTrack: () => this.handleNextTrack(),
      onPreviousTrack: () => this.handlePreviousTrack(),
      onSeek: (sec) => this.seekTo(sec),
      onCancel: () => this.dismissMedia(),
    });
  }

  private pauseDemoTrack() {
    this.isDemoPlaying = false;
    if (this.demoAudioContext && this.demoAudioContext.state === 'running') {
      this.demoAudioContext.suspend().catch(() => {});
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'paused';
      } catch {}
    }
    if (this.currentTrack) {
      this.currentTrack.isPlaying = false;
      dynamicIslandService.updateAudioTrack(this.currentTrack, false);
    }
  }

  private resumeDemoTrack() {
    this.isDemoPlaying = true;
    if (this.demoAudioContext && this.demoAudioContext.state === 'suspended') {
      this.demoAudioContext.resume().catch(() => {});
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'playing';
      } catch {}
    }
    if (this.currentTrack) {
      this.currentTrack.isPlaying = true;
      dynamicIslandService.updateAudioTrack(this.currentTrack, true);
    }
  }

  public stopDemoTrack() {
    this.isDemoPlaying = false;
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
    this.demoOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.demoOscillators = [];
    if (this.demoAudioContext) {
      try {
        this.demoAudioContext.close();
      } catch {}
      this.demoAudioContext = null;
    }
  }

  public isDemoActive(): boolean {
    return this.isDemoPlaying;
  }

  public playCyberpunkTributeTrack() {
    this.playDemoTrack({
      title: 'Cyber Resonance (GK EDIT Anthem)',
      artist: 'Gopi Krishna (GK EDIT) • @GKEDIT2141',
      album: 'Prodigy Matrix (Khammam)',
      artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=300&fit=crop&q=80',
    });
  }
}

export const mediaSessionService = new MediaSessionService();
