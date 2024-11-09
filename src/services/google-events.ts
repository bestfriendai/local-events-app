import { Event } from '../types';

const API_KEY = '18596fbf4a660faf2c48ceca0c19c385eba49ba054fc4db6ab1bb541d8f73c5d';
const BASE_URL = 'https://serpapi.com/search.json';
const CORS_PROXY = 'https://corsproxy.io/?';

function formatEventData(event: any): Event | null {
  try {
    // Extract coordinates from the event_location_map link if available
    let latitude = 0;
    let longitude = 0;
    
    if (event.event_location_map?.serpapi_link) {
      const match = event.event_location_map.serpapi_link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (match) {
        latitude = parseFloat(match[1]);
        longitude = parseFloat(match[2]);
      }
    }

    // Skip events without location data
    if (!latitude || !longitude) {
      return null;
    }

    // Parse date information
    const dateInfo = event.date?.when || '';
    const [datePart, timePart] = dateInfo.split(', ');
    
    // Determine category based on event description or title
    let category = 'special';
    const lowerTitle = event.title.toLowerCase();
    const lowerDesc = (event.description || '').toLowerCase();
    
    if (lowerTitle.includes('music') || lowerTitle.includes('concert')) {
      category = 'live-music';
    } else if (lowerTitle.includes('comedy') || lowerDesc.includes('comedy')) {
      category = 'comedy';
    } else if (lowerTitle.includes('sports') || lowerDesc.includes('sports')) {
      category = 'sports-games';
    } else if (lowerTitle.includes('art') || lowerDesc.includes('art')) {
      category = 'performing-arts';
    } else if (lowerTitle.includes('food') || lowerDesc.includes('food')) {
      category = 'food-drink';
    } else if (lowerTitle.includes('culture') || lowerDesc.includes('culture')) {
      category = 'cultural';
    } else if (lowerTitle.includes('education') || lowerDesc.includes('education')) {
      category = 'educational';
    }

    return {
      id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: event.title,
      description: event.description || 'No description available',
      date: datePart,
      time: timePart || 'Time TBA',
      location: {
        latitude,
        longitude,
        address: Array.isArray(event.address) ? event.address.join(', ') : event.address || 'Location TBA'
      },
      category,
      subcategory: 'Various',
      status: 'active',
      imageUrl: event.thumbnail,
      ticketUrl: event.ticket_info?.[0]?.link,
      venue: {
        name: event.venue?.name || event.address?.[0] || 'Venue TBA',
        city: event.address?.[1]?.split(', ')?.[0] || '',
        state: event.address?.[1]?.split(', ')?.[1] || '',
        rating: event.venue?.rating,
        reviews: event.venue?.reviews
      }
    };
  } catch (error) {
    console.error('Error formatting Google event:', error);
    return null;
  }
}

export async function searchGoogleEvents(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  keyword?: string;
}): Promise<Event[]> {
  if (!params.latitude || !params.longitude) {
    return [];
  }

  const city = params.keyword || 'events';
  const searchParams = new URLSearchParams({
    engine: 'google_events',
    q: `Events in ${city}`,
    hl: 'en',
    gl: 'us',
    api_key: API_KEY
  });

  try {
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${BASE_URL}?${searchParams.toString()}`)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.events_results) {
      return [];
    }

    const events = data.events_results
      .map(formatEventData)
      .filter((event): event is Event => event !== null);

    return events;
  } catch (error) {
    console.error('Error fetching Google events:', error);
    return [];
  }
}