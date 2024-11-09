import { Feature } from 'geojson';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const CORS_PROXY = 'https://corsproxy.io/?';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface LocationCache {
  [query: string]: {
    suggestions: Suggestion[];
    timestamp: number;
  };
}

export interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number];
}

const locationCache: LocationCache = {};

export async function searchLocations(query: string): Promise<Suggestion[]> {
  if (!query || query.length < 2) return [];

  // Check cache
  const now = Date.now();
  const cached = locationCache[query];
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.suggestions;
  }

  try {
    if (!MAPBOX_TOKEN) {
      throw new Error('Mapbox token is not configured');
    }

    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood,address&limit=5`;

    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(mapboxUrl)}`;
    
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch location suggestions: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      throw new Error('Invalid response format from Mapbox API');
    }

    const suggestions = data.features.map((feature: Feature) => ({
      id: feature.id as string,
      place_name: feature.place_name as string,
      center: feature.center as [number, number]
    }));

    // Cache the results
    locationCache[query] = {
      suggestions,
      timestamp: now
    };

    return suggestions;
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    
    // Return cached results if available, even if expired
    if (cached) {
      console.log('Returning expired cached results due to API error');
      return cached.suggestions;
    }
    
    return [];
  }
}