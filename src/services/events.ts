import { Event, Filter } from '../types';
import { searchTicketmasterEvents } from './ticketmaster';
import { searchRapidAPIEvents } from './rapidapi-events';
import { searchEventbriteRapidAPI } from './eventbrite-rapidapi';
import { searchGoogleEvents } from './google-events';

export const UNIFIED_CATEGORIES = {
  'all': 'All Events',
  'live-music': 'Live Music',
  'comedy': 'Comedy',
  'sports-games': 'Sports & Games',
  'performing-arts': 'Performing Arts',
  'food-drink': 'Food & Drink',
  'cultural': 'Cultural',
  'social': 'Social',
  'educational': 'Educational',
  'outdoor': 'Outdoor',
  'special': 'Special Events'
} as const;

// Cache for storing fetched events
let eventCache: {
  events: Event[];
  timestamp: number;
  expiresIn: number;
} | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const SEARCH_RADIUS = 100; // 100 mile default radius

function removeDuplicates(events: Event[]): Event[] {
  console.log('Removing duplicates from', events.length, 'events');
  const seen = new Set();
  const uniqueEvents = events.filter(event => {
    const key = `${event.title}-${event.date}-${event.location.latitude}-${event.location.longitude}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log('After deduplication:', uniqueEvents.length, 'events');
  return uniqueEvents;
}

function validateEvent(event: Event): boolean {
  if (!event.id || !event.title || !event.date || !event.location) {
    console.log('Invalid event:', { id: event.id, title: event.title });
    return false;
  }
  
  if (!event.location.latitude || !event.location.longitude) {
    console.log('Event missing coordinates:', event.title);
    return false;
  }

  return true;
}

async function fetchAllEvents(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
}): Promise<Event[]> {
  console.log('Fetching events from all sources with params:', params);

  const eventPromises = [
    searchTicketmasterEvents({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || SEARCH_RADIUS
    }).catch(error => {
      console.error('Ticketmaster API Error:', error);
      return [];
    }),
    searchRapidAPIEvents({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || SEARCH_RADIUS
    }).catch(error => {
      console.error('RapidAPI Error:', error);
      return [];
    }),
    searchEventbriteRapidAPI({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || SEARCH_RADIUS
    }).catch(error => {
      console.error('Eventbrite API Error:', error);
      return [];
    }),
    searchGoogleEvents({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || SEARCH_RADIUS
    }).catch(error => {
      console.error('Google Events API Error:', error);
      return [];
    })
  ];

  const results = await Promise.allSettled(eventPromises);
  
  const allEvents: Event[] = results
    .filter((result): result is PromiseFulfilledResult<Event[]> => 
      result.status === 'fulfilled' && Array.isArray(result.value)
    )
    .flatMap(result => result.value.filter(validateEvent));

  console.log('Event counts by source:');
  results.forEach((result, index) => {
    const source = ['Ticketmaster', 'RapidAPI', 'Eventbrite', 'Google'][index];
    const count = result.status === 'fulfilled' ? result.value.length : 0;
    console.log(`- ${source}: ${count} events`);
  });

  const uniqueEvents = removeDuplicates(allEvents);
  console.log('Total unique events:', uniqueEvents.length);

  return uniqueEvents;
}

export async function searchAllEvents(params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  keyword?: string;
  size?: number;
  filters?: Filter;
}): Promise<Event[]> {
  console.log('Searching all events with params:', params);

  try {
    // Check cache first
    const now = Date.now();
    if (eventCache && (now - eventCache.timestamp) < eventCache.expiresIn) {
      console.log('Using cached events');
    } else {
      console.log('Cache expired or not found, fetching fresh events');
      const events = await fetchAllEvents({
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius
      });
      
      eventCache = {
        events,
        timestamp: now,
        expiresIn: CACHE_DURATION
      };
    }

    let filteredEvents = eventCache.events;

    // Apply location-based filtering
    if (params.latitude && params.longitude) {
      console.log('Applying location filtering');
      filteredEvents = filteredEvents.map(event => ({
        ...event,
        distance: calculateDistance(
          params.latitude!,
          params.longitude!,
          event.location.latitude,
          event.location.longitude
        )
      }));
    }

    // Apply other filters
    if (params.filters) {
      console.log('Applying filters:', params.filters);
      filteredEvents = filterEvents(
        filteredEvents,
        params.filters,
        params.latitude && params.longitude
          ? { latitude: params.latitude, longitude: params.longitude }
          : undefined
      );
    }

    // Sort events
    filteredEvents.sort((a, b) => {
      // First by date
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) return dateComparison;

      // Then by distance if available
      if (a.distance && b.distance) {
        return a.distance - b.distance;
      }

      return 0;
    });

    // Limit results if size is specified
    if (params.size && params.size > 0) {
      filteredEvents = filteredEvents.slice(0, params.size);
    }

    console.log(`Returning ${filteredEvents.length} filtered events`);
    return filteredEvents;
  } catch (error) {
    console.error('Error searching events:', error);
    throw error;
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function filterEvents(events: Event[], filters: Filter, userLocation?: { latitude: number; longitude: number }): Event[] {
  console.log('Filtering events with:', { filters, hasLocation: !!userLocation });
  
  return events.filter(event => {
    // Category filter
    if (filters.category !== 'all' && event.category !== filters.category) {
      return false;
    }

    // Date filter
    if (filters.date !== 'all') {
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (filters.date) {
        case 'today':
          if (eventDate.toDateString() !== today.toDateString()) return false;
          break;
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (eventDate.toDateString() !== tomorrow.toDateString()) return false;
          break;
        case 'week':
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          if (eventDate > nextWeek) return false;
          break;
        case 'month':
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          if (eventDate > nextMonth) return false;
          break;
      }
    }

    // Price filter
    if (filters.priceRange.length > 0) {
      if (!event.priceRange) return false;
      const price = parseFloat(event.priceRange.replace(/[^0-9.-]+/g, ''));
      const matchesPrice = filters.priceRange.some(range => {
        switch (range) {
          case 'free':
            return price === 0;
          case '0-25':
            return price <= 25;
          case '25-50':
            return price > 25 && price <= 50;
          case '50-100':
            return price > 50 && price <= 100;
          case '100+':
            return price > 100;
          default:
            return false;
        }
      });
      if (!matchesPrice) return false;
    }

    // Distance filter
    if (userLocation && filters.distance) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        event.location.latitude,
        event.location.longitude
      );
      if (distance > filters.distance) return false;
    }

    return true;
  });
}