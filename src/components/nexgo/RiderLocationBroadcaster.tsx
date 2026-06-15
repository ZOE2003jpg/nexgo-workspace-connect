import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Mounted inside RiderApp when the rider is online.
// Pushes the rider's GPS location to rider_locations every few seconds while active.
export function RiderLocationBroadcaster({ active }: { active: boolean }) {
  const { user } = useAuth();
  useEffect(() => {
    if (!active || !user || typeof navigator === "undefined" || !navigator.geolocation) return;
    let cancelled = false;
    const push = (pos: GeolocationPosition) => {
      if (cancelled) return;
      supabase.from("rider_locations").upsert({
        rider_id: user.id,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        heading: pos.coords.heading ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "rider_id" }).then(() => {});
    };
    const watchId = navigator.geolocation.watchPosition(push, undefined, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    return () => { cancelled = true; navigator.geolocation.clearWatch(watchId); };
  }, [active, user]);
  return null;
}
