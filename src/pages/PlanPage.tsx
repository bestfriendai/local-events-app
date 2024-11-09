import React, { useState, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import MapView from '../components/Map';
import PlanSearchForm from '../components/PlanSearchForm';
import TimelineView from '../components/TimelineView';
import { Event } from '../types';
import { generateDatePlan } from '../services/date-planner';
import { Share2, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';

interface SavedItinerary {
  id: string;
  events: Event[];
  date: string;
  startTime: string;
  duration: number;
  budget: number;
  travelTimes: number[];
  totalCost: number;
}

export default function PlanPage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState('18:00');
  const [duration, setDuration] = useState(4);
  const [budget, setBudget] = useState(100);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [travelTimes, setTravelTimes] = useState<number[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [step, setStep] = useState<'search' | 'results'>('search');

  const generateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !selectedDate) {
      setError('Please select a location and date');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const plan = await generateDatePlan({
        date: selectedDate,
        startTime,
        duration,
        budget,
        location,
        preferences
      });

      setEvents(plan.events);
      setTravelTimes(plan.travelTimes);
      setTotalCost(plan.totalCost);
      setSuccess('Your date plan has been generated!');
      setStep('results');
    } catch (error) {
      console.error('Error generating itinerary:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate itinerary');
    } finally {
      setIsLoading(false);
    }
  };

  const saveItinerary = async () => {
    if (!currentUser) {
      setError('Please sign in to save your itinerary');
      return;
    }

    if (events.length === 0) {
      setError('No itinerary to save');
      return;
    }

    setIsSaving(true);
    try {
      const itinerary: SavedItinerary = {
        id: `itinerary-${Date.now()}`,
        events,
        date: selectedDate?.toISOString() || '',
        startTime,
        duration,
        budget,
        travelTimes,
        totalCost
      };

      await setDoc(doc(db, 'itineraries', `${currentUser.uid}-${itinerary.id}`), itinerary);
      setSuccess('Itinerary saved successfully!');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      setError('Failed to save itinerary');
    } finally {
      setIsSaving(false);
    }
  };

  const shareItinerary = async () => {
    if (events.length === 0) {
      setError('No itinerary to share');
      return;
    }

    try {
      const shareData = {
        title: 'Date Itinerary',
        text: `Check out this date itinerary for ${selectedDate?.toLocaleDateString()}!`,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
        setSuccess('Itinerary shared successfully!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setSuccess('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing itinerary:', error);
      setError('Failed to share itinerary');
    }
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleBack = () => {
    setStep('search');
    setEvents([]);
    setTravelTimes([]);
    setTotalCost(0);
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black">
      <Header />
      
      <div className="h-[calc(100vh-64px)] w-full mt-16 flex">
        <div className="w-[400px] border-r border-zinc-800 flex flex-col">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Plan Your Date</h1>
              {step === 'results' && (
                <button
                  onClick={handleBack}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  ← Back to Search
                </button>
              )}
            </div>
            
            {error && (
              <div className="mb-4">
                <ErrorMessage 
                  message={error} 
                  onDismiss={() => setError(null)} 
                />
              </div>
            )}

            {success && (
              <div className="mb-4">
                <SuccessMessage 
                  message={success} 
                  onDismiss={() => setSuccess(null)} 
                />
              </div>
            )}

            {step === 'search' ? (
              <PlanSearchForm
                searchTerm=""
                isLoading={isLoading}
                onSearchChange={() => {}}
                onSubmit={generateItinerary}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                startTime={startTime}
                onStartTimeChange={setStartTime}
                duration={duration}
                onDurationChange={setDuration}
                budget={budget}
                onBudgetChange={setBudget}
                location={location}
                onLocationChange={setLocation}
                showDatePicker={showDatePicker}
                onToggleDatePicker={() => setShowDatePicker(!showDatePicker)}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <button
                    onClick={shareItinerary}
                    className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                  {currentUser && (
                    <button
                      onClick={saveItinerary}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Save
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto flex-1">
                  <TimelineView
                    events={events}
                    startTime={startTime}
                    travelTimes={travelTimes}
                    onEventSelect={handleEventSelect}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 relative">
          <MapView 
            events={events}
            onEventSelect={handleEventSelect}
            userLocation={location}
            selectedEvent={selectedEvent}
            showRoutes={events.length > 1}
          />
        </div>
      </div>
    </div>
  );
}