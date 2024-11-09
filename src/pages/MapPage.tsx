import React, { useState, useCallback, useEffect } from 'react';
import MapView from '../components/Map';
import Header from '../components/Header';
import RecommendationFilters from '../components/RecommendationFilters';
import RouteOptimizer from '../components/RouteOptimizer';
import { Event } from '../types';
import { RecommendationType, getAIRecommendations } from '../services/recommendations';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Menu, X, Filter, Route as RouteIcon } from 'lucide-react';

export default function MapPage() {
  const { location: userLocation } = useLocation();
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [selectedType, setSelectedType] = useState<RecommendationType>('restaurants');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const [savedLocations, setSavedLocations] = useState<Set<string>>(new Set());

  const fetchRecommendations = useCallback(async () => {
    if (!userLocation) return;

    setIsLoading(true);
    try {
      const response = await getAIRecommendations({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        type: selectedType,
        radius: 10,
        preferences
      });

      if (response.events) {
        setRecommendations(response.events);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, selectedType, preferences]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    if (currentUser) {
      const loadSavedLocations = async () => {
        try {
          const savedIds = new Set<string>();
          for (const event of recommendations) {
            const savedRef = doc(db, 'savedLocations', `${currentUser.uid}-${event.id}`);
            const savedDoc = await getDoc(savedRef);
            if (savedDoc.exists()) {
              savedIds.add(event.id);
            }
          }
          setSavedLocations(savedIds);
        } catch (error) {
          console.error('Error loading saved locations:', error);
        }
      };
      loadSavedLocations();
    }
  }, [currentUser, recommendations]);

  const toggleSaveLocation = async (event: Event) => {
    if (!currentUser) return;

    const locationId = event.id;
    const savedRef = doc(db, 'savedLocations', `${currentUser.uid}-${locationId}`);

    try {
      if (savedLocations.has(locationId)) {
        await deleteDoc(savedRef);
        setSavedLocations(prev => {
          const next = new Set(prev);
          next.delete(locationId);
          return next;
        });
      } else {
        await setDoc(savedRef, {
          ...event,
          userId: currentUser.uid,
          savedAt: new Date().toISOString()
        });
        setSavedLocations(prev => new Set([...prev, locationId]));
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvents(prev => {
      const isSelected = prev.some(e => e.id === event.id);
      if (isSelected) {
        return prev.filter(e => e.id !== event.id);
      } else {
        return [...prev, event];
      }
    });
  };

  const handleReorderEvents = (reorderedEvents: Event[]) => {
    setSelectedEvents(reorderedEvents);
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black">
      <Header />
      
      <div className="h-[calc(100vh-64px)] w-full mt-16 flex relative">
        {/* Mobile Toggle Buttons */}
        <div className="md:hidden fixed top-20 left-4 z-50 flex gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="bg-blue-500 text-white p-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
          >
            {showSidebar ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
          </button>
          {selectedEvents.length > 1 && (
            <button
              onClick={() => setShowRouteOptimizer(!showRouteOptimizer)}
              className="bg-blue-500 text-white p-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
            >
              <RouteIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sidebar */}
        <div
          className={`fixed md:relative z-40 w-full md:w-[400px] h-full bg-black/95 backdrop-blur-xl border-r border-zinc-800 transform transition-transform duration-300 ${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            <RecommendationFilters
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              preferences={preferences}
              onPreferencesChange={setPreferences}
            />

            {selectedEvents.length > 1 && (
              <RouteOptimizer
                selectedEvents={selectedEvents}
                onReorderEvents={handleReorderEvents}
              />
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            events={recommendations}
            onEventSelect={handleEventSelect}
            userLocation={userLocation}
            selectedEvent={selectedEvents[selectedEvents.length - 1]}
            showRoutes={selectedEvents.length > 1}
          />
        </div>

        {/* Mobile Overlay */}
        {showSidebar && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </div>
    </div>
  );
}