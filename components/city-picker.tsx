"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import type { City } from "@/lib/database.types";
import type { CitySearchResult } from "@/lib/city";
import { Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useDict } from "@/components/i18n-provider";

export type PickedCity = {
  slug: string;
  name: string;
  countryCode: string;
  timezone: string;
  lat: number | null;
  lng: number | null;
};

function fromCity(city: City): PickedCity {
  return {
    slug: city.slug,
    name: city.name,
    countryCode: city.country_code,
    timezone: city.timezone,
    lat: city.lat,
    lng: city.lng,
  };
}

function fromResult(result: CitySearchResult): PickedCity {
  return {
    slug: result.slug,
    name: result.name,
    countryCode: result.country_code,
    timezone: result.timezone,
    lat: result.lat,
    lng: result.lng,
  };
}

export function CityPicker({
  featured,
  value,
  onChange,
  name = "city",
}: {
  featured: City[];
  value: PickedCity | null;
  onChange: (city: PickedCity | null) => void;
  name?: string;
}) {
  const d = useDict();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length < 2) return;
    clearTimeout(debounceRef.current);
    const controller = new AbortController();
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/cities/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { results: CitySearchResult[] };
        setResults(data.results);
      } catch {
        /* aborted or offline */
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(debounceRef.current);
    };
  }, [trimmedQuery]);

  return (
    <div className="flex flex-col gap-2.5">
      {value ? <input type="hidden" name={name} value={JSON.stringify(value)} /> : null}

      <div className="flex flex-wrap gap-2">
        {featured.map((city) => {
          const active = value?.slug === city.slug;
          return (
            <button
              key={city.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onChange(active ? null : fromCity(city));
                setQuery("");
              }}
              className={cn(
                "pressable rounded-full border px-3.5 py-1.5 text-[13px] font-medium outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                active
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              {city.name}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={d.shopForm.citySearch}
          className="pl-9"
          aria-label="Search cities"
        />
        {searching ? (
          <Spinner className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        ) : null}
      </div>

      {query.trim().length >= 2 && results.length > 0 ? (
        <ul className="menu-panel overflow-hidden rounded-md border border-border bg-surface-raised" style={{ "--origin": "top left" } as React.CSSProperties}>
          {results.map((result) => (
            <li key={result.slug}>
              <button
                type="button"
                onClick={() => {
                  onChange(fromResult(result));
                  setQuery("");
                  setResults([]);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors duration-100 hover:bg-muted"
              >
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{result.name}</span>
                <span className="text-muted-foreground">{result.country_code}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {value && !featured.some((c) => c.slug === value.slug) ? (
        <p className="bubble-in inline-flex items-center gap-1.5 text-sm text-foreground">
          <MapPin className="size-4 text-accent" />
          {value.name}, {value.countryCode}
        </p>
      ) : null}
    </div>
  );
}
