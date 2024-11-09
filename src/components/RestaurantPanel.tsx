import React, { useState } from 'react';
import { Calendar, MapPin, Phone, Star, DollarSign, Clock, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { Restaurant, RestaurantFilter } from '../types/restaurant';
import RestaurantFilterPanel from './RestaurantFilterPanel';
import RestaurantDetails from './RestaurantDetails';

interface RestaurantPanelProps {
  restaurants: Restaurant[];
  onRestaurantSelect: (restaurant: Restaurant) => void;
  onFilterChange: (filters: RestaurantFilter) => void;
  isLoading?: boolean;
  selectedRestaurant?: Restaurant | null;
}

export default function RestaurantPanel({ 
  restaurants, 
  onRestaurantSelect, 
  onFilterChange, 
  isLoading, 
  selectedRestaurant 
}: RestaurantPanelProps) {
  const [sortBy, setSortBy] = useState<'rating' | 'distance'>('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const sortedRestaurants = [...restaurants].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    } else {
      return (a.distance || Infinity) - (b.distance || Infinity);
    }
  });

  const formatPrice = (price?: string) => {
    return price ? price : 'Price not available';
  };

  const formatDistance = (meters: number) => {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} mi`;
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    onRestaurantSelect(restaurant);
    setShowDetails(true);
  };

  return (
    <div className="h-full text-white">
      <div className="p-4 sm:p-6 border-b border-zinc-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Restaurants</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'rating' ? 'distance' : 'rating')}
              className="flex items-center gap-1 sm:gap-2 bg-zinc-800 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-zinc-700 transition-colors"
            >
              <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Sort by </span>
              <span>{sortBy === 'rating' ? 'Distance' : 'Rating'}</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors ${
                showFilters ? 'bg-blue-500 hover:bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-4">
            <RestaurantFilterPanel onFilterChange={onFilterChange} />
          </div>
        )}
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-240px)] p-4 sm:p-6 space-y-4 scrollbar-hide">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading restaurants...</p>
          </div>
        ) : sortedRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-zinc-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No restaurants found</h3>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        ) : (
          sortedRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              onClick={() => handleRestaurantClick(restaurant)}
              className={`bg-zinc-900/50 rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-zinc-800 transition-all transform hover:scale-[1.02] border ${
                selectedRestaurant?.id === restaurant.id ? 'border-blue-500/50' : 'border-zinc-800/50'
              }`}
            >
              {restaurant.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img 
                    src={restaurant.image_url} 
                    alt={restaurant.name} 
                    className="w-full h-32 sm:h-48 object-cover"
                  />
                </div>
              )}
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">{restaurant.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium">{restaurant.rating}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      ({restaurant.review_count} reviews)
                    </span>
                  </div>
                </div>
                {restaurant.distance && (
                  <span className="text-xs sm:text-sm text-zinc-400">
                    {formatDistance(restaurant.distance)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
                {restaurant.categories.map((category, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full"
                  >
                    {category.title}
                  </span>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{restaurant.location.display_address.join(', ')}</span>
                </div>
                {restaurant.display_phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{restaurant.display_phone}</span>
                  </div>
                )}
                {restaurant.hours?.[0]?.is_open_now !== undefined && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className={restaurant.hours[0].is_open_now ? 'text-green-400' : 'text-red-400'}>
                      {restaurant.hours[0].is_open_now ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                )}
              </div>

              {restaurant.price && (
                <div className="mt-4 flex items-center gap-2 text-green-400">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatPrice(restaurant.price)}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showDetails && selectedRestaurant && (
        <RestaurantDetails
          restaurant={selectedRestaurant}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}