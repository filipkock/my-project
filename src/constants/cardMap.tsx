export const cardNames: Record<number, string> = {
  1: "Knife Crisis",
  2: "Balloon of Love",
  3: "Gift of Guilt",
  4: "Letter of Regret",
  5: "Potion of Maybe",
  6: "Rose Rage",
  7: "Bombastic Mood",
  8: "Fish of Fury",
  9: "Fork of Destiny",
  10: "Angry Sign",
  11: "Sad Egg",
  12: "Mushroom Mood",
  13: "Crying Onion",
  14: "Plant of Patience",
  15: "Toast of Triumph",
};
import Baloon from "~/assets/cards/romanticCollection/baloon.svg";
import Gift from "~/assets/cards/romanticCollection/gift.svg";
import Letter from "~/assets/cards/romanticCollection/letter.svg";
import Potion from "~/assets/cards/romanticCollection/potion.svg";
import Rose from "~/assets/cards/romanticCollection/rose.svg";
import Bomb from "~/assets/cards/madCollection/bomb.svg";
import Fish from "~/assets/cards/madCollection/fish.svg";
import Fork from "~/assets/cards/madCollection/fork.svg";
import Sign from "~/assets/cards/madCollection/sign.svg";
import Egg from "~/assets/cards/hatcollection/egg.svg";
import Mushroom from "~/assets/cards/hatcollection/mushroom.svg";
import Onion from "~/assets/cards/hatcollection/onion.svg";
import Plant from "~/assets/cards/hatcollection/plant.svg";
import Toast from "~/assets/cards/hatcollection/toast.svg";
import Knife from "~/assets/cards/madCollection/knife.svg";

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
const KnifeIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Knife width={width} height={height} />;

export const cardImages: Record<
  number,
  React.FC<{ width: number; height: number }>
> = {
  1: KnifeIcon,
  2: BaloonIcon,
  3: GiftIcon,
  4: LetterIcon,
  5: PotionIcon,
  6: RoseIcon,
  7: BombIcon,
  8: FishIcon,
  9: ForkIcon,
  10: SignIcon,
  11: EggIcon,
  12: MushroomIcon,
  13: OnionIcon,
  14: PlantIcon,
  15: ToastIcon,
};

export const cardQuotes: Record<number, string> = {
  1: "Take your meds... or Poka’s bringing the knife. 🔪",
  2: "Love floats… so do reminders. Don’t let this one pop. 🎈",
  3: "This gift? It's from Poka. Take the damn pill. 🎁",
  4: "You’ve got mail... and a pill to swallow. 💌",
  5: "Poka says: romance starts with routine. Drink the potion. 💖",
  6: "A rose a day? No. But your meds? Definitely. 🌹",
  7: "Boom. Another day, another dose. 💣",
  8: "Poka brought a fish. You bring consistency. 🐟",
  9: "This fork? For dinner. But meds come first. 🍴",
  10: "SIGN: Take your meds or else. ⚠️",
  11: "Soft on the outside, chaotic on the inside. Just like Poka. Take your meds. 🥚",
  12: "Even mushrooms have routines. 🍄",
  13: "I cry so you don’t have to forget your meds. 🧅",
  14: "Grow strong like this plant. Watered with discipline (and meds). 🌱",
  15: "Crispy, toasty, and responsible. Poka approves. 🍞",
};

export const cardCollections: Record<number, string> = {
  1: "Rage Mode",
  2: "Love Stuff",
  3: "Love Stuff",
  4: "Love Stuff",
  5: "Love Stuff",
  6: "Love Stuff",
  7: "Rage Mode",
  8: "Rage Mode",
  9: "Rage Mode",
  10: "Rage Mode",
  11: "Poka’s Hats",
  12: "Poka’s Hats",
  13: "Poka’s Hats",
  14: "Poka’s Hats",
  15: "Poka’s Hats",
};
