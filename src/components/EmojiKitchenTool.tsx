import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Shuffle,
  ArrowLeftRight,
  Search,
  Smile,
  Cat,
  UtensilsCrossed,
  Rocket,
  Heart,
  RotateCcw,
  AlertCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  ChefHat,
  Info,
} from 'lucide-react';
import * as mixer from 'emoji-mixer';
import { notificationService } from '../services/notificationService.ts';

// ---------------------------------------------------------------------------
// TYPES & DATA
// ---------------------------------------------------------------------------
export type EmojiCategory = 'all' | 'smilies' | 'animals' | 'food' | 'objects' | 'symbols';

export interface EmojiItem {
  emoji: string;
  name: string;
  category: EmojiCategory;
  hex: string;
}

export interface KitchenMixHistoryItem {
  id: string;
  emoji1: string;
  emoji2: string;
  url: string;
  timestamp: number;
}

// Helper: Convert emoji string to Unicode hexadecimal codepoints (stripping variation selector 0xfe0f)
export function emojiToUnicodeHex(emoji: string): string {
  try {
    const res = mixer.toUnicode(emoji);
    if (res) return res.toLowerCase().replace(/-fe0f/g, '');
  } catch {}
  return Array.from(emoji)
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((code) => code.toLowerCase() !== 'fe0f')
    .join('-')
    .toLowerCase();
}

