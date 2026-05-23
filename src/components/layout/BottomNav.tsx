"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, User, Trophy, Users } from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/",           icon: Home,     label: "Home"    },
  { href: "/ricette",    icon: BookOpen, label: "Ricette" },
  { href: "/classifica", icon: Trophy,   label: "Top"     },
  { href: "/amici",      icon: Users,    label: "Amici"   },
  { href: "/profilo",    icon: User,     label: "Profilo" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-800/95 backdrop-blur-md border-t border-dark-700 safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1 max-w-md mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-150",
                active
                  ? "text-brand-500"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                className={clsx(active && "drop-shadow-[0_0_8px_rgba(46,204,113,0.5)]")}
              />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}