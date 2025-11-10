
import { useState, useCallback } from 'react';

interface GeolocationState {
  loading: boolean;
  location: { lat: number; lng: number } | null;
  error: string | null;
}

const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    location: null,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        loading: false,
        location: null,
        error: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setState({ loading: true, location: null, error: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
        });
      },
      (error) => {
        setState({
          loading: false,
          location: null,
          error: `Error getting location: ${error.message}`,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);
  
  return { ...state, requestLocation };
};

export default useGeolocation;
