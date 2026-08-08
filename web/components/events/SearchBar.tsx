"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search events...", className }: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-md top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search events"
        className="w-full pl-[44px] pr-md py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
      />
    </div>
  );
}

interface CategoryPillsProps {
  categories: { id: string; slug: string; name: string }[];
  activeSlug?: string;
  onSelect: (slug: string | undefined) => void;
  className?: string;
}

export function CategoryPills({ categories, activeSlug, onSelect, className }: CategoryPillsProps) {
  return (
    <div className={cn("flex items-center gap-sm overflow-x-auto scrollbar-hide py-1", className)}>
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        aria-pressed={activeSlug === undefined}
        className={cn(
          "px-md py-2 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors border",
          activeSlug === undefined
            ? "bg-primary text-on-primary border-primary"
            : "bg-surface-container border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary"
        )}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.slug)}
          aria-pressed={activeSlug === category.slug}
          className={cn(
            "px-md py-2 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors border",
            activeSlug === category.slug
              ? "bg-primary text-on-primary border-primary"
              : "bg-surface-container border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

interface DateFilterOption {
  value: string;
  label: string;
}

const dateFilters: DateFilterOption[] = [
  { value: "all", label: "All Events" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "This Weekend" },
  { value: "week", label: "Next 7 Days" },
  { value: "month", label: "This Month" },
];

interface DateFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateFilter({ value, onChange, className }: DateFilterProps) {
  return (
    <div className={cn("flex items-center gap-sm overflow-x-auto scrollbar-hide py-1", className)}>
      {dateFilters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          aria-pressed={value === filter.value}
          className={cn(
            "px-md py-2 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors border",
            value === filter.value
              ? "bg-secondary text-on-secondary border-secondary"
              : "bg-surface-container border-outline-variant text-on-surface-variant hover:text-secondary hover:border-secondary"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
