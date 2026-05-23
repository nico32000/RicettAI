import { Trophy } from "lucide-react";
import { clsx } from "clsx";

export function PointsBadge({ points, small = false }: { points: number; small?: boolean }) {
  return (
    <span
      className={clsx(
        "badge-pill bg-brand-500/20 text-brand-400 border border-brand-500/30",
        small && "text-[10px] px-2 py-0.5"
      )}
    >
      <Trophy size={small ? 10 : 12} />
      +{points} pt
    </span>
  );
}
