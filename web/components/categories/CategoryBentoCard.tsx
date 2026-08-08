import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/category-icons";

interface CategoryBentoCardProps {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  eventCount?: number;
  imageUrl?: string;
  span: string;
}

export function CategoryBentoCard({
  name,
  slug,
  description,
  icon,
  eventCount = 0,
  imageUrl,
  span,
}: CategoryBentoCardProps) {
  const Icon = getCategoryIcon(icon, slug);

  return (
    <Link
      href={`/categories/${slug}`}
      className={cn(
        "relative overflow-hidden rounded-xl group bento-hover cursor-pointer border border-outline-variant",
        span
      )}
    >
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url('${imageUrl}')` }}
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/20 to-surface-container-highest"
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-0 category-gradient" />

      <div className="relative z-10 absolute inset-0 flex flex-col justify-end p-lg">
        <div className="flex items-center justify-between gap-sm">
          <span className="inline-flex items-center gap-xs px-sm py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
          </span>
          {eventCount > 0 && (
            <span className="px-sm py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 font-mono text-label-sm text-on-surface">
              {eventCount} event{eventCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <h3 className="font-display text-headline-md md:text-display-lg-mobile font-extrabold text-white mb-xs group-hover:text-primary transition-colors">
          {name}
        </h3>
        {description && (
          <p className="text-on-surface-variant text-body-md line-clamp-2 max-w-[28rem]">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
