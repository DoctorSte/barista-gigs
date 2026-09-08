"use client";

import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { LANGUAGE_CODES, languageLabel, languageLabelEnglish, normalizeLanguage } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDict } from "@/components/i18n-provider";

export function LanguagePicker({
  value,
  onChange,
  name = "languages",
  max = 8,
}: {
  value: string[];
  onChange: (languages: string[]) => void;
  name?: string;
  max?: number;
}) {
  const d = useDict();
  const selected = useMemo(() => value.map(normalizeLanguage), [value]);
  const available = useMemo(
    () =>
      LANGUAGE_CODES.filter((code) => !selected.includes(code)).sort((a, b) =>
        languageLabelEnglish(a).localeCompare(languageLabelEnglish(b)),
      ),
    [selected],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selected.map((code) => (
        <span
          key={code}
          className="bubble-in inline-flex items-center gap-1 rounded-full border border-accent bg-accent-soft py-1 pl-3.5 pr-1.5 text-[13px] font-medium text-accent"
        >
          {languageLabel(code)}
          <button
            type="button"
            aria-label={`Remove ${languageLabelEnglish(code)}`}
            onClick={() => onChange(selected.filter((c) => c !== code))}
            className="pressable rounded-full p-0.5 outline-none hover:bg-accent/15 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" />
          </button>
          <input type="hidden" name={name} value={code} />
        </span>
      ))}

      {selected.length < max ? (
        <label
          className={cn(
            "pressable relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed",
            "border-border-strong py-1.5 pl-3 pr-3.5 text-[13px] font-medium text-muted-foreground",
            "hover:text-foreground focus-within:ring-2 focus-within:ring-ring",
          )}
        >
          <Plus className="size-3.5" />
          {d.profile.addLanguage}
          <select
            value=""
            aria-label="Add a language"
            onChange={(e) => {
              if (e.target.value) onChange([...selected, e.target.value]);
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="" disabled>
              Add a language…
            </option>
            {available.map((code) => (
              <option key={code} value={code}>
                {languageLabel(code)} ({languageLabelEnglish(code)})
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
