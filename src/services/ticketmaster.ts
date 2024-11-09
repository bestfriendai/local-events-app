import { Event } from '../types';

const API_KEY = 'DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9';
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const REQUEST_TIMEOUT = 30000;

// Map our categories to Ticketmaster segment IDs and genre IDs
const CATEGORY_MAPPING: Record<string, { segmentId?: string; genreId?: string }> = {
  'live-music': { segmentId: 'KZFzniwnSyZfZ7v7nJ' },
  'sports-games': { segmentId: 'KZFzniwnSyZfZ7v7nE' },
  'performing-arts': { segmentId: 'KZFzniwnSyZfZ7v7na' },
  'comedy': { segmentId: 'KZFzniwnSyZfZ7v7na', genreId: 'KnvZfZ7vAe1' },
  'food-drink': { segmentId: 'KZFzniwnSyZfZ7v7lF' },
  'cultural': { segmentId: 'KZFzniwnSyZfZ7v7na' },
  'social': { segmentId: 'KZFzniwnSyZfZ7v7ld' },
  'educational': { segmentId: 'KZFzniwnSyZfZ7v7n1' },
  'outdoor': { segmentId: 'KZFzniwnSyZfZ7v7nE' },
  'special': { segmentId: 'KZFzniwnSyZfZ7v7n1' }
};

function getDateRange(dateFilter?: string) {
  const now = new Date();
  const startDateTime = now.toISOString().slice(0, 19) + 'Z';
  let endDateTime;

  if (!dateFilter) return { startDateTime };

  switch (dateFilter) {
    case 'today':
      now.setHours(23, 59, 59);
      endDateTime = now.toISOString().slice(0, 19) + 'Z';
      break;
    case 'tomorrow':
      now.setDate(now.getDate() + 1);
      now.setHours(23, 59, 59);
      endDateTime = now.toISOString().slice(0, 19) + 'Z';
      break;
    case 'week':
      now.setDate(now.getDate() + 7);
      endDateTime = now.toISOString().slice(0, 19) + 'Z';
      break;
    case 'month':
      now.setMonth(now.getMonth() + 1);
      endDateTime = now.toISOString().slice(0, 19) + 'Z';
      break;
    default:
      if (dateFilter.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(dateFilter);
        date.setHours(23, 59, 59);
        endDateTime = date.toISOString().slice(0, 19) + 'Z';
      }
  }

  return { startDateTime, endDateTime };
}

async function fetchAllPages(baseParams: URLSearchParams): Promise<any[]> {
  let allEvents: any[] = [];
  let page = 0;
  let hasMorePages = true;
  const eventsPerPage = 100;
  const maxPages = 4;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    while (hasMorePages && page < maxPages && allEvents.length < 400) {
      const params = new URLSearchParams(baseParams);
      params.set('page', page.toString());
      params.set('size', eventsPerPage.toString());

      const response = await fetch(
        `${BASE_URL}/events.json?${params.toString()}`,
        { signal: controller.signal }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data._embedded?.events) {
        break;
      }

      allEvents = [...allEvents, ...data._embedded.events];
      hasMorePages = data.page.totalPages > page + 1;
      page++;
    }

    clearTimeout(timeoutId);
    return allEvents.slice(0, 400);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.log('Request timed out');
    }
    throw error;
  }
}

