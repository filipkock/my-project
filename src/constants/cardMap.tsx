// ====================
// SVG Imports
// ====================

// Romantic Collection
import Baloon from "~/assets/cards/romanticCollection/baloon.svg";
import Gift from "~/assets/cards/romanticCollection/gift.svg";
import Letter from "~/assets/cards/romanticCollection/letter.svg";
import Potion from "~/assets/cards/romanticCollection/potion.svg";
import Rose from "~/assets/cards/romanticCollection/rose.svg";

// Mad Collection
import Bomb from "~/assets/cards/madCollection/bomb.svg";
import Fish from "~/assets/cards/madCollection/fish.svg";
import Fork from "~/assets/cards/madCollection/fork.svg";
import Sign from "~/assets/cards/madCollection/sign.svg";
import Knife from "~/assets/cards/madCollection/knife.svg";

// Hats Collection
import Egg from "~/assets/cards/hatcollection/egg.svg";
import Mushroom from "~/assets/cards/hatcollection/mushroom.svg";
import Onion from "~/assets/cards/hatcollection/onion.svg";
import Plant from "~/assets/cards/hatcollection/plant.svg";
import Toast from "~/assets/cards/hatcollection/toast.svg";

export const cardNames: Record<number, string> = {
  1: "Sad Egg",
  2: "Mushroom Mood",
  3: "Crying Onion",
  4: "Plant of Patience",
  5: "Toast of Triumph",
  6: "Knife Crisis",
  7: "Bombastic Mood",
  8: "Fish of Fury",
  9: "Fork of Destiny",
  10: "Angry Sign",
  11: "Balloon of Love",
  12: "Gift of Guilt",
  13: "Letter of Regret",
  14: "Potion of Maybe",
  15: "Rose Rage",
};

// ====================
// Icon Components
// ====================

// Romantic Collection
const BaloonIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Baloon width={width} height={height} />;
const GiftIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Gift width={width} height={height} />;
const LetterIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Letter width={width} height={height} />;
const PotionIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Potion width={width} height={height} />;
const RoseIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Rose width={width} height={height} />;

// Mad Collection
const BombIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Bomb width={width} height={height} />;
const FishIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Fish width={width} height={height} />;
const ForkIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Fork width={width} height={height} />;
const SignIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Sign width={width} height={height} />;
const KnifeIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Knife width={width} height={height} />;

// Hats Collection
const EggIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Egg width={width} height={height} />;
const MushroomIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Mushroom width={width} height={height} />;
const OnionIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Onion width={width} height={height} />;
const PlantIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Plant width={width} height={height} />;
const ToastIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Toast width={width} height={height} />;

// ====================
// Card Images Mapping
// ====================
export const cardImages: Record<
  number,
  React.FC<{ width: number; height: number }>
> = {
  1: EggIcon,
  2: MushroomIcon,
  3: OnionIcon,
  4: PlantIcon,
  5: ToastIcon,
  6: KnifeIcon,
  7: BombIcon,
  8: FishIcon,
  9: ForkIcon,
  10: SignIcon,
  11: BaloonIcon,
  12: GiftIcon,
  13: LetterIcon,
  14: PotionIcon,
  15: RoseIcon,
};

// ====================
// Card Quotes Mapping
// ====================
export const cardQuotes: Record<number, string> = {
  1: "🥚 Soft on the outside, chaotic on the inside. Just like Poka. Take your meds.",
  2: "🍄 Even mushrooms have routines.",
  3: "🧅 I cry so you don’t have to forget your meds.",
  4: "🌱 Grow strong like this plant. Watered with discipline (and meds).",
  5: "🍞 Crispy, toasty, and responsible. Poka approves.",
  6: "🔪 Take your meds... or Poka’s bringing the knife.",
  7: "💣 Boom. Another day, another dose.",
  8: "🐟 Poka brought a fish. You bring consistency.",
  9: "🍴 This fork? For dinner. But meds come first.",
  10: "⚠️ SIGN: Take your meds or else.",
  11: "🎈 Love floats… so do reminders. Don’t let this one pop.",
  12: "🎁 This gift? It's from Poka. Take the damn pill.",
  13: "💌 You’ve got mail... and a pill to swallow.",
  14: "💖 Poka says: romance starts with routine. Drink the potion.",
  15: "🌹 A rose a day? No. But your meds? Definitely.",
};

// ====================
// Card Collections Mapping
// ====================
export const cardCollections: Record<number, string> = {
  1: "Poka’s Hats",
  2: "Poka’s Hats",
  3: "Poka’s Hats",
  4: "Poka’s Hats",
  5: "Poka’s Hats",
  6: "Rage Mode",
  7: "Rage Mode",
  8: "Rage Mode",
  9: "Rage Mode",
  10: "Rage Mode",
  11: "Love Stuff",
  12: "Love Stuff",
  13: "Love Stuff",
  14: "Love Stuff",
  15: "Love Stuff",
};

// Collections that require Premium (everything except Poka’s Hats)
export const PREMIUM_COLLECTIONS = new Set<string>(["Rage Mode", "Love Stuff"]);

// Quick lookup: is a given card premium-only?
export const cardIsPremium: Record<number, boolean> = Object.fromEntries(
  Object.entries(cardCollections).map(([id, collection]) => [
    Number(id),
    PREMIUM_COLLECTIONS.has(collection),
  ])
) as Record<number, boolean>;
