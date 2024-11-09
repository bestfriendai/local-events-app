import { Event } from '../types';
import { searchAllEvents } from './events';
import { searchRestaurants } from './yelp';
import { validateDatePlanRequest } from './ai-validator';
import { getAIRecommendations } from './recommendations';

interface DatePlanRequest {
  date: Date;
  startTime: string;
  duration: number;
  budget: number;
  location: {
    latitude: number;
    longitude: number;
  };
  preferences?: string[];
  transportMode: 'driving' | 'walking' | 'transit';
}

interface DatePlan {
  events: Event[];
  totalCost: number;
  travelTimes: number[];
}

export async function generateDatePlan(request: DatePlanRequest): Promise<DatePlan> {
  const validation = validateDatePlanRequest(request);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  try {
    // Get events and restaurants in parallel with expanded radius
    const [events, restaurants] = await Promise.all([
      searchAllEvents({
        latitude: request.location.latitude,
        longitude: request.location.longitude,
        radius: 25, // Increased radius for more options
        size: 100 // Increased size for more variety
      }),
      searchRestaurants({
        latitude: request.location.latitude,
        longitude: request.location.longitude,
        radius: 25000 // 25km in meters
      })
    ]);

    // Convert restaurants to events format
    const restaurantEvents = restaurants.map(r => ({
      id: `restaurant-${r.id}`,
      title: r.name,
      description: r.categories.map(c => c.title).join(', '),
      date: request.date.toLocaleDateString(),
      time: request.startTime,
      location: {
        latitude: r.coordinates.latitude,
        longitude: r.coordinates.longitude,
        address: r.location.display_address.join(', ')
      },
      category: 'food-drink',
      subcategory: r.categories[0]?.title || 'Restaurant',
      priceRange: r.price,
      status: r.is_closed ? 'closed' : 'open',
      distance: r.distance,
      imageUrl: r.image_url,
      venue: {
        name: r.name,
        city: r.location.city,
        state: r.location.state,
        rating: r.rating
      }
    }));

    // Combine all options
    const allOptions = [...events, ...restaurantEvents];

    // Ensure we have enough options
    if (allOptions.length === 0) {
      throw new Error('No venues or events found in the selected area');
    }

    // Filter by budget
    const budgetPerActivity = request.budget / 3; // Split budget into thirds
    const filteredOptions = allOptions.filter(option => {
      if (!option.priceRange) return true;
      const price = parseInt(option.priceRange.replace(/[^0-9]/g, '') || '0');
      return price <= budgetPerActivity;
    });

    if (filteredOptions.length === 0) {
      throw new Error('No options found within your budget');
    }

    // Apply preferences if provided
    let preferredOptions = filteredOptions;
    if (request.preferences && request.preferences.length > 0) {
      const preferences = request.preferences.map(p => p.toLowerCase());
      preferredOptions = filteredOptions.filter(option => {
        const matchesPreference = preferences.some(pref => 
          option.title.toLowerCase().includes(pref) ||
          option.description.toLowerCase().includes(pref) ||
          option.category.toLowerCase().includes(pref)
        );
        return matchesPreference;
      });

      // If no matches found, fall back to all filtered options
      if (preferredOptions.length === 0) {
        preferredOptions = filteredOptions;
      }
    }

    // Select events based on time of day
    const [hours] = request.startTime.split(':').map(Number);
    const selectedEvents: Event[] = [];

    // Morning (before 11 AM)
    if (hours < 11) {
      // Breakfast
      const breakfast = preferredOptions.find(e => 
        e.category === 'food-drink' && 
        e.description.toLowerCase().includes('breakfast')
      );
      if (breakfast) selectedEvents.push(breakfast);
      
      // Morning activity
      const morning = preferredOptions.find(e => 
        (e.category === 'cultural' || e.category === 'outdoor') &&
        !selectedEvents.includes(e)
      );
      if (morning) selectedEvents.push(morning);
    }
    // Afternoon (11 AM - 5 PM)
    else if (hours < 17) {
      // Lunch
      const lunch = preferredOptions.find(e => e.category === 'food-drink');
      if (lunch) selectedEvents.push(lunch);
      
      // Afternoon activity
      const afternoon = preferredOptions.find(e => 
        e.category !== 'food-drink' && 
        !selectedEvents.includes(e)
      );
      if (afternoon) selectedEvents.push(afternoon);
    }
    // Evening (after 5 PM)
    else {
      // Dinner
      const dinner = preferredOptions.find(e => e.category === 'food-drink');
      if (dinner) selectedEvents.push(dinner);
      
      // Entertainment
      const entertainment = preferredOptions.find(e => 
        (e.category === 'live-music' || e.category === 'performing-arts' || e.category === 'comedy') &&
        !selectedEvents.includes(e)
      );
      if (entertainment) selectedEvents.push(entertainment);
    }

    // Add one more activity if we have room
    if (selectedEvents.length < 3) {
      const additional = preferredOptions.find(e => 
        !selectedEvents.includes(e) && 
        e.category !== selectedEvents[0]?.category
      );
      if (additional) selectedEvents.push(additional);
    }

    // Ensure we have at least one event
    if (selectedEvents.length === 0) {
      selectedEvents.push(preferredOptions[0]);
    }

    // Calculate travel times based on transport mode and distance
    const travelTimes = Array(Math.max(0, selectedEvents.length - 1))
      .fill(0)
      .map((_, i) => {
        const distance = selectedEvents[i].distance || 1;
        switch (request.transportMode) {
          case 'walking':
            return Math.round(distance * 20); // ~3mph walking speed
          case 'transit':
            return Math.round(distance * 10); // ~6mph transit speed
          default: // driving
            return Math.round(distance * 5); // ~12mph driving speed in city
        }
      });

    // Calculate total cost
    const totalCost = selectedEvents.reduce((sum, event) => {
      const price = event.priceRange 
        ? parseInt(event.priceRange.replace(/[^0-9]/g, '') || '0')
        : 0;
      return sum + price;
    }, 0);

    return {
      events: selectedEvents,
      totalCost,
      travelTimes
    };
  } catch (error) {
    console.error('Error generating date plan:', error);
    throw error;
  }
}