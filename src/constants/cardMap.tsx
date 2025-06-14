import Knife from "~/assets/cards/knife.svg";
import Star from "~/assets/cards/star.svg";

const KnifeIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Knife width={width} height={height} />;

const StarIcon: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => <Star width={width} height={height} />;

export const cardImages: Record<
  number,
  React.FC<{ width: number; height: number }>
> = {
  1: KnifeIcon,
  2: StarIcon,
};
