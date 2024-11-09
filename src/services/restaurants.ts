import { Restaurant, RestaurantFilter } from '../types/restaurant';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 20;

interface CacheEntry {
  data: Restaurant[];
  timestamp: number;
  location: string;
  filters: string;
}

const cache = new Map<string, CacheEntry>();

const getCacheKey = (params: any) => {
  return `${params.latitude},${params.longitude}-${JSON.stringify(params.filters)}`;
};

export async function searchRestaurants(params: {
  latitude: number;
  longitude: number;
  page?: number;
  filters?: RestaurantFilter;
}): Promise<{ restaurants: Restaurant[]; totalCount: number; hasMore: boolean }> {
  try {
    const cacheKey = getCacheKey(params);
    const now = Date.now();
    const cached = cache.get(cacheKey);

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      const start = ((params.page || 1) - 1) * PAGE_SIZE;
      return {
        restaurants: cached.data.slice(start, start + PAGE_SIZE),
        totalCount: cached.data.length,
        hasMore: start + PAGE_SIZE < cached.data.length
      };
    }

    const response = await fetch(
      `/.netlify/functions/restaurants-proxy?latitude=${params.latitude}&longitude=${params.longitude}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch restaurants');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const restaurants = formatRestaurants(data.results, params);

    cache.set(cacheKey, {
      data: restaurants,
      timestamp: now,
      location: `${params.latitude},${params.longitude}`,
      filters: JSON.stringify(params.filters)
    });

    const start = ((params.page || 1) - 1) * PAGE_SIZE;
    return {
      restaurants: restaurants.slice(start, start + PAGE_SIZE),
      totalCount: restaurants.length,
      hasMore: start + PAGE_SIZE < restaurants.length
    };
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
}

function formatRestaurants(results: any[], params: any): Restaurant[] {
  return results
    .map(result => {
      try {
        const restaurant: Restaurant = {
          id: result.restaurant_id || result.id,
          name: result.name,
          image_url: result.photo?.url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
          url: result.website || '',
          review_count: result.review_count || 0,
          rating: result.rating || 0,
          coordinates: {
            latitude: result.latitude || params.latitude,
            longitude: result.longitude || params.longitude
          },
          price: result.price_level ? '$'.repeat(result.price_level) : '$$',
          categories: (result.cuisines || []).map((cuisine: string) => ({
            alias: cuisine.toLowerCase(),
            title: cuisine
          })),
          location: {
            address1: result.address?.street || '',
            city: result.address?.city || '',
            state: result.address?.state || '',
            country: result.address?.country || 'US',
            zip_code: result.address?.postal_code || '',
            display_address: [
              result.address?.street,
              `${result.address?.city}, ${result.address?.state}`
            ].filter(Boolean)
          },
          phone: result.phone || '',
          display_phone: result.formatted_phone || '',
          distance: result.distance || 0,
          is_closed: !result.is_open_now,
          hours: result.hours || [{
            is_open_now: result.is_open_now || false,
            open: (result.hours || []).map((hour: any) => ({
              start: hour.open_time,
              end: hour.close_time,
              day: hour.day
            }))
          }],
          photos: [
            result.photo?.url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
            'https://images.unsplash.com/photo-1552566626-52f8b828add9',
            'https://images.unsplash.com/photo-1544148103-0773bf10d330'
          ],
          transactions: result.transactions || [],
          source: result.source || 'rapidapi'
        };

        if (params.filters) {
          if (params.filters.rating > 0 && restaurant.rating < params.filters.rating) {
            return null;
          }
          if (params.filters.price.length > 0 && !params.filters.price.includes(restaurant.price?.length.toString())) {
            return null;
          }
          if (params.filters.categories.length > 0 && !restaurant.categories.some(c => 
            params.filters.categories.includes(c.alias)
          )) {
            return null;
          }
          if (params.filters.distance > 0 && restaurant.distance > params.filters.distance * 1609.34) {
            return null;
          }
          if (params.filters.openNow && restaurant.is_closed) {
            return null;
          }
        }

        return restaurant;
      } catch (error) {
        console.error('Error formatting restaurant:', error);
        return null;
      }
    })
    .filter((r): r is Restaurant => r !== null);
}
