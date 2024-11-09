import { Event } from '../types';

const RAPIDAPI_KEY = '33351bd536msha426eb3e02f04cdp1c6c75jsnb775e95605b8';
const RAPIDAPI_HOST = 'real-time-events-search.p.rapidapi.com';
const EVENTS_LIMIT = 100;
const REQUEST_TIMEOUT = 30000;

async function fetchEvents(query: string): Promise<Event[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(
      `https://${RAPIDAPI_HOST}/search-events?query=${encodeURIComponent(query)}&limit=${EVENTS_LIMIT}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.log('No events found in RapidAPI response');
      return [];
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    return data.data
      .map((event: any) => {
        try {
          if (!event.venue?.latitude || !event.venue?.longitude) {
            return null;
          }

          const eventDate = new Date(event.start_date);
          // Filter out past events
          if (eventDate < now) {
            return null;
          }

          const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          const formattedTime = eventDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });

          return {
            id: `rapid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: event.name || event.title,
            description: event.description || 'No description available',
            date: formattedDate,
            time: formattedTime,
            location: {
              latitude: Number(event.venue.latitude),
              longitude: Number(event.venue.longitude),
              address: [
                event.venue.name,
                event.venue.address,
                event.venue.city,
                event.venue.state
              ].filter(Boolean).join(', ')
            },
            category: mapEventCategory(event),
            subcategory: event.category || 'Various',
            status: 'active',
            imageUrl: event.image_url,
            ticketUrl: event.ticket_url,
            priceRange: formatPriceRange(event.price_range),
            venue: {
              name: event.venue.name,
              city: event.venue.city,
              state: event.venue.state,
              capacity: event.venue.capacity,
              generalInfo: event.venue.description
            },
            attractions: event.performers?.map((performer: any) => ({
              name: performer.name,
              type: performer.type,
              image: performer.image_url,
              url: performer.url
            })) || []
          };
        } catch (error) {
          console.error('Error formatting RapidAPI event:', error);
          return null;
        }
      })
      .filter((event): event is Event => 
        event !== null && 
        isValidEvent(event)
      );
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('RapidAPI request timed out');
    } else {
      console.error('Error fetching from RapidAPI:', error);
    }
    return [];
  }
}

function mapEventCategory(event: any): string {
  const name = (event.name || '').toLowerCase();
  const category = (event.category || '').toLowerCase();
  const description = (event.description || '').toLowerCase();
  
  if (name.includes('concert') || category.includes('music') || description.includes('concert')) {
    return 'live-music';
  }
  if (name.includes('comedy') || category.includes('comedy') || description.includes('comedy')) {
    return 'comedy';
  }
  if (name.includes('sport') || category.includes('sport') || description.includes('sports')) {
    return 'sports-games';
  }
  if (name.includes('art') || category.includes('theatre') || description.includes('performance')) {
    return 'performing-arts';
  }
  if (name.includes('food') || category.includes('dining') || description.includes('food')) {
    return 'food-drink';
  }
  if (name.includes('culture') || description.includes('cultural')) {
    return 'cultural';
  }
  if (name.includes('education') || description.includes('workshop')) {
    return 'educational';
  }
  if (name.includes('outdoor') || description.includes('outdoor')) {
    return 'outdoor';
  }
  return 'special';
}

function formatPriceRange(price: any): string {
  if (!price) return 'Price TBA';
  
  if (typeof price === 'string') {
    return price;
  }
  
  if (typeof price === 'number') {
    return `$${price}`;
  }
  
  if (price.min && price.max) {
    return `$${price.min}-$${price.max}`;
  }
  
  return 'Price TBA';
}

function isValidEvent(event: Event): boolean {
  const requiredFields = [
    'id',
    'title',
    'date',
    'time',
    'location',
    'category'
  ];

  return requiredFields.every(field => {
    if (field === 'location') {
      return (
        event.location &&
        typeof event.location.latitude === 'number' &&
        typeof event.location.longitude === 'number' &&
        typeof event.location.address === 'string'
      );
    }
    return event[field as keyof Event] !== undefined &&
           event[field as keyof Event] !== null &&
           event[field as keyof Event] !== '';
  });
}

export async function searchRapidAPIEvents(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  keyword?: string;
}): Promise<Event[]> {
  if (!params.latitude || !params.longitude) {
    console.log('No location provided for RapidAPI search');
    return [];
  }

  try {
    // Get city name from coordinates using Mapbox
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${params.longitude},${params.latitude}.json?types=place&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get location name');
    }
    
    const data = await response.json();
    const cityName = data.features?.[0]?.text || 'Events';
    
    // Create a search query that includes location and date range
    const today = new Date();
    const searchQuery = `${params.keyword || 'Events'} in ${cityName} from ${today.toLocaleDateString()}`;
    
    return fetchEvents(searchQuery);
  } catch (error) {
    console.error('Error in RapidAPI event search:', error);
    return [];
  }
}