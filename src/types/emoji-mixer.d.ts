declare module 'emoji-mixer' {
  export interface EmojiCombo {
    leftEmoji: string;
    rightEmoji: string;
    date: string;
  }

  export function toUnicode(emoji: string): string;
  export function checkSupported(emoji: string): EmojiCombo[];
  export function getEmojiCombo(leftUnicode: string, rightUnicode: string): EmojiCombo | undefined;
  export function googleRequestUrl(combo: EmojiCombo): string;
  export const supportedEmojis: string[];
  export const baseUrl: string;
}
