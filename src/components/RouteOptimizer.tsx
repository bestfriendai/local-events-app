import React from 'react';
import { Event } from '../types';
import { MapPin, Clock, Route } from 'lucide-react';

interface RouteOptimizerProps {
  selectedEvents: Event[];
  onReorderEvents: (events: Event[]) => void;
}

export default function RouteOptimizer({ selectedEvents, onReorderEvents }: RouteOptimizerProps) {
  const optimizeRoute = () => {
    // Simple nearest neighbor algorithm
    if (selectedEvents.length <= 2) return;

    const optimizedEvents: Event[] = [selectedEvents[0]];
    const remaining = new Set(selectedEvents.slice(1));

    while (remaining.size > 0) {
      const current = optimizedEvents[optimizedEvents.length - 1];
      let nearest: Event | null = null;
      let minDistance = Infinity;

      for (const event of remaining) {
        const distance = calculateDistance(
          current.location.latitude,
          current.location.longitude,
          event.location.latitude,
          event.location.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearest = event;
        }
      }

      if (nearest) {
        optimizedEvents.push(nearest);
        remaining.delete(nearest);
      }
    }

    onReorderEvents(optimizedEvents);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (degrees: number): number => degrees * (Math.PI / 180);

  const calculateTotalDistance = (): number => {
    let total = 0;
    for (let i = 0; i < selectedEvents.length - 1; i++) {
      total += calculateDistance(
        selectedEvents[i].location.latitude,
        selectedEvents[i].location.longitude,
        selectedEvents[i + 1].location.latitude,
        selectedEvents[i + 1].location.longitude
      );
    }
    return total;
  };

  if (selectedEvents.length < 2) {
    return null;
  }

  return (
    <div className="p-4 border-t border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Route Details</h3>
        <button
          onClick={optimizeRoute}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Route className="w-4 h-4" />
          Optimize Route
        </button>
      </div>

      <div className="space-y-2 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{selectedEvents.length} stops</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Total distance: {calculateTotalDistance().toFixed(1)} miles</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {selectedEvents.map((event, index) => (
          <div
            key={event.id}
            className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded-lg"
          >
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
              {index + 1}
            </div>
            <span className="text-white truncate">{event.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}