import React, { useEffect, useRef, useCallback } from 'react';
import { Restaurant } from '../types/restaurant';
import { Star, MapPin, Clock, DollarSign, Loader2 } from 'lucide-react';

interface RestaurantListProps {
  restaurants: Restaurant[];
  onRestaurantSelect: (restaurant: Restaurant) => void;
  isLoading: boolean;
  selectedRestaurant: Restaurant | null;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

export default function RestaurantList({
  restaurants,
  onRestaurantSelect,
  isLoading,
  selectedRestaurant,
  hasMore,
  onLoadMore,
  isLoadingMore
}: RestaurantListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-zinc-800 h-48 rounded-lg mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
              <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <MapPin className="w-12 h-12 text-zinc-600 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No restaurants found</h3>
        <p className="text-zinc-400">Try adjusting your filters or search in a different area</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          onClick={() => onRestaurantSelect(restaurant)}
          className={`p-4 cursor-pointer transition-all hover:bg-zinc-800/50 ${
            selectedRestaurant?.id === restaurant.id ? 'bg-zinc-800' : ''
          }`}
        >
          <div className="flex gap-4">
            <div className="w-24 h-24 flex-shrink-0">
              <img
                src={restaurant.image_url}
                alt={restaurant.name}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';
                }}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-white truncate pr-4">
                  {restaurant.name}
                </h3>
                {restaurant.distance && (
                  <span className="text-sm text-zinc-400">
                    {(restaurant.distance / 1609.34).toFixed(1)} mi
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium text-white">{restaurant.rating}</span>
                </div>
                <span className="text-zinc-400 text-sm">
                  ({restaurant.review_count} reviews)
                </span>
                {restaurant.price && (
                  <>
                    <span className="text-zinc-400">•</span>
                    <span className="text-green-400">{restaurant.price}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                {restaurant.categories.map((category, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded-full"
                  >
                    {category.title}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <MapPin className="w-4 h-4" />
                <span className="truncate">
                  {restaurant.location.display_address.join(', ')}
                </span>
              </div>

              {restaurant.hours?.[0] && (
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Clock className="w-4 h-4" />
                  <span className={restaurant.hours[0].is_open_now ? 'text-green-400' : 'text-red-400'}>
                    {restaurant.hours[0].is_open_now ? 'Open Now' : 'Closed'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Infinite Scroll Observer */}
      <div ref={observerTarget} className="h-4 w-full">
        {isLoadingMore && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        )}
      </div>
    </div>
  );
}