import React, { useState } from 'react';
import { RestaurantFilter } from '../types/restaurant';
import { DollarSign, Star, MapPin, Clock } from 'lucide-react';

interface RestaurantFilterPanelProps {
  onFilterChange: (filters: RestaurantFilter) => void;
}

const CATEGORIES = [
  { value: 'japanese', label: 'Japanese' },
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'american', label: 'American' },
  { value: 'thai', label: 'Thai' },
  { value: 'indian', label: 'Indian' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'korean', label: 'Korean' }
];

const PRICE_LEVELS = [
  { value: '1', label: '$' },
  { value: '2', label: '$$' },
  { value: '3', label: '$$$' },
  { value: '4', label: '$$$$' }
];

export default function RestaurantFilterPanel({ onFilterChange }: RestaurantFilterPanelProps) {
  const [filters, setFilters] = useState<RestaurantFilter>({
    categories: [],
    price: [],
    rating: 0,
    distance: 30,
    openNow: false
  });

  const handleFilterChange = (key: keyof RestaurantFilter, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleArrayFilterToggle = (key: keyof RestaurantFilter, value: string) => {
    const currentValues = filters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    handleFilterChange(key, newValues);
  };

  return (
    <div className="bg-zinc-900/95 backdrop-blur-lg p-6 rounded-xl border border-zinc-800 shadow-xl space-y-6">
      {/* Categories */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Cuisine Types
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(category => (
            <button
              key={category.value}
              onClick={() => handleArrayFilterToggle('categories', category.value)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filters.categories.includes(category.value)
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Price Range
        </label>
        <div className="flex gap-2">
          {PRICE_LEVELS.map(price => (
            <button
              key={price.value}
              onClick={() => handleArrayFilterToggle('price', price.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filters.price.includes(price.value)
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {price.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <Star className="h-4 w-4" />
          Minimum Rating
        </label>
        <div className="flex gap-2">
          {[0, 3, 3.5, 4, 4.5].map(rating => (
            <button
              key={rating}
              onClick={() => handleFilterChange('rating', rating)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filters.rating === rating
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {rating === 0 ? 'Any' : `${rating}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Distance */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Distance: {filters.distance} miles
        </label>
        <input
          type="range"
          min="1"
          max="50"
          value={filters.distance}
          onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 mile</span>
          <span>50 miles</span>
        </div>
      </div>

      {/* Open Now Toggle */}
      <div>
        <button
          onClick={() => handleFilterChange('openNow', !filters.openNow)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
            filters.openNow
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          Open Now
        </button>
      </div>
    </div>
  );
}