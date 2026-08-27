"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateCv } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MAX_SIZE_MB = 5;
const ACCEPTED = [".pdf", ".doc", ".docx"];

export function CvUpload({
  userId,
  cvPath,
  cvFilename,
}: {
  userId: string;
  cvPath: string | null;
  cvFilename: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File) {
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED.includes(extension)) {
      toast.error("Upload a PDF or Word document");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`CVs must be under ${MAX_SIZE_MB}MB`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${userId}/${crypto.randomUUID()}${extension}`;
      const { error } = await supabase.storage.from("cvs").upload(path, file, {
        contentType: file.type || "application/octet-stream",
      });
      if (error) throw error;

      const result = await updateCv(path, file.name);
      if (!result.ok) throw new Error(result.error);
      // Best-effort: remove the previous file so the bucket doesn't collect stale CVs.
      if (cvPath) void supabase.storage.from("cvs").remove([cvPath]);
      toast.success("CV uploaded");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await updateCv(null, null);
      if (result.ok) {
        if (cvPath) void createClient().storage.from("cvs").remove([cvPath]);
        toast.success("CV removed");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">CV</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {cvPath
              ? "Cafés can view it on your profile and applications."
              : "Optional — useful when applying for full- and part-time jobs."}
          </p>
          {cvPath ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-3 py-1.5 text-sm">
              <FileText className="size-4 text-accent" />
              {cvFilename ?? "CV"}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" /> {cvPath ? "Replace" : "Upload CV"}
          </Button>
          {cvPath ? (
            <Button variant="outline" size="sm" loading={pending} onClick={handleRemove}>
              <Trash2 className="size-4" /> Remove
            </Button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </Card>
  );
}