// Popular curated emojis that have high Google Emoji Kitchen coverage
export const CURATED_EMOJIS: EmojiItem[] = [
  // Smilies & Emotion
  { emoji: '😀', name: 'Grinning Face', category: 'smilies', hex: '1f600' },
  { emoji: '😃', name: 'Grinning Face with Big Eyes', category: 'smilies', hex: '1f603' },
  { emoji: '😄', name: 'Grinning Face with Smiling Eyes', category: 'smilies', hex: '1f604' },
  { emoji: '😁', name: 'Beaming Face with Smiling Eyes', category: 'smilies', hex: '1f601' },
  { emoji: '😆', name: 'Grinning Squinting Face', category: 'smilies', hex: '1f606' },
  { emoji: '😅', name: 'Grinning Face with Sweat', category: 'smilies', hex: '1f605' },
  { emoji: '😂', name: 'Face with Tears of Joy', category: 'smilies', hex: '1f602' },
  { emoji: '🤣', name: 'Rolling on the Floor Laughing', category: 'smilies', hex: '1f923' },
  { emoji: '🥲', name: 'Smiling Face with Tear', category: 'smilies', hex: '1f972' },
  { emoji: '🥹', name: 'Face Holding Back Tears', category: 'smilies', hex: '1f979' },
  { emoji: '😊', name: 'Smiling Face with Smiling Eyes', category: 'smilies', hex: '1f60a' },
  { emoji: '😇', name: 'Smiling Face with Halo', category: 'smilies', hex: '1f607' },
  { emoji: '🙂', name: 'Slightly Smiling Face', category: 'smilies', hex: '1f642' },
  { emoji: '🙃', name: 'Upside-Down Face', category: 'smilies', hex: '1f643' },
  { emoji: '😉', name: 'Winking Face', category: 'smilies', hex: '1f609' },
  { emoji: '😌', name: 'Relieved Face', category: 'smilies', hex: '1f60c' },
  { emoji: '😍', name: 'Smiling Face with Heart-Eyes', category: 'smilies', hex: '1f60d' },
  { emoji: '🥰', name: 'Smiling Face with Hearts', category: 'smilies', hex: '1f970' },
  { emoji: '😘', name: 'Face Blowing a Kiss', category: 'smilies', hex: '1f618' },
  { emoji: '😋', name: 'Face Savoring Food', category: 'smilies', hex: '1f60b' },
  { emoji: '😛', name: 'Face with Tongue', category: 'smilies', hex: '1f61b' },
  { emoji: '😜', name: 'Winking Face with Tongue', category: 'smilies', hex: '1f61c' },
  { emoji: '🤪', name: 'Zany Face', category: 'smilies', hex: '1f92a' },
  { emoji: '😝', name: 'Squinting Face with Tongue', category: 'smilies', hex: '1f61d' },
  { emoji: '🤑', name: 'Money-Mouth Face', category: 'smilies', hex: '1f911' },
  { emoji: '🤗', name: 'Smiling Face with Open Hands', category: 'smilies', hex: '1f917' },
  { emoji: '🤭', name: 'Face with Hand Over Mouth', category: 'smilies', hex: '1f92d' },
  { emoji: '🤫', name: 'Shushing Face', category: 'smilies', hex: '1f92b' },
  { emoji: '🤔', name: 'Thinking Face', category: 'smilies', hex: '1f914' },
  { emoji: '🤐', name: 'Zipper-Mouth Face', category: 'smilies', hex: '1f910' },
  { emoji: '🤨', name: 'Face with Raised Eyebrow', category: 'smilies', hex: '1f928' },
  { emoji: '😐', name: 'Neutral Face', category: 'smilies', hex: '1f610' },
  { emoji: '😑', name: 'Expressionless Face', category: 'smilies', hex: '1f611' },
  { emoji: '😶', name: 'Face Without Mouth', category: 'smilies', hex: '1f636' },
  { emoji: '😏', name: 'Smirking Face', category: 'smilies', hex: '1f60f' },
  { emoji: '😒', name: 'Unamused Face', category: 'smilies', hex: '1f612' },
  { emoji: '🙄', name: 'Face with Rolling Eyes', category: 'smilies', hex: '1f644' },
  { emoji: '😬', name: 'Grimacing Face', category: 'smilies', hex: '1f62c' },
  { emoji: '🤥', name: 'Lying Face', category: 'smilies', hex: '1f925' },
  { emoji: '😌', name: 'Relieved Face', category: 'smilies', hex: '1f60c' },
  { emoji: '😔', name: 'Pensive Face', category: 'smilies', hex: '1f614' },
  { emoji: '😪', name: 'Sleepy Face', category: 'smilies', hex: '1f62a' },
  { emoji: '🤤', name: 'Drooling Face', category: 'smilies', hex: '1f924' },
  { emoji: '😴', name: 'Sleeping Face', category: 'smilies', hex: '1f634' },
  { emoji: '😷', name: 'Face with Medical Mask', category: 'smilies', hex: '1f637' },
  { emoji: '🤒', name: 'Face with Thermometer', category: 'smilies', hex: '1f912' },
  { emoji: '🤕', name: 'Face with Head-Bandage', category: 'smilies', hex: '1f915' },
  { emoji: '🤢', name: 'Nauseated Face', category: 'smilies', hex: '1f922' },
  { emoji: '🤮', name: 'Face Vomiting', category: 'smilies', hex: '1f92e' },
  { emoji: '🤧', name: 'Sneezing Face', category: 'smilies', hex: '1f927' },
  { emoji: '🥵', name: 'Hot Face', category: 'smilies', hex: '1f975' },
  { emoji: '🥶', name: 'Cold Face', category: 'smilies', hex: '1f976' },
  { emoji: '🥴', name: 'Woozy Face', category: 'smilies', hex: '1f974' },
  { emoji: '😵', name: 'Dizzy Face', category: 'smilies', hex: '1f635' },
  { emoji: '🤯', name: 'Exploding Head', category: 'smilies', hex: '1f92f' },
  { emoji: '🤠', name: 'Cowboy Hat Face', category: 'smilies', hex: '1f920' },
  { emoji: '🥳', name: 'Partying Face', category: 'smilies', hex: '1f973' },
  { emoji: '😎', name: 'Smiling Face with Sunglasses', category: 'smilies', hex: '1f60e' },
  { emoji: '🤓', name: 'Nerd Face', category: 'smilies', hex: '1f913' },
  { emoji: '🧐', name: 'Face with Monocle', category: 'smilies', hex: '1f9d0' },
  { emoji: '😕', name: 'Confused Face', category: 'smilies', hex: '1f615' },
  { emoji: '😟', name: 'Worried Face', category: 'smilies', hex: '1f61f' },
  { emoji: '🙁', name: 'Slightly Frowning Face', category: 'smilies', hex: '1f641' },
  { emoji: '😮', name: 'Face with Open Mouth', category: 'smilies', hex: '1f62e' },
  { emoji: '😯', name: 'Hushed Face', category: 'smilies', hex: '1f62f' },
  { emoji: '😲', name: 'Astonished Face', category: 'smilies', hex: '1f632' },
  { emoji: '😳', name: 'Flushed Face', category: 'smilies', hex: '1f633' },
  { emoji: '🥺', name: 'Pleading Face', category: 'smilies', hex: '1f97a' },
  { emoji: '😦', name: 'Frowning Face with Open Mouth', category: 'smilies', hex: '1f626' },
  { emoji: '😧', name: 'Anguished Face', category: 'smilies', hex: '1f627' },
  { emoji: '😨', name: 'Fearful Face', category: 'smilies', hex: '1f628' },
  { emoji: '😰', name: 'Anxious Face with Sweat', category: 'smilies', hex: '1f630' },
  { emoji: '😥', name: 'Sad but Relieved Face', category: 'smilies', hex: '1f625' },
  { emoji: '😢', name: 'Crying Face', category: 'smilies', hex: '1f622' },
  { emoji: '😭', name: 'Loudly Crying Face', category: 'smilies', hex: '1f62d' },
  { emoji: '😱', name: 'Face Screaming in Fear', category: 'smilies', hex: '1f631' },
  { emoji: '😖', name: 'Confounded Face', category: 'smilies', hex: '1f616' },
  { emoji: '😣', name: 'Persevering Face', category: 'smilies', hex: '1f623' },
  { emoji: '😞', name: 'Disappointed Face', category: 'smilies', hex: '1f61e' },
  { emoji: '😓', name: 'Downcast Face with Sweat', category: 'smilies', hex: '1f613' },
  { emoji: '😩', name: 'Weary Face', category: 'smilies', hex: '1f629' },
  { emoji: '😫', name: 'Tired Face', category: 'smilies', hex: '1f62b' },
  { emoji: '🥱', name: 'Yawning Face', category: 'smilies', hex: '1f971' },
  { emoji: '😤', name: 'Face with Steam From Nose', category: 'smilies', hex: '1f624' },
  { emoji: '😡', name: 'Enraged Face', category: 'smilies', hex: '1f621' },
  { emoji: '😠', name: 'Angry Face', category: 'smilies', hex: '1f620' },
  { emoji: '🤬', name: 'Face with Symbols on Mouth', category: 'smilies', hex: '1f92c' },
  { emoji: '😈', name: 'Smiling Face with Horns', category: 'smilies', hex: '1f608' },
  { emoji: '👿', name: 'Angry Face with Horns', category: 'smilies', hex: '1f47f' },
  { emoji: '💀', name: 'Skull', category: 'smilies', hex: '1f480' },
  { emoji: '☠️', name: 'Skull and Crossbones', category: 'smilies', hex: '2620' },
  { emoji: '💩', name: 'Pile of Poo', category: 'smilies', hex: '1f4a9' },
  { emoji: '🤡', name: 'Clown Face', category: 'smilies', hex: '1f921' },
  { emoji: '👹', name: 'Ogre', category: 'smilies', hex: '1f479' },
  { emoji: '👻', name: 'Ghost', category: 'smilies', hex: '1f47b' },
  { emoji: '👽', name: 'Alien', category: 'smilies', hex: '1f47d' },
  { emoji: '👾', name: 'Alien Monster', category: 'smilies', hex: '1f47e' },
  { emoji: '🤖', name: 'Robot', category: 'smilies', hex: '1f916' },

  // Animals & Nature
  { emoji: '🐱', name: 'Cat Face', category: 'animals', hex: '1f431' },
  { emoji: '🐶', name: 'Dog Face', category: 'animals', hex: '1f436' },
  { emoji: '🐭', name: 'Mouse Face', category: 'animals', hex: '1f42d' },
  { emoji: '🐹', name: 'Hamster', category: 'animals', hex: '1f439' },
  { emoji: '🐰', name: 'Rabbit Face', category: 'animals', hex: '1f430' },
  { emoji: '🦊', name: 'Fox', category: 'animals', hex: '1f98a' },
  { emoji: '🐻', name: 'Bear', category: 'animals', hex: '1f43b' },
  { emoji: '🐼', name: 'Panda', category: 'animals', hex: '1f43c' },
  { emoji: '🐨', name: 'Koala', category: 'animals', hex: '1f428' },
  { emoji: '🐯', name: 'Tiger Face', category: 'animals', hex: '1f42f' },
  { emoji: '🦁', name: 'Lion', category: 'animals', hex: '1f981' },
  { emoji: '🐮', name: 'Cow Face', category: 'animals', hex: '1f42e' },
  { emoji: '🐷', name: 'Pig Face', category: 'animals', hex: '1f437' },
  { emoji: '🐸', name: 'Frog', category: 'animals', hex: '1f438' },
  { emoji: '🐵', name: 'Monkey Face', category: 'animals', hex: '1f435' },
  { emoji: '🐔', name: 'Chicken', category: 'animals', hex: '1f414' },
  { emoji: '🐧', name: 'Penguin', category: 'animals', hex: '1f427' },
  { emoji: '🐦', name: 'Bird', category: 'animals', hex: '1f426' },
  { emoji: '🐤', name: 'Baby Chick', category: 'animals', hex: '1f424' },
  { emoji: '🦆', name: 'Duck', category: 'animals', hex: '1f986' },
  { emoji: '🦅', name: 'Eagle', category: 'animals', hex: '1f985' },
  { emoji: '🦉', name: 'Owl', category: 'animals', hex: '1f989' },
  { emoji: '🦇', name: 'Bat', category: 'animals', hex: '1f987' },
  { emoji: '🐺', name: 'Wolf', category: 'animals', hex: '1f43a' },
  { emoji: '🐗', name: 'Boar', category: 'animals', hex: '1f417' },
  { emoji: '🐴', name: 'Horse Face', category: 'animals', hex: '1f434' },
  { emoji: '🦄', name: 'Unicorn', category: 'animals', hex: '1f984' },
  { emoji: '🐝', name: 'Honeybee', category: 'animals', hex: '1f41d' },
  { emoji: '🐛', name: 'Bug', category: 'animals', hex: '1f41b' },
  { emoji: '🦋', name: 'Butterfly', category: 'animals', hex: '1f98b' },
  { emoji: '🐌', name: 'Snail', category: 'animals', hex: '1f40c' },
  { emoji: '🐞', name: 'Lady Beetle', category: 'animals', hex: '1f41e' },
  { emoji: '🐜', name: 'Ant', category: 'animals', hex: '1f41c' },
  { emoji: '🕷️', name: 'Spider', category: 'animals', hex: '1f577' },
  { emoji: '🦂', name: 'Scorpion', category: 'animals', hex: '1f982' },
  { emoji: '🐢', name: 'Turtle', category: 'animals', hex: '1f422' },
  { emoji: '🐍', name: 'Snake', category: 'animals', hex: '1f40d' },
  { emoji: '🦎', name: 'Lizard', category: 'animals', hex: '1f98e' },
  { emoji: '🐙', name: 'Octopus', category: 'animals', hex: '1f419' },
  { emoji: '🦑', name: 'Squid', category: 'animals', hex: '1f991' },
  { emoji: '🦐', name: 'Shrimp', category: 'animals', hex: '1f990' },
  { emoji: '🦞', name: 'Lobster', category: 'animals', hex: '1f99e' },
  { emoji: '🦀', name: 'Crab', category: 'animals', hex: '1f980' },
  { emoji: '🐡', name: 'Blowfish', category: 'animals', hex: '1f421' },
  { emoji: '🐠', name: 'Tropical Fish', category: 'animals', hex: '1f420' },
  { emoji: '🐟', name: 'Fish', category: 'animals', hex: '1f41f' },
  { emoji: '🐬', name: 'Dolphin', category: 'animals', hex: '1f42c' },
  { emoji: '🐳', name: 'Spouting Whale', category: 'animals', hex: '1f433' },
  { emoji: '🦈', name: 'Shark', category: 'animals', hex: '1f988' },
  { emoji: '🐊', name: 'Crocodile', category: 'animals', hex: '1f40a' },

  // Food & Drink
  { emoji: '🍕', name: 'Pizza', category: 'food', hex: '1f355' },
  { emoji: '🍔', name: 'Hamburger', category: 'food', hex: '1f354' },
  { emoji: '🍟', name: 'French Fries', category: 'food', hex: '1f35f' },
  { emoji: '🌭', name: 'Hot Dog', category: 'food', hex: '1f32d' },
  { emoji: '🍿', name: 'Popcorn', category: 'food', hex: '1f37f' },
  { emoji: '🥑', name: 'Avocado', category: 'food', hex: '1f951' },
  { emoji: '🌮', name: 'Taco', category: 'food', hex: '1f32e' },
  { emoji: '🌯', name: 'Burrito', category: 'food', hex: '1f32f' },
  { emoji: '🧀', name: 'Cheese Wedge', category: 'food', hex: '1f9c0' },
  { emoji: '🥐', name: 'Croissant', category: 'food', hex: '1f950' },
  { emoji: '🍞', name: 'Bread', category: 'food', hex: '1f35e' },
  { emoji: '🍳', name: 'Cooking Egg', category: 'food', hex: '1f373' },
  { emoji: '🥓', name: 'Bacon', category: 'food', hex: '1f953' },
  { emoji: '🥩', name: 'Cut of Meat', category: 'food', hex: '1f969' },
  { emoji: '🍗', name: 'Poultry Leg', category: 'food', hex: '1f357' },
  { emoji: '🍜', name: 'Steaming Bowl', category: 'food', hex: '1f35c' },
  { emoji: '🍝', name: 'Spaghetti', category: 'food', hex: '1f35d' },
  { emoji: '🍣', name: 'Sushi', category: 'food', hex: '1f363' },
  { emoji: '🍦', name: 'Soft Ice Cream', category: 'food', hex: '1f366' },
  { emoji: '🍩', name: 'Doughnut', category: 'food', hex: '1f369' },
  { emoji: '🍪', name: 'Cookie', category: 'food', hex: '1f36a' },
  { emoji: '🎂', name: 'Birthday Cake', category: 'food', hex: '1f382' },
  { emoji: '🍰', name: 'Shortcake', category: 'food', hex: '1f370' },
  { emoji: '🧁', name: 'Cupcake', category: 'food', hex: '1f9c1' },
  { emoji: '🍫', name: 'Chocolate Bar', category: 'food', hex: '1f36b' },
  { emoji: '🍬', name: 'Candy', category: 'food', hex: '1f36c' },
  { emoji: '🍭', name: 'Lollipop', category: 'food', hex: '1f36d' },
  { emoji: '🍎', name: 'Red Apple', category: 'food', hex: '1f34e' },
  { emoji: '🍌', name: 'Banana', category: 'food', hex: '1f34c' },
  { emoji: '🍉', name: 'Watermelon', category: 'food', hex: '1f349' },
  { emoji: '🍇', name: 'Grapes', category: 'food', hex: '1f347' },
  { emoji: '🍓', name: 'Strawberry', category: 'food', hex: '1f353' },
  { emoji: '🍒', name: 'Cherries', category: 'food', hex: '1f352' },
  { emoji: '🍑', name: 'Peach', category: 'food', hex: '1f351' },
  { emoji: '🍍', name: 'Pineapple', category: 'food', hex: '1f34d' },
  { emoji: '🥥', name: 'Coconut', category: 'food', hex: '1f965' },
  { emoji: '☕', name: 'Hot Beverage', category: 'food', hex: '2615' },
  { emoji: '🧋', name: 'Bubble Tea', category: 'food', hex: '1f9cb' },
  { emoji: '🍺', name: 'Beer Mug', category: 'food', hex: '1f37a' },
  { emoji: '🍷', name: 'Wine Glass', category: 'food', hex: '1f377' },

  // Objects & Activities
  { emoji: '🚀', name: 'Rocket', category: 'objects', hex: '1f680' },
  { emoji: '🛸', name: 'Flying Saucer', category: 'objects', hex: '1f6f8' },
  { emoji: '🔥', name: 'Fire', category: 'objects', hex: '1f525' },
  { emoji: '✨', name: 'Sparkles', category: 'objects', hex: '2728' },
  { emoji: '⭐', name: 'Star', category: 'objects', hex: '2b50' },
  { emoji: '🌟', name: 'Glowing Star', category: 'objects', hex: '1f31f' },
  { emoji: '🌈', name: 'Rainbow', category: 'objects', hex: '1f308' },
  { emoji: '⚡', name: 'High Voltage', category: 'objects', hex: '26a1' },
  { emoji: '💥', name: 'Collision', category: 'objects', hex: '1f4a5' },
  { emoji: '🎉', name: 'Party Popper', category: 'objects', hex: '1f389' },
  { emoji: '🎈', name: 'Balloon', category: 'objects', hex: '1f388' },
  { emoji: '💎', name: 'Gem Stone', category: 'objects', hex: '1f48e' },
  { emoji: '👑', name: 'Crown', category: 'objects', hex: '1f451' },
  { emoji: '🕶️', name: 'Sunglasses', category: 'objects', hex: '1f576' },
  { emoji: '🎮', name: 'Video Game', category: 'objects', hex: '1f3ae' },
  { emoji: '🎯', name: 'Bullseye', category: 'objects', hex: '1f3af' },
  { emoji: '🔮', name: 'Crystal Ball', category: 'objects', hex: '1f52e' },
  { emoji: '💡', name: 'Light Bulb', category: 'objects', hex: '1f4a1' },
  { emoji: '💣', name: 'Bomb', category: 'objects', hex: '1f4a3' },
  { emoji: '🗡️', name: 'Dagger', category: 'objects', hex: '1f5e1' },
  { emoji: '🛡️', name: 'Shield', category: 'objects', hex: '1f6e1' },
  { emoji: '🎧', name: 'Headphone', category: 'objects', hex: '1f3a7' },
  { emoji: '🎤', name: 'Microphone', category: 'objects', hex: '1f3a4' },
  { emoji: '🎸', name: 'Guitar', category: 'objects', hex: '1f3b8' },
  { emoji: '🏆', name: 'Trophy', category: 'objects', hex: '1f3c6' },
  { emoji: '🥇', name: '1st Place Medal', category: 'objects', hex: '1f947' },
  { emoji: '📱', name: 'Mobile Phone', category: 'objects', hex: '1f4f1' },
  { emoji: '💻', name: 'Laptop', category: 'objects', hex: '1f4bb' },
  { emoji: '📷', name: 'Camera', category: 'objects', hex: '1f4f7' },
  { emoji: '💰', name: 'Money Bag', category: 'objects', hex: '1f4b0' },

  // Symbols & Magic
  { emoji: '❤️', name: 'Red Heart', category: 'symbols', hex: '2764' },
  { emoji: '🧡', name: 'Orange Heart', category: 'symbols', hex: '1f9e1' },
  { emoji: '💛', name: 'Yellow Heart', category: 'symbols', hex: '1f49b' },
  { emoji: '💚', name: 'Green Heart', category: 'symbols', hex: '1f49a' },
  { emoji: '💙', name: 'Blue Heart', category: 'symbols', hex: '1f499' },
  { emoji: '💜', name: 'Purple Heart', category: 'symbols', hex: '1f49c' },
  { emoji: '🖤', name: 'Black Heart', category: 'symbols', hex: '1f5a4' },
  { emoji: '🤍', name: 'White Heart', category: 'symbols', hex: '1f90d' },
  { emoji: '🤎', name: 'Brown Heart', category: 'symbols', hex: '1f90e' },
  { emoji: '💔', name: 'Broken Heart', category: 'symbols', hex: '1f494' },
  { emoji: '💖', name: 'Sparkling Heart', category: 'symbols', hex: '1f496' },
  { emoji: '💯', name: 'Hundred Points', category: 'symbols', hex: '1f4af' },
  { emoji: '💢', name: 'Anger Symbol', category: 'symbols', hex: '1f4a2' },
  { emoji: '💤', name: 'Zzz', category: 'symbols', hex: '1f4a4' },
  { emoji: '💫', name: 'Dizzy Star', category: 'symbols', hex: '1f4ab' },
  { emoji: '☀️', name: 'Sun', category: 'symbols', hex: '2600' },
  { emoji: '🌙', name: 'Crescent Moon', category: 'symbols', hex: '1f319' },
  { emoji: '☁️', name: 'Cloud', category: 'symbols', hex: '2601' },
  { emoji: '🌧️', name: 'Cloud with Rain', category: 'symbols', hex: '1f327' },
  { emoji: '❄️', name: 'Snowflake', category: 'symbols', hex: '2744' },
  { emoji: '⚡', name: 'Lightning', category: 'symbols', hex: '26a1' },
  { emoji: '🍄', name: 'Mushroom', category: 'symbols', hex: '1f344' },
  { emoji: '🌹', name: 'Rose', category: 'symbols', hex: '1f339' },
  { emoji: '🌻', name: 'Sunflower', category: 'symbols', hex: '1f33b' },
  { emoji: '🍀', name: 'Four Leaf Clover', category: 'symbols', hex: '1f340' },
];

