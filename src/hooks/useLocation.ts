import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface GpsCoord {
  lat: number;
  lng: number;
}

export function useLocation() {
  const [coord,      setCoord]      = useState<GpsCoord | null>(null);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermission(false);
        setError('נדרשת הרשאת מיקום');
        return;
      }
      setPermission(true);
      refresh();
    })();
  }, []);

  const refresh = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCoord({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      setError('לא ניתן לקבל מיקום');
    }
  };

  return { coord, permission, error, refresh };
}
