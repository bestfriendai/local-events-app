import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { searchLocations, Suggestion } from '../services/mapbox';
import useDebounce from '../hooks/useDebounce';
import { useGeolocation } from '../hooks/useGeolocation';

interface LocationSearchProps {
  onLocationChange: (location: { latitude: number; longitude: number } | null) => void;
  currentLocation: { latitude: number; longitude: number } | null;
}

export default function LocationSearch({ onLocationChange, currentLocation }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const { location, loading: locationLoading, getLocation } = useGeolocation();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2 || isUsingCurrentLocation) {
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
  }, [debouncedSearchTerm, isUsingCurrentLocation]);

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
    if (location && !location.error && isUsingCurrentLocation) {
      onLocationChange(location);
      setSearchTerm('Current Location');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [location, onLocationChange, isUsingCurrentLocation]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchTerm(suggestion.place_name);
    setShowSuggestions(false);
    setIsUsingCurrentLocation(false);
    onLocationChange({
      latitude: suggestion.center[1],
      longitude: suggestion.center[0]
    });
  };

  const handleCurrentLocation = () => {
    if (currentLocation) {
      onLocationChange(null);
      setSearchTerm('');
      setIsUsingCurrentLocation(false);
    } else {
      setIsUsingCurrentLocation(true);
      getLocation();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsUsingCurrentLocation(false);
    if (e.target.value.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleClearLocation = () => {
    setSearchTerm('');
    setIsUsingCurrentLocation(false);
    onLocationChange(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchContainerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Enter location..."
            className="w-full bg-zinc-800 text-white pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            autoComplete="off"
          />
          {searchTerm && (
            <button
              onClick={handleClearLocation}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <button
          onClick={handleCurrentLocation}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentLocation || isUsingCurrentLocation
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
          <span className="hidden sm:inline">Current Location</span>
        </button>
      </div>

      {showSuggestions && !isUsingCurrentLocation && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50">
          {isLoadingSuggestions ? (
            <div className="p-4 text-center text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              <p className="mt-2 text-sm">Loading suggestions...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-zinc-800 text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                    <span>{suggestion.place_name}</span>
                  </div>
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
  );
}