import { Event } from '../types';

// Remove API authentication since it's not working
export async function searchEvents(): Promise<Event[]> {
  // Return empty array since we can't access the API
  console.log('Eventbrite API disabled due to authentication issues');
  return [];
}