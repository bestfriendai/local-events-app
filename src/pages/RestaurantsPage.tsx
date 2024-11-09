import React, { useState, useCallback, useEffect } from 'react';
import MapView from '../components/Map';
import SearchBar from '../components/SearchBar';
import RestaurantList from '../components/RestaurantList';
import RestaurantFilterPanel from '../components/RestaurantFilterPanel';
import Header from '../components/Header';
import { Restaurant, RestaurantFilter } from '../types/restaurant';
import { searchRestaurants } from '../services/restaurants';
import { Filter, SlidersHorizontal } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import { useLocation } from '../hooks/useLocation';

export default function RestaurantsPage() {
  const { location: userLocation } = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<RestaurantFilter>({
    categories: [],
    price: [],
    rating: 0,
    distance: 30,
    openNow: false
  });

  const fetchRestaurants = useCallback(async (isLoadingMore = false) => {
    const location = searchLocation || userLocation;
    if (!location) return;

    try {
      if (!isLoadingMore) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const result = await searchRestaurants({
        latitude: location.latitude,
        longitude: location.longitude,
        page: isLoadingMore ? page + 1 : 1,
        filters: currentFilters
      });

      if (isLoadingMore) {
        setRestaurants(prev => [...prev, ...result.restaurants]);
        setPage(prev => prev + 1);
      } else {
        setRestaurants(result.restaurants);
        setPage(1);
      }

      setHasMore(result.hasMore);

      if (!isLoadingMore && result.restaurants.length === 0) {
        setError('No restaurants found in this area. Try adjusting your filters or location.');
      } else if (!isLoadingMore) {
        setSuccess(`Found ${result.totalCount} restaurants in your area!`);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to fetch restaurants. Please try again.');
    } finally {
      if (isLoadingMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [searchLocation, userLocation, currentFilters, page]);

  useEffect(() => {
    if (searchLocation || userLocation) {
      fetchRestaurants();
    }
  }, [fetchRestaurants, searchLocation, userLocation]);

  const handleSearch = useCallback((term: string) => {
    console.log('Search term:', term);
  }, []);

  const handleFilterChange = useCallback((filters: RestaurantFilter) => {
    setCurrentFilters(filters);
  }, []);

  const handleLocationChange = useCallback((location: { latitude: number; longitude: number } | null) => {
    setSearchLocation(location);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchRestaurants(true);
    }
  }, [fetchRestaurants, isLoadingMore, hasMore]);

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black">
      <Header />
      
      <div className="h-[calc(100vh-64px)] w-full mt-16 flex">
        <div className="w-[400px] border-r border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {error && (
            <div className="p-4">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          {success && (
            <div className="p-4">
              <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />
            </div>
          )}

          {showFilters && (
            <div className="p-4 border-b border-zinc-800">
              <RestaurantFilterPanel onFilterChange={handleFilterChange} />
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <RestaurantList
              restaurants={restaurants}
              onRestaurantSelect={setSelectedRestaurant}
              isLoading={isLoading}
              selectedRestaurant={selectedRestaurant}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              isLoadingMore={isLoadingMore}
            />
          </div>
        </div>
        
        <div className="flex-1 relative">
          <MapView 
            events={restaurants.map(restaurant => ({
              id: restaurant.id,
              title: restaurant.name,
              description: restaurant.categories.map(c => c.title).join(', '),
              date: restaurant.hours?.[0]?.is_open_now ? 'Open Now' : 'Closed',
              time: '',
              location: {
                latitude: restaurant.coordinates.latitude,
                longitude: restaurant.coordinates.longitude,
                address: restaurant.location.display_address.join(', ')
              },
              category: 'food-drink',
              subcategory: restaurant.categories[0]?.title || 'Restaurant',
              status: restaurant.is_closed ? 'closed' : 'open',
              distance: restaurant.distance,
              imageUrl: restaurant.image_url,
              venue: {
                name: restaurant.name,
                city: restaurant.location.city,
                state: restaurant.location.state,
                rating: restaurant.rating
              }
            }))}
            onEventSelect={(event) => {
              const restaurant = restaurants.find(r => r.id === event.id);
              if (restaurant) {
                setSelectedRestaurant(restaurant);
              }
            }}
            userLocation={searchLocation || userLocation}
            selectedEvent={selectedRestaurant ? {
              id: selectedRestaurant.id,
              title: selectedRestaurant.name,
              description: selectedRestaurant.categories.map(c => c.title).join(', '),
              date: selectedRestaurant.hours?.[0]?.is_open_now ? 'Open Now' : 'Closed',
              time: '',
              location: {
                latitude: selectedRestaurant.coordinates.latitude,
                longitude: selectedRestaurant.coordinates.longitude,
                address: selectedRestaurant.location.display_address.join(', ')
              },
              category: 'food-drink',
              subcategory: selectedRestaurant.categories[0]?.title || 'Restaurant',
              status: selectedRestaurant.is_closed ? 'closed' : 'open',
              distance: selectedRestaurant.distance,
              imageUrl: selectedRestaurant.image_url,
              venue: {
                name: selectedRestaurant.name,
                city: selectedRestaurant.location.city,
                state: selectedRestaurant.location.state,
                rating: selectedRestaurant.rating
              }
            } : null}
            isLoadingEvents={isLoading}
          />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
            <SearchBar
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              onLocationChange={handleLocationChange}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}