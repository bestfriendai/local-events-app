import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { Event } from '../types';
import { Restaurant } from '../types/restaurant';
import { Calendar, MapPin, Clock, Star, DollarSign } from 'lucide-react';

export default function SavedPage() {
  const { currentUser } = useAuth();
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'restaurants'>('events');

  useEffect(() => {
    if (!currentUser) return;

    const fetchSavedItems = async () => {
      // Fetch saved events
      const eventsQuery = query(
        collection(db, 'savedEvents'),
        where('userId', '==', currentUser.uid)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      setSavedEvents(eventsSnapshot.docs.map(doc => doc.data() as Event));

      // Fetch saved restaurants
      const restaurantsQuery = query(
        collection(db, 'savedRestaurants'),
        where('userId', '==', currentUser.uid)
      );
      const restaurantsSnapshot = await getDocs(restaurantsQuery);
      setSavedRestaurants(restaurantsSnapshot.docs.map(doc => doc.data() as Restaurant));
    };

    fetchSavedItems();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold text-white mb-8">Saved Items</h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-blue-500 text-white'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'restaurants'
                ? 'bg-blue-500 text-white'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            Restaurants
          </button>
        </div>

        {activeTab === 'events' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedEvents.map(event => (
              <div key={event.id} className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                {event.imageUrl && (
                  <img 
                    src={event.imageUrl} 
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-medium text-white mb-2">{event.title}</h3>
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
                      <span>{event.location.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRestaurants.map(restaurant => (
              <div key={restaurant.id} className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                {restaurant.image_url && (
                  <img 
                    src={restaurant.image_url} 
                    alt={restaurant.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-medium text-white mb-2">{restaurant.name}</h3>
                  <div className="space-y-2 text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{restaurant.rating} ({restaurant.review_count} reviews)</span>
                    </div>
                    {restaurant.price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{restaurant.price}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{restaurant.location.display_address.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}