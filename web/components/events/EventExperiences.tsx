"use client";

import { useQuery } from "convex/react";
import { api } from "@eventnu/convex/_generated/api";
import { MessagesSquare } from "lucide-react";
import { ExperiencePostCard } from "@/components/experiences/ExperiencePostCard";
import { Skeleton } from "@/components/ui/skeleton";

export function EventExperiences({ eventId }: { eventId: string }) {
  const posts = useQuery(api.experiencePosts.listByEvent, { eventId: eventId as any, limit: 3 });
  const me = useQuery(api.profiles.getMe);

  return (
    <section className="space-y-md" aria-label="Experiences from this event">
      <h2 className="flex items-center gap-sm font-display text-headline-md text-on-surface">
        <MessagesSquare className="h-5 w-5 text-primary" aria-hidden="true" />
        Experiences
      </h2>

      {posts === undefined ? (
        <div className="space-y-md" aria-hidden="true">
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg text-center">
          <p className="font-body-md text-on-surface-variant">
            No experiences shared for this event yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-md">
          {posts.map((post) => (
            <li key={post.id}>
              <ExperiencePostCard post={post} canDelete={post.userId === me?._id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
