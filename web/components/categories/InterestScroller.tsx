"use client";

import Link from "next/link";
import {
  UtensilsCrossed,
  Dumbbell,
  Laugh,
  Gamepad2,
  Baby,
  Trophy,
  Music,
  Laptop,
  Palette,
  Sparkles,
  Heart,
  GraduationCap,
  Globe,
  Star,
  Camera,
  Mic,
  Theater,
  Leaf,
  Briefcase,
  MapPin,
  Users,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

const ICON_REGISTRY: Record<string, LucideIcon> = {
  music: Music,
  "food-drink": UtensilsCrossed,
  tech: Laptop,
  art: Palette,
  sports: Trophy,
  business: Briefcase,
  health: Heart,
  education: GraduationCap,
  events: Calendar,
  venues: MapPin,
  community: Users,
  photography: Camera,
  podcasts: Mic,
  performing: Theater,
  gaming: Gamepad2,
  fitness: Dumbbell,
  wellness: Leaf,
  culture: Globe,
  default: Star,
};

const INTEREST_PRESETS = [
  { name: "Fine Dining", slug: "fine-dining", icon: UtensilsCrossed },
  { name: "Wellness", slug: "wellness", icon: Dumbbell },
  { name: "Comedy", slug: "comedy", icon: Laugh },
  { name: "Gaming", slug: "gaming", icon: Gamepad2 },
  { name: "Family", slug: "family", icon: Baby },
  { name: "Sports", slug: "sports", icon: Trophy },
];

function getCategoryIcon(category: Category): LucideIcon {
  if (category.icon && ICON_REGISTRY[category.icon]) {
    return ICON_REGISTRY[category.icon];
  }
  if (category.slug && ICON_REGISTRY[category.slug]) {
    return ICON_REGISTRY[category.slug];
  }
  return Sparkles;
}

interface InterestScrollerProps {
  categories: Category[];
}

export function InterestScroller({ categories }: InterestScrollerProps) {
  const interests = categories.length > 0 ? categories : INTEREST_PRESETS;

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-gutter px-gutter pb-4">
      <div className="flex gap-sm min-w-max">
        {interests.map((item, idx) => {
          let Icon: LucideIcon;
          if ("icon" in item && typeof item.icon === "function") {
            Icon = item.icon;
          } else if ("icon" in item && typeof item.icon === "string") {
            Icon = ICON_REGISTRY[item.icon] || getCategoryIcon(item as Category);
          } else if ("slug" in item) {
            Icon =
              INTEREST_PRESETS.find((p) => p.slug === item.slug)?.icon ||
              getCategoryIcon(item as Category);
          } else {
            Icon = Sparkles;
          }

          const key = "id" in item ? item.id : `${item.slug}-${idx}`;

          return (
            <Link
              key={key}
              href={`/categories/${item.slug}`}
              className={cn(
                "flex-shrink-0 px-6 py-3 rounded-xl",
                "bg-surface-container-high border border-outline-variant",
                "hover:border-primary transition-all duration-200",
                "flex items-center gap-sm",
                "cursor-pointer"
              )}
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="font-body-md text-body-md text-on-surface">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
