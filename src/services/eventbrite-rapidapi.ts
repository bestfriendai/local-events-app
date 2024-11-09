import { Event } from '../types';

const RAPIDAPI_KEY = '33351bd536msha426eb3e02f04cdp1c6c75jsnb775e95605b8';
const RAPIDAPI_HOST = 'eventbrite-api3.p.rapidapi.com';
const REQUEST_TIMEOUT = 30000;

export async function searchEventbriteRapidAPI(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  keyword?: string;
}): Promise<Event[]> {
  console.log('Starting Eventbrite RapidAPI search with params:', params);

  if (!params.latitude || !params.longitude) {
    console.log('No location provided for Eventbrite search');
    return [];
  }

  try {
    // Get city name from coordinates
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${params.longitude},${params.latitude}.json?types=place&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
    );
    
    const data = await response.json();
    const cityName = data.features?.[0]?.text || '';
    
    if (!cityName) {
      console.log('Could not determine city name for Eventbrite search');
      return [];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const searchUrl = `https://${RAPIDAPI_HOST}/events/search?location.address=${encodeURIComponent(cityName)}&location.within=${params.radius || 10}km`;
      
      const eventResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!eventResponse.ok) {
        throw new Error(`Eventbrite API error: ${eventResponse.status}`);
      }

      const eventData = await eventResponse.json();
      
      if (!eventData.events || !Array.isArray(eventData.events)) {
        console.log('No events found in Eventbrite response');
        return [];
      }

      const events = eventData.events.map(event => {
        try {
          if (!event.venue?.latitude || !event.venue?.longitude) {
            return null;
          }

          const startDate = new Date(event.start.local);
          
          return {
            id: `eventbrite-${event.id}`,
            title: event.name.text,
            description: event.description?.text || 'No description available',
            date: startDate.toLocaleDateString(),
            time: startDate.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            location: {
              latitude: Number(event.venue.latitude),
              longitude: Number(event.venue.longitude),
              address: [
                event.venue.name,
                event.venue.address.address_1,
                event.venue.address.city,
                event.venue.address.region
              ].filter(Boolean).join(', ')
            },
            category: mapEventCategory(event),
            subcategory: event.category?.name || 'Various',
            status: event.status,
            imageUrl: event.logo?.url,
            ticketUrl: event.url,
            venue: {
              name: event.venue.name,
              city: event.venue.address.city,
              state: event.venue.address.region
            }
          };
        } catch (error) {
          console.error('Error formatting Eventbrite event:', error);
          return null;
        }
      }).filter(Boolean);

      console.log(`Found ${events.length} valid Eventbrite events`);
      return events;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Eventbrite request timed out');
      } else {
        console.error('Error fetching Eventbrite events:', error);
      }
      return [];
    }
  } catch (error) {
    console.error('Error in Eventbrite event search:', error);
    return [];
  }
}

function mapEventCategory(event: any): string {
  const name = (event.name?.text || '').toLowerCase();
  const category = (event.category?.name || '').toLowerCase();
  
  if (name.includes('concert') || category.includes('music')) return 'live-music';
  if (name.includes('comedy') || category.includes('comedy')) return 'comedy';
  if (name.includes('sport') || category.includes('sport')) return 'sports-games';
  if (name.includes('art') || category.includes('theatre')) return 'performing-arts';
  if (name.includes('food') || category.includes('dining')) return 'food-drink';
  if (name.includes('culture')) return 'cultural';
  if (name.includes('education')) return 'educational';
  if (name.includes('outdoor')) return 'outdoor';
  return 'special';
}