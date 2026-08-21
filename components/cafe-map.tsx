"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

/** Small single-marker map for a café's location. */
export function CafeMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        scrollWheelZoom: false,
        dragging: false,
        zoomControl: false,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      L.circleMarker([lat, lng], {
        radius: 9,
        color: "#7c5231",
        weight: 2,
        fillColor: "#a9713f",
        fillOpacity: 0.85,
      })
        .bindTooltip(name)
        .addTo(map);
      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng, name]);

  return <div ref={containerRef} className="h-56 w-full" />;
}
