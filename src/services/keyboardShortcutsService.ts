// ========================================================================
// GLOBAL KEYBOARD SHORTCUTS SERVICE
// Listens for global hotkeys across the entire app (Ctrl+K, Ctrl+J, etc.)
// Prevents default browser overrides and triggers corresponding app actions
// ========================================================================

import { notificationService } from './notificationService.ts';
import { wakeWordService } from './wakeWordService.ts';

export interface ShortcutItem {
  id: string;
  label: string;
  keys: string[];
  description: string;
  category: 'AI & Voice' | 'Navigation' | 'Tools & Controls' | 'System';
  action: () => void;
}

class KeyboardShortcutsService {
  private isInitialized = false;
  private isEnabled = true;
  private listeners: Set<(actionId: string) => void> = new Set();
  private isModalOpen = false;
  private modalListeners: Set<(isOpen: boolean) => void> = new Set();

  public get shortcuts(): Omit<ShortcutItem, 'action'>[] {
    return [
      {
        id: 'focus_chat',
        label: 'Focus Chat Input',
        keys: ['Ctrl', 'K'],
        description: 'Navigate to Chat tab and immediately focus the AI query input field.',
        category: 'AI & Voice',
      },
      {
        id: 'toggle_wake_word',
        label: 'Activate Wake-Word Listener',
        keys: ['Ctrl', 'J'],
        description: 'Wake J.A.R.V.I.S voice listener, toggle continuous mic mode, and play acoustic chime.',
        category: 'AI & Voice',
      },
      {
        id: 'show_shortcuts',
        label: 'Shortcuts Cheat Sheet',
        keys: ['Ctrl', '/'],
        description: 'Toggle this interactive keyboard hotkeys overview modal.',
        category: 'System',
      },
      {
        id: 'nav_dashboard',
        label: 'Go to Dashboard Home',
        keys: ['Ctrl', 'D'],
        description: 'Jump directly to the main Dashboard screen from anywhere.',
        category: 'Navigation',
      },
      {
        id: 'nav_biolab',
        label: 'Open Bioscience Lab',
        keys: ['Ctrl', 'B'],
        description: 'Launch the 3D Observable Bioscience Learning Lab.',
        category: 'Navigation',
      },
      {
        id: 'toggle_gesture_hud',
        label: 'Toggle Gesture OS HUD',
        keys: ['Ctrl', 'Shift', 'H'],
        description: 'Toggle webcam-based MediaPipe hand gesture HUD tracking overlay.',
        category: 'Tools & Controls',
      },
      {
        id: 'close_modals',
        label: 'Close Active Modals',
        keys: ['Esc'],
        description: 'Dismiss open dialogs, bottom sheets, or blurred overlays.',
        category: 'System',
      },
    ];
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    window.addEventListener('keydown', this.handleKeyDown, { capture: true });
  }

