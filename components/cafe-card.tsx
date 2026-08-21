import { Globe, MapPin, Phone } from "lucide-react";
import { machineTypeLabel } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CafeMap } from "@/components/cafe-map";
import type { CoffeeShop } from "@/lib/database.types";

/** The café card baristas see on gig pages — also used for the café's own preview. */
export function CafeCard({
  shop,
  avatarUrl,
  className,
}: {
  shop: CoffeeShop;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex items-center gap-3">
        <Avatar name={shop.name} src={avatarUrl} className="size-12" />
        <div>
          <h2 className="font-display text-lg font-semibold">{shop.name}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" /> {shop.address}
          </p>
        </div>
      </div>
      {shop.description ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{shop.description}</p>
      ) : null}
      {shop.machines.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {shop.machines.map((machine, index) => (
            <Badge key={index}>
              {machine.name}
              <span className="ml-1 opacity-60">{machineTypeLabel(machine.type)}</span>
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
        {shop.website ? (
          <a
            href={shop.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors duration-150 hover:text-foreground"
          >
            <Globe className="size-4" /> Website
          </a>
        ) : null}
        {shop.phone ? (
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-4" /> {shop.phone}
          </span>
        ) : null}
        {shop.lat != null && shop.lng != null ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors duration-150 hover:text-foreground"
          >
            <MapPin className="size-4" /> Open in Google Maps
          </a>
        ) : null}
      </div>
      {shop.lat != null && shop.lng != null ? (
        <div className="mt-4 overflow-hidden rounded-md border border-border">
          <CafeMap lat={shop.lat} lng={shop.lng} name={shop.name} />
        </div>
      ) : null}
    </Card>
  );
}
