"use client";

import { useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapGig = {
  id: string;
  title: string;
  pay: string;
  shopName: string;
  lat: number;
  lng: number;
};

export function GigsMap({ gigs }: { gigs: MapGig[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, { scrollWheelZoom: false });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);
        markersRef.current = L.layerGroup().addTo(mapRef.current);
      }

      const markers = markersRef.current!;
      markers.clearLayers();

      for (const gig of gigs) {
        L.circleMarker([gig.lat, gig.lng], {
          radius: 9,
          color: "#7c5231",
          weight: 2,
          fillColor: "#a9713f",
          fillOpacity: 0.85,
        })
          .bindPopup(
            `<a href="/gigs/${gig.id}" style="font-weight:600">${gig.title}</a><br>${gig.shopName} · ${gig.pay}`,
          )
          .addTo(markers);
      }

      if (gigs.length > 0) {
        mapRef.current.fitBounds(
          L.latLngBounds(gigs.map((gig) => [gig.lat, gig.lng])),
          { padding: [40, 40], maxZoom: 15 },
        );
      } else {
        mapRef.current.setView([48.8566, 2.3522], 12);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gigs]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-105 w-full rounded-lg border border-border" />;
}