  public destroy() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown, { capture: true });
    this.isInitialized = false;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public subscribe(cb: (actionId: string) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public subscribeModal(cb: (isOpen: boolean) => void): () => void {
    this.modalListeners.add(cb);
    cb(this.isModalOpen);
    return () => this.modalListeners.delete(cb);
  }

  public toggleModal(open?: boolean) {
    this.isModalOpen = open !== undefined ? open : !this.isModalOpen;
    this.modalListeners.forEach((cb) => cb(this.isModalOpen));
  }

  private notify(actionId: string) {
    this.listeners.forEach((cb) => {
      try {
        cb(actionId);
      } catch (err) {
        console.error('Error in shortcut listener:', err);
      }
    });
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isEnabled) return;

    // Check modifier (Ctrl on Windows/Linux, Cmd/Meta on macOS)
    const isModifier = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    // 1. Ctrl+K / Cmd+K -> Focus Chat Input
    if (isModifier && key === 'k') {
      e.preventDefault();
      e.stopPropagation();
      this.executeFocusChat();
      return;
    }

    // 2. Ctrl+J / Cmd+J -> Activate Wake-Word Listener ("Hey Jarvis")
    if (isModifier && key === 'j') {
      e.preventDefault();
      e.stopPropagation();
      this.executeActivateWakeWord();
      return;
    }

    // 3. Ctrl+/ / Cmd+/ -> Toggle Keyboard Shortcuts Cheat Sheet
    if (isModifier && (key === '/' || key === '?')) {
      e.preventDefault();
      e.stopPropagation();
      this.toggleModal();
      return;
    }

    // 4. Ctrl+Shift+H / Cmd+Shift+H -> Toggle Hand Gesture HUD
    if (isModifier && e.shiftKey && key === 'h') {
      e.preventDefault();
      e.stopPropagation();
      this.executeToggleGestureHUD();
      return;
    }

    // 5. Ctrl+D / Cmd+D -> Jump to Dashboard
    if (isModifier && key === 'd') {
      e.preventDefault();
      e.stopPropagation();
      this.executeNavDashboard();
      return;
    }

    // 6. Ctrl+B / Cmd+B -> Jump to Bioscience Lab
    if (isModifier && key === 'b') {
      e.preventDefault();
      e.stopPropagation();
      this.executeNavBioLab();
      return;
    }

    // 7. Escape -> Close modal if open
    if (e.key === 'Escape' && this.isModalOpen) {
      e.preventDefault();
      this.toggleModal(false);
      return;
    }
  };

  /**
   * Action 1: Focus Chat Input (Ctrl+K)
   */
  public executeFocusChat() {
    // 1. Ensure user is navigated to Chat tab
    window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));

    // 2. Request chat input element to focus with short delay for smooth DOM render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('gkedit:focus_chat_input'));
      const inputEl = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input[placeholder*="Ask GKEDIT AI"], textarea[placeholder*="Ask GKEDIT AI"], input[data-chat-input="true"]'
      );
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }, 60);

    notificationService.playSoftChime();
    notificationService.showInAppToast(
      'Chat Input Focused ⌨️',
      'Ctrl+K triggered · Type your query for GKEDIT AI.',
      'info',
      { durationMs: 2500 }
    );

    this.notify('focus_chat');
  }

  /**
   * Action 2: Activate Wake-Word Listener (Ctrl+J)
   */
  public executeActivateWakeWord() {
    // 1. Enable wakeWordService if disabled
    wakeWordService.setEnabled(true);

    // 2. Play acoustic wake chime feedback
    wakeWordService.playWakeChime();

    // 3. Dispatch wake activation event for Dynamic Island reaction and voice prompt
    window.dispatchEvent(
      new CustomEvent('gkedit:wake_word_activated', {
        detail: {
          source: 'keyboard_hotkey',
          hotkey: 'Ctrl+J',
          transcript: 'Keyboard Wake: Jarvis Activated',
        },
      })
    );

    notificationService.showInAppToast(
      '🎙️ J.A.R.V.I.S Activated (Ctrl+J)',
      'Wake-word microphone is active. Say "Hey Jarvis" or speak your voice command!',
      'success',
      { durationMs: 4000 }
    );

    this.notify('toggle_wake_word');
  }

  /**
   * Action 3: Jump to Dashboard (Ctrl+D)
   */
  public executeNavDashboard() {
    window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'dashboard' } }));
    notificationService.showInAppToast('Dashboard 🏠', 'Switched to Dashboard (Ctrl+D)', 'info', {
      durationMs: 2000,
    });
    this.notify('nav_dashboard');
  }

  /**
   * Action 4: Jump to BioLab (Ctrl+B)
   */
  public executeNavBioLab() {
    window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'biolab' } }));
    notificationService.showInAppToast('Bioscience Lab 🧬', 'Opened 3D Study (Ctrl+B)', 'info', {
      durationMs: 2000,
    });
    this.notify('nav_biolab');
  }

  /**
   * Action 5: Toggle Gesture HUD (Ctrl+Shift+H)
   */
  public executeToggleGestureHUD() {
    window.dispatchEvent(new CustomEvent('gkedit:toggle_gesture_hud'));
    this.notify('toggle_gesture_hud');
  }
}

export const keyboardShortcutsService = new KeyboardShortcutsService();
