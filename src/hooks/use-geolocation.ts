import { useCallback, useEffect, useRef, useState } from "react";
import { haversineDistance, type Coordinates } from "@/lib/geo";

type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

export interface GeolocationReading extends Coordinates {
  accuracy: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

interface GeolocationState {
  reading: GeolocationReading | null;
  permission: PermissionState;
  error?: string;
  suspicious: boolean;
  lastValidReading: GeolocationReading | null;
}

const ACCURACY_THRESHOLD = 60; // meters
const SPEED_THRESHOLD = 12; // m/s (~43 km/h) -> likely vehicle or spoofing
const JUMP_DISTANCE_THRESHOLD = 150; // meters between readings within a short timeframe
const JUMP_TIME_WINDOW = 20_000; // 20 seconds

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    reading: null,
    permission: "prompt",
    error: undefined,
    suspicious: false,
    lastValidReading: null,
  });
  const watchIdRef = useRef<number | null>(null);
  const previousReading = useRef<GeolocationReading | null>(null);

  const evaluateSuspicion = useCallback(
    (current: GeolocationReading, previous: GeolocationReading | null) => {
      if (!previous) {
        return current.accuracy > ACCURACY_THRESHOLD;
      }

      const distance = haversineDistance(current, previous);
      const timeDiff = Math.max((current.timestamp - previous.timestamp) / 1000, 1);
      const speed = distance / timeDiff;

      const poorAccuracy = current.accuracy > ACCURACY_THRESHOLD;
      const highSpeed = speed > SPEED_THRESHOLD;
      const suddenJump =
        distance > JUMP_DISTANCE_THRESHOLD && current.timestamp - previous.timestamp < JUMP_TIME_WINDOW;

      return poorAccuracy || highSpeed || suddenJump;
    },
    []
  );

  const handleSuccess = useCallback(
    (position: GeolocationPosition) => {
      const reading: GeolocationReading = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };

      const suspicious = evaluateSuspicion(reading, previousReading.current);
      const lastValidReading = suspicious ? state.lastValidReading : reading;

      previousReading.current = reading;

      setState((prev) => ({
        ...prev,
        reading,
        suspicious,
        error: undefined,
        lastValidReading,
      }));
    },
    [evaluateSuspicion, state.lastValidReading]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      error: err.message,
      reading: null,
    }));
  }, []);

  const clearWatcher = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, permission: "unsupported", error: "Geolocation not supported" }));
      return;
    }

    const watcher = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 15000,
    });

    watchIdRef.current = watcher;
  }, [handleError, handleSuccess]);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, permission: "unsupported", error: "Geolocation not supported" }));
      return;
    }

    if (navigator.permissions) {
      (navigator.permissions as any)
        .query({ name: "geolocation" })
        .then((result) => {
          if (cancelled) return;

          setState((prev) => ({ ...prev, permission: result.state as PermissionState }));

          if (result.state === "granted") {
            requestPermission();
          }

          result.onchange = () => {
            if (cancelled) return;
            setState((prev) => ({ ...prev, permission: result.state as PermissionState }));
            if (result.state === "granted" && !watchIdRef.current) {
              requestPermission();
            } else if (result.state !== "granted") {
              clearWatcher();
            }
          };
        })
        .catch(() => {
          if (cancelled) return;
          // Fallback: attempt to request immediately
          requestPermission();
        });
    } else {
      requestPermission();
    }

    return () => {
      cancelled = true;
      clearWatcher();
    };
  }, [clearWatcher, requestPermission]);

  const distanceTo = useCallback(
    (target: Coordinates | null) => {
      if (!target || !state.reading) return null;
      return haversineDistance(state.reading, target);
    },
    [state.reading]
  );

  return {
    reading: state.reading,
    permission: state.permission,
    error: state.error,
    suspicious: state.suspicious,
    lastValidReading: state.lastValidReading,
    distanceTo,
    requestPermission,
  };
}