/**
 * Generate candidate CDN and API URLs for mixing two emojis
 */
export function getEmojiKitchenCandidateUrls(emoji1: string, emoji2: string): string[] {
  const u1 = emojiToUnicodeHex(emoji1);
  const u2 = emojiToUnicodeHex(emoji2);
  const urls: string[] = [];

  // 1. Check mixer combos (resolves known exact Google date batches)
  try {
    const c1 = mixer.getEmojiCombo(u1, u2);
    if (c1) urls.push(mixer.googleRequestUrl(c1));
    const c2 = mixer.getEmojiCombo(u2, u1);
    if (c2) urls.push(mixer.googleRequestUrl(c2));
  } catch {}

  // 2. Primary endpoint requested by specification
  urls.push(`https://emojikitchen.dev/api/combine?emoji1=${u1}&emoji2=${u2}`);

  // 3. Fallback Google static CDN specified by prompt
  urls.push(`https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${u1}/u${u1}_u${u2}.png`);
  urls.push(`https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${u2}/u${u2}_u${u1}.png`);

  // 4. Secondary release batches (widely used in Google Emoji Kitchen for newer additions)
  const batches = ['20230301', '20210521', '20211115', '20220110', '20220815', '20230803', '20240530', '20250130'];
  for (const b of batches) {
    urls.push(`https://www.gstatic.com/android/keyboard/emojikitchen/${b}/u${u1}/u${u1}_u${u2}.png`);
    urls.push(`https://www.gstatic.com/android/keyboard/emojikitchen/${b}/u${u2}/u${u2}_u${u1}.png`);
  }

  return Array.from(new Set(urls));
}

