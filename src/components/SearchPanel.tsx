import React, { useState } from 'react';
import { Search, Calendar, MapPin, Filter as FilterIcon } from 'lucide-react';
import { Event, Filter } from '../types';
import EventCard from './EventCard';
import FilterPanel from './FilterPanel';

interface SearchPanelProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
  onFilterChange: (filters: Filter) => void;
}

export default function SearchPanel({ events, onEventSelect, onFilterChange }: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-white p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Find Local Events</h1>
      
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FilterIcon className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <FilterPanel onFilterChange={onFilterChange} />
        )}

        <div className="mt-8">
          <h2 className="font-semibold mb-4">Events Near You</h2>
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event}
                onClick={() => onEventSelect(event)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}