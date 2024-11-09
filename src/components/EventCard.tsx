import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{event.title}</h3>
        {event.distance && (
          <span className="text-sm text-gray-500">{event.distance.toFixed(1)} mi</span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{event.date}, {event.time}</span>
        </div>
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{event.location.address}</span>
        </div>
      </div>
    </div>
  );
}