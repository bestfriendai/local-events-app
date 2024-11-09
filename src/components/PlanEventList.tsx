import React from 'react';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import { Event } from '../types';

interface PlanEventListProps {
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
}

export default function PlanEventList({ 
  events, 
  selectedEvent, 
  onEventSelect 
}: PlanEventListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="relative">
          <div
            onClick={() => onEventSelect(event)}
            className={`bg-zinc-900/50 rounded-xl p-4 cursor-pointer hover:bg-zinc-800 transition-all ${
              selectedEvent?.id === event.id ? 'border-2 border-blue-500' : 'border border-zinc-800'
            }`}
          >
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {index + 1}
            </div>

            {event.imageUrl && (
              <img 
                src={event.imageUrl} 
                alt={event.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}

            <h3 className="font-medium text-white mb-2 pl-6">{event.title}</h3>
            
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
          </div>

          {index < events.length - 1 && (
            <div className="flex items-center justify-center py-2">
              <ArrowRight className="w-5 h-5 text-zinc-600" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}