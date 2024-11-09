import { Handler } from '@netlify/functions';

const YELP_API_KEY = 'iYwFjiwmMDv08lJz8H_Dvsxx93H81MYLGkexEMvxH8J60I1pxc5GpyzTZyaO6xDtQ-jlAIJaC6ujscO6rHTbq8wgpge_bUuz2nQa0VpcLU5ikY2mBWw8AfVfiDMoZ3Yx';
const YELP_BASE_URL = 'https://api.yelp.com/v3/businesses/search';

export const handler: Handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const queryString = event.rawQuery;
    const apiUrl = `${YELP_BASE_URL}?${queryString}`;

    console.log('Proxying request to:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Yelp API Error:', error);

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