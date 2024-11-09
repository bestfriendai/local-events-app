import React from 'react';
import { Event } from '../types';
import { Clock, MapPin, DollarSign, Star, ArrowDown } from 'lucide-react';
import { format, addMinutes } from 'date-fns';

interface TimelineViewProps {
  events: Event[];
  startTime: string;
  travelTimes: number[];
  onEventSelect: (event: Event) => void;
}

export default function TimelineView({
  events,
  startTime,
  travelTimes,
  onEventSelect
}: TimelineViewProps) {
  const getEventTime = (index: number): string => {
    if (index === 0) return startTime;
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const baseDate = new Date();
    baseDate.setHours(hours, minutes, 0);
    
    let totalMinutes = 0;
    for (let i = 0; i < index; i++) {
      totalMinutes += 90; // Event duration
      if (i < travelTimes.length) {
        totalMinutes += travelTimes[i];
      }
    }
    
    const eventTime = addMinutes(baseDate, totalMinutes);
    return format(eventTime, 'HH:mm');
  };

  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <div key={event.id}>
          <div
            onClick={() => onEventSelect(event)}
            className="group bg-zinc-900/50 rounded-xl p-5 cursor-pointer hover:bg-zinc-800/80 transition-all duration-300 border border-zinc-800/50 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{getEventTime(index)}</span>
                </div>
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {event.title}
                </h3>
              </div>
            </div>

            {event.imageUrl && (
              <div className="relative rounded-lg overflow-hidden mb-4">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-40 object-cover transform transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-300 transition-colors">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm line-clamp-1">{event.location.address}</span>
              </div>
              {event.priceRange && (
                <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  <DollarSign className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{event.priceRange}</span>
                </div>
              )}
              {event.venue.rating && (
                <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  <Star className="w-4 h-4 flex-shrink-0 text-yellow-400" />
                  <span className="text-sm">{event.venue.rating} / 5</span>
                </div>
              )}
            </div>
          </div>

          {index < events.length - 1 && (
            <div className="flex items-center gap-3 py-4 px-6">
              <div className="flex-1 border-b border-dashed border-zinc-800" />
              <div className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm">
                {travelTimes[index]} min
              </div>
              <div className="flex-1 border-b border-dashed border-zinc-800" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}