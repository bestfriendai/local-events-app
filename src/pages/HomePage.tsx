import React, { useState, useCallback, useEffect } from 'react';
import MapView from '../components/Map';
import SearchBar from '../components/SearchBar';
import { Event, Filter } from '../types';
import { searchAllEvents } from '../services/events';
import Header from '../components/Header';
import FilterPanel from '../components/FilterPanel';
import { useLocation } from '../hooks/useLocation';
import { Search, Filter as FilterIcon, X, MapPin, ChevronLeft, ChevronRight, Calendar, Clock, ArrowUpDown } from 'lucide-react';

type SortOption = 'date' | 'title' | 'distance';

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showEventList, setShowEventList] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { location: userLocation } = useLocation();
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentFilters, setCurrentFilters] = useState<Filter>({
    category: 'all',
    date: 'all',
    distance: 30,
    priceRange: []
  });

  const fetchEvents = useCallback(async () => {
    const location = searchLocation || userLocation;
    if (!location) return;

    setIsLoading(true);
    try {
      const fetchedEvents = await searchAllEvents({
        latitude: location.latitude,
        longitude: location.longitude,
        filters: currentFilters
      });

      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchLocation, userLocation, currentFilters]);

  useEffect(() => {
    if (searchLocation || userLocation) {
      fetchEvents();
    }
  }, [fetchEvents, searchLocation, userLocation]);

  const handleSearch = useCallback((term: string) => {
    console.log('Search term:', term);
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = useCallback((filters: Filter) => {
    setCurrentFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const handleLocationChange = useCallback((location: { latitude: number; longitude: number } | null) => {
    setSearchLocation(location);
  }, []);

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'date':
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * multiplier;
      case 'title':
        return a.title.localeCompare(b.title) * multiplier;
      case 'distance':
        return ((a.distance || Infinity) - (b.distance || Infinity)) * multiplier;
      default:
        return 0;
    }
  });

  const SortButton = ({ option, label }: { option: SortOption; label: string }) => (
    <button
      onClick={() => handleSort(option)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        sortBy === option 
          ? 'bg-blue-500 text-white' 
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
      }`}
    >
      {label}
      {sortBy === option && (
        <ArrowUpDown className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black">
      <Header />
      
      <div className="h-[calc(100vh-64px)] w-full mt-16 flex">
        {/* Event List Panel */}
        <div 
          className={`absolute md:relative z-30 h-full w-full md:w-[400px] bg-black/95 backdrop-blur-xl border-r border-zinc-800 transform transition-transform duration-300 ${
            showEventList ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Events</h1>
                <button
                  onClick={() => setShowEventList(false)}
                  className="md:hidden text-zinc-400 hover:text-white p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                    showFilters 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  {showFilters ? <X className="w-4 h-4" /> : <FilterIcon className="w-4 h-4" />}
                  <span className="text-sm">Filters</span>
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <SortButton option="date" label="Date" />
                <SortButton option="title" label="Name" />
                <SortButton option="distance" label="Distance" />
              </div>

              {showFilters && (
                <div className="mt-4">
                  <FilterPanel onFilterChange={handleFilterChange} />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : sortedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MapPin className="w-12 h-12 text-zinc-600 mb-4" />
                  <p className="text-zinc-400">No events found. Try adjusting your filters or search in a different area.</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {sortedEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`group bg-zinc-900/50 rounded-xl p-4 cursor-pointer hover:bg-zinc-800 transition-all border ${
                        selectedEvent?.id === event.id ? 'border-blue-500' : 'border-zinc-800/50'
                      }`}
                    >
                      {event.imageUrl && (
                        <div className="relative rounded-lg overflow-hidden mb-3">
                          <img 
                            src={event.imageUrl} 
                            alt={event.title}
                            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      )}
                      
                      <div className="flex gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                          {event.category}
                        </span>
                        {event.subcategory !== 'Various' && (
                          <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                            {event.subcategory}
                          </span>
                        )}
                      </div>

                      <h3 className="font-medium text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-2 text-sm text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{event.location.address}</span>
                        </div>
                      </div>

                      {event.distance && (
                        <div className="mt-3 pt-3 border-t border-zinc-800/50 text-sm text-zinc-500">
                          {event.distance.toFixed(1)} miles away
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1">
          <MapView 
            events={events}
            onEventSelect={setSelectedEvent}
            userLocation={userLocation}
            selectedEvent={selectedEvent}
            isLoadingEvents={isLoading}
          />

          {/* Mobile Toggle Button */}
          <button
            onClick={() => setShowEventList(!showEventList)}
            className="md:hidden absolute top-4 left-4 z-20 bg-black/90 text-white p-2 rounded-lg shadow-lg hover:bg-black transition-colors"
          >
            {showEventList ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          {/* Results Count */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-black/95 backdrop-blur-xl px-6 py-3 rounded-full border border-zinc-800/50 shadow-xl">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">
                  {events.length} {events.length === 1 ? 'event' : 'events'} found
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
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