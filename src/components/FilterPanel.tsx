import React, { useState } from 'react';
import { Filter } from '../types';
import { Calendar, DollarSign, Building2 } from 'lucide-react';
import { UNIFIED_CATEGORIES } from '../services/events';

interface FilterPanelProps {
  onFilterChange: (filters: Filter) => void;
}

const CATEGORIES = Object.entries(UNIFIED_CATEGORIES).map(([value, label]) => ({
  value,
  label
}));

const PRICE_RANGES = [
  { value: 'free', label: 'Free' },
  { value: '0-25', label: 'Under $25' },
  { value: '25-50', label: '$25-$50' },
  { value: '50-100', label: '$50-$100' },
  { value: '100+', label: '$100+' },
];

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'weekend', label: 'This Weekend' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<Filter>({
    category: 'all',
    date: 'all',
    distance: 30,
    priceRange: []
  });

  const handleFilterChange = (key: keyof Filter, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleArrayFilterToggle = (key: keyof Filter, value: string) => {
    const currentValues = filters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    handleFilterChange(key, newValues);
  };

  return (
    <div className="bg-zinc-900/95 backdrop-blur-lg p-6 rounded-xl border border-zinc-800 shadow-xl space-y-6 text-white">
      {/* Categories */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Category
        </label>
        <select
          className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          {CATEGORIES.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Ranges */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date Range
        </label>
        <div className="flex flex-wrap gap-2">
          {DATE_RANGES.map(range => (
            <button
              key={range.value}
              onClick={() => handleFilterChange('date', range.value)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filters.date === range.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Ranges */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Price Range
        </label>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map(price => (
            <button
              key={price.value}
              onClick={() => handleArrayFilterToggle('priceRange', price.value)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filters.priceRange.includes(price.value)
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {price.label}
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
    </div>
  );
}