import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { Filter } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { searchLocations, Suggestion } from '../services/mapbox';
import useDebounce from '../hooks/useDebounce';

interface SearchBarProps {
  onFilterChange: (filters: Filter) => void;
  onLocationChange?: (location: { latitude: number; longitude: number } | null) => void;
  onSearch: (term: string) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onFilterChange, onLocationChange, onSearch, isLoading }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { location, loading: locationLoading, getLocation } = useGeolocation();
  const [isNearbyActive, setIsNearbyActive] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2 || isNearbyActive) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const results = await searchLocations(debouncedSearchTerm);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm, isNearbyActive]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (location && !location.error && isNearbyActive) {
      onLocationChange?.(location);
      setSearchTerm('Current Location');
    }
  }, [location, onLocationChange, isNearbyActive]);

  const handleNearbyClick = async () => {
    if (isNearbyActive) {
      setIsNearbyActive(false);
      onLocationChange?.(null);
      setSearchTerm('');
      return;
    }

    setIsNearbyActive(true);
    getLocation();
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchTerm(suggestion.place_name);
    setShowSuggestions(false);
    onLocationChange?.({
      latitude: suggestion.center[1],
      longitude: suggestion.center[0]
    });
    onSearch(suggestion.place_name);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      const firstSuggestion = suggestions[0];
      handleSuggestionClick(firstSuggestion);
    }
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationChange?.(null);
    setIsNearbyActive(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsNearbyActive(false);
    if (value.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2 && !isNearbyActive) {
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={searchContainerRef} className="relative flex flex-col sm:flex-row gap-2 sm:gap-3">
      <div className="flex-1 bg-black/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-zinc-800/50 transition-all hover:border-zinc-700/50">
        <form onSubmit={handleSearchSubmit} className="flex items-center px-3 sm:px-6 h-12 sm:h-16">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search for location..."
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="flex-1 bg-transparent border-none text-white px-2 sm:px-4 py-2 placeholder-zinc-500 focus:outline-none text-base sm:text-lg transition-colors"
            autoComplete="off"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-zinc-800/50 transition-all"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
          <div className="flex items-center gap-2 sm:gap-4 border-l border-zinc-800/50 pl-2 sm:pl-4">
            <button 
              type="button"
              onClick={handleNearbyClick}
              className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 rounded-lg transition-all ${
                isNearbyActive 
                  ? 'text-blue-400 hover:text-blue-300 bg-blue-500/10' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="text-xs sm:text-sm hidden sm:inline">
                {locationLoading ? 'Locating...' : 'Nearby'}
              </span>
            </button>
          </div>
        </form>

        {showSuggestions && !isNearbyActive && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-black/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl overflow-hidden shadow-2xl z-50">
            {isLoadingSuggestions ? (
              <div className="p-4 text-center text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                <p className="mt-2 text-sm">Loading suggestions...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-800/50 text-white transition-all flex items-center gap-3 group"
                  >
                    <MapPin className="h-4 w-4 text-zinc-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                    <span className="line-clamp-1 text-sm sm:text-base group-hover:text-blue-400 transition-colors">
                      {suggestion.place_name}
                    </span>
                  </button>
                ))}
              </div>
            ) : searchTerm.length >= 2 ? (
              <div className="p-4 text-center text-zinc-400">
                <p>No locations found</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <button 
        onClick={handleSearchSubmit}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 sm:px-8 h-12 sm:h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:hover:bg-blue-600 disabled:active:scale-100"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
        ) : (
          <Search className="h-5 w-5 sm:h-6 sm:w-6" />
        )}
      </button>
    </div>
  );
}