function formatEventData(event: any): Event | null {
  try {
    const venue = event._embedded?.venues?.[0];
    if (!venue?.location?.latitude || !venue?.location?.longitude) {
      return null;
    }

    const image = event.images?.find((img: any) => img.ratio === '16_9' && img.width > 1000) || event.images?.[0];
    const classification = event.classifications?.[0];
    
    // Map category to our new categories
    let category = 'special';
    if (classification?.segment?.name) {
      const segmentName = classification.segment.name.toLowerCase();
      const genreName = classification.genre?.name?.toLowerCase() || '';

      if (genreName.includes('comedy')) {
        category = 'comedy';
      } else if (segmentName.includes('music')) {
        category = 'live-music';
      } else if (segmentName.includes('sports')) {
        category = 'sports-games';
      } else if (segmentName.includes('arts')) {
        category = 'performing-arts';
      } else if (segmentName.includes('food')) {
        category = 'food-drink';
      } else if (segmentName.includes('cultural')) {
        category = 'cultural';
      } else if (segmentName.includes('social')) {
        category = 'social';
      } else if (segmentName.includes('education')) {
        category = 'educational';
      } else if (segmentName.includes('outdoor')) {
        category = 'outdoor';
      }
    }

    // Calculate distance if coordinates are provided
    let distance: number | undefined;
    if (event._userLocation) {
      const { latitude, longitude } = event._userLocation;
      const R = 3959; // Earth's radius in miles
      const lat1 = latitude * Math.PI / 180;
      const lat2 = Number(venue.location.latitude) * Math.PI / 180;
      const dLat = (Number(venue.location.latitude) - latitude) * Math.PI / 180;
      const dLon = (Number(venue.location.longitude) - longitude) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1) * Math.cos(lat2) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = R * c;
    }

    return {
      id: event.id,
      title: event.name,
      description: event.description || event.info || event.pleaseNote || 'No description available',
      date: event.dates.start.dateTime || event.dates.start.localDate 
        ? new Date(event.dates.start.dateTime || event.dates.start.localDate).toLocaleDateString()
        : 'Date TBA',
      time: event.dates.start.dateTime 
        ? new Date(event.dates.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : event.dates.start.localTime || 'Time TBA',
      location: {
        latitude: Number(venue.location.latitude),
        longitude: Number(venue.location.longitude),
        address: venue ? `${venue.name}, ${venue.city.name}, ${venue.state?.stateCode || ''}` : 'Location TBA',
      },
      category,
      subcategory: classification?.genre?.name || 'Various',
      priceRange: event.priceRanges ? `$${event.priceRanges[0].min}-$${event.priceRanges[0].max}` : 'Price TBA',
      status: event.dates.status.code,
      distance,
      imageUrl: image?.url,
      ticketUrl: event.url,
      venue: {
        name: venue.name,
        city: venue.city.name,
        state: venue.state?.stateCode || '',
        capacity: venue.capacity,
        generalInfo: venue.generalInfo
      },
      attractions: event._embedded?.attractions?.map((attraction: any) => ({
        name: attraction.name,
        type: attraction.type,
        image: attraction.images?.[0]?.url,
        url: attraction.url,
      })) || [],
    };
  } catch (error) {
    console.error('Error formatting event data:', error);
    return null;
  }
}

export async function searchTicketmasterEvents(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  keyword?: string;
  size?: number;
  filters?: Filter;
}): Promise<Event[]> {
  console.log('Searching Ticketmaster events with params:', params);

  const dateRange = params.filters?.date ? getDateRange(params.filters.date) : {};
  const categoryMapping = params.filters?.category ? CATEGORY_MAPPING[params.filters.category] : undefined;

  const searchParams = new URLSearchParams({
    apikey: API_KEY,
    size: '100',
    unit: 'miles',
    sort: 'date,asc',
    includeTBA: 'yes',
    includeTest: 'no',
    ...(params.latitude && params.longitude && {
      latlong: `${params.latitude},${params.longitude}`,
      radius: (params.filters?.distance || params.radius || 10).toString(),
    }),
    ...(params.keyword && { keyword: params.keyword }),
    ...(dateRange.startDateTime && { startDateTime: dateRange.startDateTime }),
    ...(dateRange.endDateTime && { endDateTime: dateRange.endDateTime }),
    ...(categoryMapping?.segmentId && { segmentId: categoryMapping.segmentId }),
    ...(categoryMapping?.genreId && { genreId: categoryMapping.genreId }),
  });

  try {
    const events = await fetchAllPages(searchParams);
    console.log(`Fetched ${events.length} Ticketmaster events`);

    // Add user location to each event for distance calculation
    const eventsWithLocation = events.map(event => ({
      ...event,
      _userLocation: params.latitude && params.longitude 
        ? { latitude: params.latitude, longitude: params.longitude }
        : null
    }));

    const formattedEvents = eventsWithLocation
      .map(formatEventData)
      .filter((event): event is Event => event !== null);

    console.log(`Formatted ${formattedEvents.length} valid Ticketmaster events`);
    return formattedEvents;
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error);
    throw error;
  }
}