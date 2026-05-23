import { clsx } from "clsx";

const DIFF_CONFIG: Record<string, { label: string; class: string }> = {
  FACILE:    { label: "Facile",    class: "diff-facile" },
  MEDIA:     { label: "Media",     class: "diff-media" },
  DIFFICILE: { label: "Difficile", class: "diff-difficile" },
  MASTER:    { label: "Master",    class: "diff-master" },
};

export function DifficultyBadge({
  difficulty,
  small = false,
}: {
  difficulty: string;
  small?: boolean;
}) {
  const cfg = DIFF_CONFIG[difficulty] ?? DIFF_CONFIG["FACILE"];
  return (
    <span className={clsx("badge-pill", cfg.class, small && "text-[10px] px-2 py-0.5")}>
      {cfg.label}
    </span>
  );
}
