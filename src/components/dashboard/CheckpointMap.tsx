import { useMemo } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CheckpointRow } from "@/services/player-service";
import type { GeolocationReading } from "@/hooks/use-geolocation";
import { formatDistance } from "@/lib/geo";

interface CheckpointMapProps {
  checkpoint: CheckpointRow | null;
  reading: GeolocationReading | null;
  suspicious: boolean;
  distanceToCheckpoint: number | null;
}

const playerIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:var(--primary);box-shadow:0 0 18px rgba(56,189,248,0.45);border:2px solid #fff"></div>`,
  className: "",
});

const checkpointIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:var(--accent);box-shadow:0 0 20px rgba(192,132,252,0.45);border:2px solid #fff"></div>`,
  className: "",
});

export const CheckpointMap = ({ checkpoint, reading, suspicious, distanceToCheckpoint }: CheckpointMapProps) => {
  const center = useMemo(() => {
    if (reading) {
      return [reading.latitude, reading.longitude] as [number, number];
    }
    if (checkpoint) {
      return [checkpoint.latitude, checkpoint.longitude] as [number, number];
    }
    return [0, 0] as [number, number];
  }, [checkpoint, reading]);

  const isInitialised = reading || checkpoint;

  return (
    <Card className="glass-card border-glass-border h-full">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-foreground text-lg">Live Map</CardTitle>
        {distanceToCheckpoint !== null && checkpoint && (
          <span className="text-sm text-muted-foreground">
            {distanceToCheckpoint <= (checkpoint.radius_meters ?? 50)
              ? "Checkpoint unlocked"
              : `Distance: ${formatDistance(distanceToCheckpoint)}`}
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isInitialised ? (
          <MapContainer
            center={center}
            zoom={17}
            scrollWheelZoom={false}
            className="h-[320px] rounded-b-lg overflow-hidden"
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {checkpoint && (
              <>
                <Circle
                  center={[checkpoint.latitude, checkpoint.longitude]}
                  radius={checkpoint.radius_meters ?? 50}
                  pathOptions={{ color: "var(--accent-foreground)", weight: 1, fillOpacity: 0.2 }}
                />
                <Marker position={[checkpoint.latitude, checkpoint.longitude]} icon={checkpointIcon}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{checkpoint.name}</p>
                      {checkpoint.description && (
                        <p className="text-xs text-muted-foreground">{checkpoint.description}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {reading && (
              <Marker position={[reading.latitude, reading.longitude]} icon={playerIcon}>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">Your team</p>
                    <p className="text-xs text-muted-foreground">Accuracy ±{Math.round(reading.accuracy)} m</p>
                    {suspicious && (
                      <p className="text-xs text-destructive">Potential spoof detected</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="h-[320px] flex items-center justify-center text-muted-foreground">
            Waiting for location...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