// ---------------------------------------------------------------------------
// EMOJI KITCHEN REACT TOOL COMPONENT
// ---------------------------------------------------------------------------
export function EmojiKitchenTool({ onBack }: { onBack?: () => void }) {
  const [slot1, setSlot1] = useState<string>('🐱');
  const [slot2, setSlot2] = useState<string>('🚀');
  const [activeSlot, setActiveSlot] = useState<1 | 2>(2);
  const [selectedCategory, setSelectedCategory] = useState<EmojiCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Result state
  const [stickerUrl, setStickerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [copying, setCopying] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // History state
  const [history, setHistory] = useState<KitchenMixHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('gkedit_emoji_kitchen_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter emojis based on category and search query
  const filteredEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CURATED_EMOJIS.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.emoji.includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.hex.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Resolve sticker mix whenever slot1 or slot2 changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setIsError(false);
    setStickerUrl(null);

    const candidates = getEmojiKitchenCandidateUrls(slot1, slot2);

    // Asynchronously probe candidate URLs sequentially until one loads
    const probeNextCandidate = (index: number) => {
      if (isCancelled) return;
      if (index >= candidates.length) {
        setIsLoading(false);
        setIsError(true);
        return;
      }

      const url = candidates[index];
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        if (isCancelled) return;
        setStickerUrl(url);
        setIsLoading(false);
        setIsError(false);

        // Add to history
        setHistory((prev) => {
          const exists = prev.some((h) => h.emoji1 === slot1 && h.emoji2 === slot2);
          if (exists) return prev;
          const updated = [
            {
              id: `${slot1}_${slot2}_${Date.now()}`,
              emoji1: slot1,
              emoji2: slot2,
              url,
              timestamp: Date.now(),
            },
            ...prev.slice(0, 19),
          ];
          try {
            localStorage.setItem('gkedit_emoji_kitchen_history', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      };

      img.onerror = () => {
        if (isCancelled) return;
        probeNextCandidate(index + 1);
      };

      img.src = url;
    };

    probeNextCandidate(0);

    return () => {
      isCancelled = true;
    };
  }, [slot1, slot2]);

  // Emoji Selection Handler
  const handleSelectEmoji = (emoji: string) => {
    if (activeSlot === 1) {
      setSlot1(emoji);
      setActiveSlot(2); // auto advance to slot 2 for snappy UX
    } else {
      setSlot2(emoji);
    }
  };

  // Swap Slots
  const handleSwapSlots = () => {
    const temp = slot1;
    setSlot1(slot2);
    setSlot2(temp);
  };

  // Randomize Both Slots
  const handleRandomize = () => {
    const pool = CURATED_EMOJIS;
    const random1 = pool[Math.floor(Math.random() * pool.length)].emoji;
    const random2 = pool[Math.floor(Math.random() * pool.length)].emoji;
    setSlot1(random1);
    setSlot2(random2);
  };

  // Copy Sticker / Image to Clipboard
  const handleCopySticker = async () => {
    if (!stickerUrl) return;
    setCopying(true);

    try {
      // 1. Fetch PNG Blob
      const response = await fetch(stickerUrl);
      const blob = await response.blob();

      // 2. Write direct image blob to clipboard if supported
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedSuccess(true);
        notificationService.showInAppToast(
          'Sticker Copied',
          'Copied sticker to clipboard! ✅ Paste directly in WhatsApp, Discord, or Telegram.',
          'success'
        );
      } else {
        // Fallback: Copy URL
        await navigator.clipboard.writeText(stickerUrl);
        setCopiedSuccess(true);
        notificationService.showInAppToast(
          'Sticker Link Copied',
          'Copied sticker link to clipboard! ✅',
          'success'
        );
      }
    } catch (err) {
      console.warn('Direct image clipboard copy failed, falling back to URL copy:', err);
      try {
        await navigator.clipboard.writeText(stickerUrl);
        setCopiedSuccess(true);
        notificationService.showInAppToast(
          'Sticker Link Copied',
          'Copied sticker image link to clipboard! ✅',
          'success'
        );
      } catch (copyErr) {
        notificationService.showInAppToast(
          'Copy Failed',
          'Please right-click or long-press the sticker to copy.',
          'alert'
        );
      }
    } finally {
      setCopying(false);
      setTimeout(() => setCopiedSuccess(false), 2500);
    }
  };

  // Download Sticker PNG
  const handleDownload = async () => {
    if (!stickerUrl) return;
    try {
      const response = await fetch(stickerUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `emoji-kitchen-${emojiToUnicodeHex(slot1)}_${emojiToUnicodeHex(slot2)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      notificationService.showInAppToast('Sticker Downloaded', 'Saved transparent PNG sticker to downloads! 📥', 'success');
    } catch {
      // Direct window open fallback
      window.open(stickerUrl, '_blank');
    }
  };

  // Share Sticker via Web Share API
  const handleShare = async () => {
    if (!stickerUrl) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const response = await fetch(stickerUrl);
        const blob = await response.blob();
        const file = new File([blob], `sticker-${slot1}-${slot2}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `GKEDIT Emoji Kitchen: ${slot1} + ${slot2}`,
            text: `Look at this emoji sticker mashup: ${slot1} + ${slot2}!`,
            files: [file],
          });
        } else {
          await navigator.share({
            title: `GKEDIT Emoji Kitchen: ${slot1} + ${slot2}`,
            url: stickerUrl,
          });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopySticker();
        }
      }
    } else {
      handleCopySticker();
    }
  };

  const categories: { id: EmojiCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'smilies', label: 'Smilies', icon: <Smile className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'animals', label: 'Animals', icon: <Cat className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'food', label: 'Food', icon: <UtensilsCrossed className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'objects', label: 'Objects', icon: <Rocket className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'symbols', label: 'Symbols', icon: <Heart className="w-3.5 h-3.5 text-pink-400" /> },
  ];

  return (
    <div className="w-full space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* HEADER BANNER                                                */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-950/40 via-[#03091e]/90 to-purple-950/30 border border-cyan-500/30 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <ChefHat className="w-5 h-5 text-cyan-300 animate-pulse" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>GOOGLE EMOJI KITCHEN</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/40 text-cyan-200">
                  HD STICKER LAB
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Mix any two emojis into authentic Google Emoji Kitchen PNG stickers. 1-tap copy directly into
              WhatsApp, Telegram, Discord, or download transparent high-res art.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRandomize}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold text-cyan-300 hover:text-white transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              title="Pick 2 Random Emojis"
            >
              <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Surprise Mix</span>
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              >
                Back to Tools
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MIXING WORKSPACE: SLOTS & CENTRAL PREVIEW                     */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* SLOTS COLUMN (Left on desktop) */}
        <div className="md:col-span-5 flex flex-col justify-between gap-4 p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 backdrop-blur-xl shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ingredients (Tap to Choose)</span>
              </span>
              <button
                onClick={handleSwapSlots}
                className="p-1 px-2.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 hover:text-white transition flex items-center gap-1 active:scale-95 cursor-pointer"
                title="Swap Slot 1 & Slot 2"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Swap</span>
              </button>
            </div>

            {/* Two Interactive Selection Slots */}
            <div className="grid grid-cols-2 gap-3">
              {/* Slot 1 Box */}
              <button
                type="button"
                onClick={() => setActiveSlot(1)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-center group ${
                  activeSlot === 1
                    ? 'bg-gradient-to-b from-cyan-500/25 to-blue-900/20 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.4)] scale-[1.02]'
                    : 'bg-slate-950/70 border-white/10 hover:border-cyan-400/40 hover:bg-slate-900/80'
                }`}
              >
                {activeSlot === 1 && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 shadow-[0_0_8px_#22d3ee]">
                    ACTIVE
                  </span>
                )}
                <span className="text-5xl my-2 transition-transform duration-200 group-hover:scale-110 drop-shadow-lg select-none">
                  {slot1}
                </span>
                <span className="text-[11px] font-bold text-white mt-1">Slot 1</span>
                <span className="text-[9px] font-mono text-cyan-300/80 uppercase">
                  u{emojiToUnicodeHex(slot1)}
                </span>
              </button>

              {/* Slot 2 Box */}
              <button
                type="button"
                onClick={() => setActiveSlot(2)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-center group ${
                  activeSlot === 2
                    ? 'bg-gradient-to-b from-cyan-500/25 to-blue-900/20 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.4)] scale-[1.02]'
                    : 'bg-slate-950/70 border-white/10 hover:border-cyan-400/40 hover:bg-slate-900/80'
                }`}
              >
                {activeSlot === 2 && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 shadow-[0_0_8px_#22d3ee]">
                    ACTIVE
                  </span>
                )}
                <span className="text-5xl my-2 transition-transform duration-200 group-hover:scale-110 drop-shadow-lg select-none">
                  {slot2}
                </span>
                <span className="text-[11px] font-bold text-white mt-1">Slot 2</span>
                <span className="text-[9px] font-mono text-cyan-300/80 uppercase">
                  u{emojiToUnicodeHex(slot2)}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Preset Combos */}
          <div className="pt-3 border-t border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
              Popular Recipes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                ['🐱', '🚀'],
                ['😂', '😭'],
                ['💀', '🔥'],
                ['❤️', '🔥'],
                ['🥑', '🐱'],
                ['🐶', '😎'],
                ['👽', '🤖'],
                ['🍕', '🐱'],
                ['🥰', '✨'],
              ].map(([e1, e2], idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSlot1(e1);
                    setSlot2(e2);
                  }}
                  className="px-2 py-1 rounded-xl bg-slate-900/90 border border-white/10 hover:border-cyan-400/60 text-xs transition active:scale-95 cursor-pointer flex items-center gap-1 text-slate-200 hover:text-white"
                  title={`Mix ${e1} + ${e2}`}
                >
                  <span>{e1}</span>
                  <span className="text-[10px] text-cyan-400 font-bold">+</span>
                  <span>{e2}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTRAL PREVIEW & ACTIONS COLUMN (Right on desktop) */}
        <div className="md:col-span-7 flex flex-col justify-between p-6 rounded-3xl bg-gradient-to-br from-[#061533]/95 via-[#030d24]/90 to-[#020718]/95 border border-cyan-500/35 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.65)] relative">
          {/* Subtle Ambient Caustic Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none rounded-3xl" />

          {/* Result Card Header */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">{slot1}</span>
              <span className="text-xs text-cyan-400 font-mono font-bold">+</span>
              <span className="text-xl">{slot2}</span>
              <span className="text-xs text-slate-400 font-mono font-bold">=</span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Baked Sticker
              </span>
            </div>

            <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40">
              512 × 512 PNG
            </span>
          </div>

          {/* Main Display Stage */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-[220px] py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 text-cyan-300">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping" />
                  <div className="w-16 h-16 rounded-full border-3 border-cyan-400 border-t-transparent animate-spin" />
                  <ChefHat className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold font-mono tracking-wider block">
                    BAKING STICKER RECIPE...
                  </span>
                  <span className="text-[10px] text-slate-400">Querying Google CDN & Endpoints</span>
                </div>
              </div>
            ) : isError || !stickerUrl ? (
              <div className="flex flex-col items-center justify-center gap-2 text-center max-w-sm px-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-amber-200">Combination not available</h4>
                <p className="text-xs text-slate-400 leading-snug">
                  Google hasn't baked a sticker for {slot1} + {slot2} yet. Try swapping the order or tapping
                  Surprise Mix!
                </p>
                <button
                  onClick={handleRandomize}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-xs font-semibold text-cyan-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Try a Random Combo</span>
                </button>
              </div>
            ) : (
              <div className="group relative flex flex-col items-center justify-center">
                {/* Floating caustics & checkboard hint */}
                <div className="relative p-4 rounded-3xl bg-slate-950/60 border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.7)] group-hover:border-cyan-400/60 group-hover:shadow-[0_0_35px_rgba(6,182,212,0.35)] transition-all duration-300">
                  <img
                    src={stickerUrl}
                    alt={`${slot1} + ${slot2} emoji kitchen sticker`}
                    className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span>Transparent PNG</span>
                  <span>•</span>
                  <span>Direct Clipboard Ready</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Toolbar */}
          <div className="relative z-10 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Primary Copy Button */}
            <button
              onClick={handleCopySticker}
              disabled={isLoading || isError || !stickerUrl}
              className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-lg active:scale-95 sm:col-span-1 ${
                copiedSuccess
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied! ✅</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{copying ? 'Copying...' : 'Copy Sticker'}</span>
                </>
              )}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isLoading || isError || !stickerUrl}
              className="py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold text-cyan-200 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download PNG</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              disabled={isLoading || isError || !stickerUrl}
              className="py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-cyan-400/50 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 className="w-4 h-4 text-purple-400" />
              <span>Share Sticker</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SEARCH & CATEGORY SELECTOR + EMOJI SELECTION GRID             */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 backdrop-blur-xl shadow-xl space-y-4">
        {/* Search & Categories Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emojis (e.g., cat, smile, fire)..."
              className="w-full bg-[#03091e] border border-cyan-500/30 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Horizontally Scrollable Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-1 touch-pan-x">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:text-slate-200 hover:border-white/10'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Emoji Grid */}
        <div className="max-h-72 overflow-y-auto pr-1 no-scrollbar space-y-2">
          {filteredEmojis.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No emojis match "{searchQuery}". Try searching for something else!
            </div>
          ) : (
            <div className="grid grid-cols-6 xs:grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
              {filteredEmojis.map((item) => {
                const isSelectedInSlot1 = slot1 === item.emoji;
                const isSelectedInSlot2 = slot2 === item.emoji;

                return (
                  <button
                    key={item.hex + item.name}
                    onClick={() => handleSelectEmoji(item.emoji)}
                    className={`relative p-2.5 rounded-2xl flex items-center justify-center text-2xl transition-all duration-150 cursor-pointer group active:scale-90 ${
                      isSelectedInSlot1 || isSelectedInSlot2
                        ? 'bg-cyan-500/25 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)] scale-105'
                        : 'bg-white/[0.04] border border-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:scale-110'
                    }`}
                    title={`${item.name} (Click to set in Slot ${activeSlot})`}
                  >
                    <span className="drop-shadow select-none">{item.emoji}</span>

                    {/* Indicator if active in slot */}
                    {isSelectedInSlot1 && (
                      <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 font-bold text-[8px] flex items-center justify-center shadow">
                        1
                      </span>
                    )}
                    {isSelectedInSlot2 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-400 text-slate-950 font-bold text-[8px] flex items-center justify-center shadow">
                        2
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RECENT MIXES HISTORY                                          */}
      {/* ------------------------------------------------------------- */}
      {history.length > 0 && (
        <div className="p-5 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Recent Stickers Baked</span>
            </span>
            <button
              onClick={() => {
                setHistory([]);
                localStorage.removeItem('gkedit_emoji_kitchen_history');
              }}
              className="text-[10px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
            >
              Clear History
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scrollbar-none py-1.5 touch-pan-x">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSlot1(item.emoji1);
                  setSlot2(item.emoji2);
                }}
                className="group relative p-2 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-cyan-400/60 transition-all duration-200 cursor-pointer shrink-0 flex flex-col items-center gap-1.5 active:scale-95"
                title={`Re-open ${item.emoji1} + ${item.emoji2}`}
              >
                <img
                  src={item.url}
                  alt={`${item.emoji1} + ${item.emoji2}`}
                  className="w-14 h-14 object-contain drop-shadow transition-transform group-hover:scale-110"
                  loading="lazy"
                />
                <div className="flex items-center gap-1 text-[11px] text-slate-300">
                  <span>{item.emoji1}</span>
                  <span className="text-cyan-400 font-bold">+</span>
                  <span>{item.emoji2}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Modular helper function to initialize Emoji Kitchen on any DOM container
 */
export function initEmojiKitchen(containerEl?: HTMLElement) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('gkedit:open_subtool', {
        detail: { tool: 'emoji_kitchen' },
      })
    );
  }
}
