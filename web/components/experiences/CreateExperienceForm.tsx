"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@eventnu/convex/_generated/api";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const MAX_CONTENT_LENGTH = 2000;

export function CreateExperienceForm({
  initialEventId,
  eventTitle,
}: {
  initialEventId?: string;
  eventTitle?: string;
}) {
  const createPost = useMutation(api.experiencePosts.create);
  const getUploadUrl = useMutation(api.events.generateUploadUrl);
  const events = useQuery(api.events.getPublished);

  const [content, setContent] = useState("");
  const [eventId, setEventId] = useState(initialEventId ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = content.trim().length >= 3 && !submitting;

  const resetForm = () => {
    setContent("");
    setEventId("");
    setImageFile(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    let imageStorageId: string | undefined;
    if (imageFile) {
      try {
        const uploadUrl = await getUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status})`);
        const { storageId } = await res.json();
        if (!storageId) throw new Error("Upload failed");
        imageStorageId = storageId as string;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image");
        return;
      }
    }

    setSubmitting(true);
    try {
      await createPost({
        content,
        eventId: eventId ? (eventId as any) : undefined,
        imageStorageId,
      });
      resetForm();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share your experience");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-outline-variant bg-surface-container-low p-md"
      aria-label="Share your experience"
    >
      <label htmlFor="experience-content" className="font-label-lg text-on-surface">
        Share your experience
        {eventTitle ? (
          <span className="block font-body-sm text-on-surface-variant">
            about {eventTitle}
          </span>
        ) : null}
      </label>
      <textarea
        id="experience-content"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setSuccess(false);
        }}
        maxLength={MAX_CONTENT_LENGTH}
        rows={4}
        required
        placeholder="What was the vibe? How was the music, the crowd, the moment?"
        className="mt-sm w-full resize-y rounded-lg border border-outline bg-surface-container-lowest px-sm py-sm font-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <p className="mt-xs text-right font-body-sm text-on-surface-variant">
        {content.length}/{MAX_CONTENT_LENGTH}
      </p>

      <div className="mt-sm flex flex-wrap items-center gap-md">
        <label
          htmlFor="experience-event"
          className="font-label-md text-on-surface-variant"
        >
          Event (optional)
        </label>
        <select
          id="experience-event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full max-w-[18rem] rounded-lg border border-outline bg-surface-container-lowest px-sm py-2 font-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-auto"
        >
          <option value="">No specific event</option>
          {(events ?? []).map((event) => (
            <option key={event._id as string} value={event._id as string}>
              {event.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-md flex flex-wrap items-center gap-md">
        <label
          htmlFor="experience-image"
          className="inline-flex cursor-pointer items-center gap-xs rounded-lg border border-outline px-sm py-2 font-label-md text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {imageFile ? imageFile.name : "Add a photo"}
          <input
            id="experience-image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              setImageFile(e.target.files?.[0] ?? null);
              setSuccess(false);
            }}
          />
        </label>

        <span className="hidden flex-1 sm:block" aria-hidden="true" />

        {error && (
          <p role="alert" className="font-body-sm text-error">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="font-body-sm text-primary">
            Thanks for sharing!
          </p>
        )}

        <Button type="submit" disabled={!canSubmit} className={cn(submitting && "opacity-70")}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          {submitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
}
