import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { supabase } from "@/integrations/supabase/client";
import { G } from "@/lib/nexgo-theme";

type Coord = { lat: number; lng: number };

interface Props {
  riderId?: string | null;
  pickup?: Coord | null;
  dropoff?: Coord | null;
  // Fallback center if we have no rider location yet
  fallbackCenter?: Coord;
  height?: number | string;
  label?: string;
}

const DEFAULT_CENTER: Coord = { lat: 7.7416, lng: 4.4595 }; // Ede, Nigeria

// Dark-mode map styles to match NexGo aesthetic
const DARK_STYLES: any = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9a8b5a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a1a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#3a3a3a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#c9a84c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1a2a" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#222222" }] },
];

export function LiveMap({ riderId, pickup, dropoff, fallbackCenter, height = 260, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const [riderPos, setRiderPos] = useState<Coord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Init map
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(maps => {
      if (cancelled || !ref.current) return;
      const center = pickup || fallbackCenter || DEFAULT_CENTER;
      mapRef.current = new maps.Map(ref.current, {
        center,
        zoom: 14,
        styles: DARK_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
      });
      if (pickup) new maps.Marker({ position: pickup, map: mapRef.current, label: { text: "A", color: "#000", fontWeight: "700" }, icon: { path: maps.SymbolPath.CIRCLE, scale: 14, fillColor: "#C9A84C", fillOpacity: 1, strokeColor: "#000", strokeWeight: 2 } });
      if (dropoff) new maps.Marker({ position: dropoff, map: mapRef.current, label: { text: "B", color: "#fff", fontWeight: "700" }, icon: { path: maps.SymbolPath.CIRCLE, scale: 14, fillColor: "#22c55e", fillOpacity: 1, strokeColor: "#000", strokeWeight: 2 } });
      if (pickup && dropoff) {
        new maps.Polyline({ path: [pickup, dropoff], geodesic: true, strokeColor: "#C9A84C", strokeOpacity: 0.6, strokeWeight: 3, map: mapRef.current });
        const b = new maps.LatLngBounds(); b.extend(pickup); b.extend(dropoff);
        mapRef.current.fitBounds(b, 60);
      }
      setLoaded(true);
    }).catch(e => setError(e.message || "Failed to load map"));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch & subscribe to rider location
  useEffect(() => {
    if (!riderId) return;
    let cancelled = false;
    supabase.from("rider_locations").select("latitude,longitude").eq("rider_id", riderId).maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setRiderPos({ lat: data.latitude, lng: data.longitude }); });
    const ch = supabase.channel(`rider-loc-${riderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rider_locations", filter: `rider_id=eq.${riderId}` }, (payload: any) => {
        const n = payload.new;
        if (n) setRiderPos({ lat: n.latitude, lng: n.longitude });
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [riderId]);

  // Update rider marker
  useEffect(() => {
    if (!loaded || !riderPos || !mapRef.current || !window.google) return;
    const maps = window.google.maps;
    if (!riderMarkerRef.current) {
      riderMarkerRef.current = new maps.Marker({
        position: riderPos,
        map: mapRef.current,
        icon: { path: maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6, fillColor: "#C9A84C", fillOpacity: 1, strokeColor: "#000", strokeWeight: 2 },
        title: "Rider",
      });
      mapRef.current.panTo(riderPos);
    } else {
      riderMarkerRef.current.setPosition(riderPos);
    }
  }, [riderPos, loaded]);

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${G.goldBorder}`, background: G.b3 }}>
      <div ref={ref} style={{ width: "100%", height }} />
      {error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: G.whiteDim, fontSize: 13, padding: 20, textAlign: "center" }}>
          Map unavailable: {error}
        </div>
      )}
      {label && (
        <div style={{ position: "absolute", left: 10, top: 10, background: "rgba(0,0,0,0.7)", color: G.gold, padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, backdropFilter: "blur(8px)" }}>
          {label}
        </div>
      )}
      {!riderId && !error && (
        <div style={{ position: "absolute", right: 10, bottom: 10, background: "rgba(0,0,0,0.7)", color: G.whiteDim, padding: "6px 10px", borderRadius: 8, fontSize: 11 }}>
          Waiting for a rider to be assigned…
        </div>
      )}
    </div>
  );
}
