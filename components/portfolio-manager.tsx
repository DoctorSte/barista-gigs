"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { addPortfolioPhoto, deletePortfolioPhoto } from "@/app/actions/portfolio";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useDict } from "@/components/i18n-provider";

const MAX_PHOTOS = 8;
const MAX_SIZE_MB = 8;

export function PortfolioManager({
  userId,
  photos,
}: {
  userId: string;
  photos: { id: string; caption: string | null; url: string }[];
}) {
  const d = useDict();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(d.uploads.onlyImages);
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(d.uploads.imageTooBig(MAX_SIZE_MB));
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("portfolio").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
      });
      if (error) throw error;

      const result = await addPortfolioPhoto(path, "");
      if (!result.ok) throw new Error(result.error);
      toast.success(d.uploads.photoAdded);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : d.uploads.uploadFailed);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDelete(photoId: string) {
    startTransition(async () => {
      const result = await deletePortfolioPhoto(photoId);
      if (result.ok) toast.success(d.uploads.photoRemoved);
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">{d.profile.portfolio}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Latte art, bar setups, anything that shows your craft. Up to {MAX_PHOTOS} photos.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          loading={uploading}
          disabled={photos.length >= MAX_PHOTOS}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" /> {d.profile.addPhoto}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {photos.length > 0 ? (
        <ul className="stagger mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className="group relative aspect-square overflow-hidden rounded-md border border-border">
              <Image
                src={photo.url}
                alt={photo.caption ?? "Portfolio photo"}
                fill
                sizes="(max-width: 640px) 50vw, 200px"
                className="object-cover"
              />
              <button
                type="button"
                aria-label={d.uploads.deletePhoto}
                disabled={pending}
                onClick={() => handleDelete(photo.id)}
                className="pressable absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100"
              >
                {pending ? <Spinner className="size-3.5" /> : <Trash2 className="size-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-md border border-dashed border-border-strong/70 px-4 py-8 text-center text-sm text-muted-foreground">
          No photos yet — shops love seeing your pours.
        </p>
      )}
    </Card>
  );
}
