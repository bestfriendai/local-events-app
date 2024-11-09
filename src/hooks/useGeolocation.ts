import { useState, useEffect } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  error?: string;
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocation({ 
        latitude: 0, 
        longitude: 0, 
        error: 'Geolocation is not supported' 
      });
      return;
    }

    setLoading(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocation({ 
          latitude: 0, 
          longitude: 0, 
          error: error.message 
        });
        setLoading(false);
      },
      options
    );
  };

  return { location, loading, getLocation };
}