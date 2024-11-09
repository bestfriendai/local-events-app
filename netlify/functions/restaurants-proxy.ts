import { Handler } from '@netlify/functions';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'restaurants-near-me-usa.p.rapidapi.com';
const YELP_API_KEY = process.env.YELP_API_KEY || '';

async function fetchYelpData(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&radius=16000&sort_by=distance&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${YELP_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Yelp API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.businesses || [];
  } catch (error) {
    console.error('Yelp API Error:', error);
    return [];
  }
}

async function fetchRapidAPIData(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/restaurants/location/within-boundary`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        },
        body: JSON.stringify({
          "lat1": latitude - 0.1,
          "lat2": latitude + 0.1,
          "long1": longitude - 0.1,
          "long2": longitude + 0.1
        })
      }
    );

    if (!response.ok) {
      throw new Error(`RapidAPI responded with status ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('RapidAPI Error:', error);
    return [];
  }
}

function transformYelpData(business: any) {
  return {
    restaurant_id: business.id,
    name: business.name,
    cuisines: business.categories?.map((cat: any) => cat.title) || [],
    address: {
      street: business.location?.address1,
      city: business.location?.city,
      state: business.location?.state,
      postal_code: business.location?.zip_code
    },
    latitude: business.coordinates?.latitude,
    longitude: business.coordinates?.longitude,
    rating: business.rating,
    review_count: business.review_count,
    price_level: (business.price?.length || 2),
    is_open_now: !business.is_closed,
    hours: business.hours || [{
      hours_type: 'REGULAR',
      is_open_now: !business.is_closed,
      open: business.hours?.[0]?.open || []
    }],
    photo: {
      url: business.image_url
    },
    distance: business.distance,
    transactions: business.transactions || [],
    source: 'yelp'
  };
}

function transformRapidAPIData(restaurant: any) {
  const now = new Date();
  const currentHour = now.getHours();
  const isOpenNow = currentHour >= 11 && currentHour < 23;

  const operatingHours = Array(7).fill(null).map((_, index) => ({
    day: index,
    open_time: '11:00',
    close_time: '23:00',
    is_overnight: false
  }));

  return {
    restaurant_id: restaurant.id,
    name: restaurant.name,
    cuisines: restaurant.cuisine,
    address: {
      street: restaurant.address?.street,
      city: restaurant.address?.city,
      state: restaurant.address?.state,
      postal_code: restaurant.address?.postcode
    },
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    rating: restaurant.rating || 4.0,
    review_count: restaurant.reviews_count || 0,
    price_level: restaurant.price_level || 2,
    is_open_now: isOpenNow,
    hours: [{
      hours_type: 'REGULAR',
      is_open_now: isOpenNow,
      open: operatingHours
    }],
    photo: {
      url: restaurant.photo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'
    },
    distance: restaurant.distance || 0,
    transactions: ['delivery', 'pickup', 'restaurant_reservation'],
    source: 'rapidapi'
  };
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { latitude, longitude } = event.queryStringParameters || {};

    if (!latitude || !longitude) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Latitude and longitude are required' })
      };
    }

    // Fetch data from both APIs concurrently
    const [yelpData, rapidApiData] = await Promise.all([
      fetchYelpData(Number(latitude), Number(longitude)),
      fetchRapidAPIData(Number(latitude), Number(longitude))
    ]);

    // Transform and combine results
    const transformedData = {
      results: [
        ...yelpData.map(transformYelpData),
        ...rapidApiData.map(transformRapidAPIData)
      ]
    };

    // Remove duplicates based on name and location similarity
    const uniqueResults = transformedData.results.reduce((acc: any[], current: any) => {
      const isDuplicate = acc.some(item => 
        item.name.toLowerCase() === current.name.toLowerCase() &&
        Math.abs(item.latitude - current.latitude) < 0.0001 &&
        Math.abs(item.longitude - current.longitude) < 0.0001
      );
      
      if (!isDuplicate) {
        acc.push(current);
      }
      return acc;
    }, []);

    transformedData.results = uniqueResults;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedData)
    };
  } catch (error) {
    console.error('Restaurant API Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
