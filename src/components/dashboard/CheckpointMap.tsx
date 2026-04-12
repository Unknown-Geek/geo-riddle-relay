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
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#5E6AD2;border:2px solid #fff;box-shadow:0 0 8px rgba(94,106,210,0.4)"></div>`,
  className: "",
});

const checkpointIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#F97316;border:2px solid #fff;box-shadow:0 0 8px rgba(249,115,22,0.4)"></div>`,
  className: "",
});

export const CheckpointMap = ({ checkpoint, reading, suspicious, distanceToCheckpoint }: CheckpointMapProps) => {
  const center = useMemo(() => {
    if (reading) return [reading.latitude, reading.longitude] as [number, number];
    if (checkpoint) return [checkpoint.latitude, checkpoint.longitude] as [number, number];
    return [0, 0] as [number, number];
  }, [checkpoint, reading]);

  const isInitialised = reading || checkpoint;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm">Map</CardTitle>
        {distanceToCheckpoint !== null && checkpoint && (
          <span className="text-xs text-muted-foreground">
            {distanceToCheckpoint <= (checkpoint.radius_meters ?? 50)
              ? "Checkpoint unlocked"
              : `${formatDistance(distanceToCheckpoint)} away`}
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isInitialised ? (
          <MapContainer
            center={center}
            zoom={17}
            scrollWheelZoom={false}
            className="h-[280px] sm:h-[320px] rounded-b-lg overflow-hidden"
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {checkpoint && (
              <>
                <Circle
                  center={[checkpoint.latitude, checkpoint.longitude]}
                  radius={checkpoint.radius_meters ?? 50}
                  pathOptions={{ color: "#F97316", weight: 1, fillOpacity: 0.1 }}
                />
                <Marker position={[checkpoint.latitude, checkpoint.longitude]} icon={checkpointIcon}>
                  <Popup>
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm">{checkpoint.name}</p>
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
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">You</p>
                    <p className="text-xs text-muted-foreground">Accuracy: ~{Math.round(reading.accuracy)}m</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="h-[280px] sm:h-[320px] flex items-center justify-center text-sm text-muted-foreground">
            Waiting for location...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
