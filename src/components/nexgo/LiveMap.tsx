import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { G } from "@/lib/nexgo-theme";

type Coord = { lat: number; lng: number };

interface Props {
  riderId?: string | null;
  pickup?: Coord | null;
  dropoff?: Coord | null;
  fallbackCenter?: Coord;
  height?: number | string;
  label?: string;
}

const DEFAULT_CENTER: Coord = { lat: 7.7416, lng: 4.4595 };

const dotIcon = (color: string, text: string, textColor = "#000") =>
  L.divIcon({
    className: "nexgo-marker",
    html: `<div style="background:${color};color:${textColor};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid #000;box-shadow:0 2px 6px rgba(0,0,0,0.5)">${text}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const riderIcon = L.divIcon({
  className: "nexgo-marker",
  html: `<div style="background:#C9A84C;width:22px;height:22px;border-radius:50%;border:2px solid #000;box-shadow:0 0 0 4px rgba(201,168,76,0.25)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function FitBounds({ points }: { points: Coord[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const b = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(b, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

function PanTo({ pos }: { pos: Coord | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.panTo([pos.lat, pos.lng]);
  }, [map, pos]);
  return null;
}

export function LiveMap({ riderId, pickup, dropoff, fallbackCenter, height = 260, label }: Props) {
  const [riderPos, setRiderPos] = useState<Coord | null>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!riderId) return;
    let cancelled = false;
    supabase
      .from("rider_locations")
      .select("latitude,longitude")
      .eq("rider_id", riderId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setRiderPos({ lat: data.latitude, lng: data.longitude });
      });
    const ch = supabase
      .channel(`rider-loc-${riderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rider_locations", filter: `rider_id=eq.${riderId}` },
        (payload: any) => {
          const n = payload.new;
          if (!n) return;
          // Throttle to avoid excessive re-renders
          const now = Date.now();
          if (now - lastUpdateRef.current < 500) return;
          lastUpdateRef.current = now;
          setRiderPos({ lat: n.latitude, lng: n.longitude });
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [riderId]);

  const center = pickup || fallbackCenter || DEFAULT_CENTER;
  const polyPoints = useMemo(() => {
    const pts: Coord[] = [];
    if (pickup) pts.push(pickup);
    if (riderPos) pts.push(riderPos);
    if (dropoff) pts.push(dropoff);
    return pts;
  }, [pickup, dropoff, riderPos]);

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${G.goldBorder}`, background: G.b3 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        style={{ width: "100%", height }}
        scrollWheelZoom
        zoomControl
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={dotIcon("#C9A84C", "A")}>
            <Popup>Pickup</Popup>
          </Marker>
        )}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dotIcon("#22c55e", "B", "#fff")}>
            <Popup>Dropoff</Popup>
          </Marker>
        )}
        {riderPos && (
          <Marker position={[riderPos.lat, riderPos.lng]} icon={riderIcon}>
            <Popup>Rider</Popup>
          </Marker>
        )}
        {pickup && dropoff && (
          <Polyline positions={polyPoints.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#C9A84C", weight: 3, opacity: 0.7 }} />
        )}
        {pickup && dropoff && <FitBounds points={[pickup, dropoff, ...(riderPos ? [riderPos] : [])]} />}
        <PanTo pos={riderPos} />
      </MapContainer>
      {label && (
        <div style={{ position: "absolute", left: 10, top: 10, background: "rgba(0,0,0,0.7)", color: G.gold, padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, backdropFilter: "blur(8px)", zIndex: 500 }}>
          {label}
        </div>
      )}
      {!riderId && (
        <div style={{ position: "absolute", right: 10, bottom: 10, background: "rgba(0,0,0,0.7)", color: G.whiteDim, padding: "6px 10px", borderRadius: 8, fontSize: 11, zIndex: 500 }}>
          Waiting for a rider to be assigned…
        </div>
      )}
    </div>
  );
}
