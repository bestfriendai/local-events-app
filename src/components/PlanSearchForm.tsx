import React from 'react';
import { Search, Calendar, Clock, DollarSign } from 'lucide-react';
import DatePicker from './DatePicker';
import LocationSearch from './LocationSearch';
import { format } from 'date-fns';

interface PlanSearchFormProps {
  searchTerm: string;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  budget: number;
  onBudgetChange: (budget: number) => void;
  location: { latitude: number; longitude: number } | null;
  onLocationChange: (location: { latitude: number; longitude: number } | null) => void;
  showDatePicker: boolean;
  onToggleDatePicker: () => void;
}

export default function PlanSearchForm({
  searchTerm,
  isLoading,
  onSearchChange,
  onSubmit,
  selectedDate,
  onDateSelect,
  startTime,
  onStartTimeChange,
  duration,
  onDurationChange,
  budget,
  onBudgetChange,
  location,
  onLocationChange,
  showDatePicker,
  onToggleDatePicker
}: PlanSearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <LocationSearch
        onLocationChange={onLocationChange}
        currentLocation={location}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={onToggleDatePicker}
            className="w-full flex items-center gap-2 bg-zinc-800 text-white px-4 py-3 rounded-lg hover:bg-zinc-700 transition-colors text-left"
          >
            <Calendar className="h-5 w-5 text-zinc-400" />
            <span className="flex-1 truncate">
              {selectedDate ? format(selectedDate, 'PPP') : 'Select Date'}
            </span>
          </button>
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 z-50">
              <DatePicker
                selectedDate={selectedDate}
                onSelect={(date) => {
                  onDateSelect(date);
                  onToggleDatePicker();
                }}
              />
            </div>
          )}
        </div>

        <div className="relative">
          <div className="relative">
            <Clock className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400 pointer-events-none" />
            <select
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-full bg-zinc-800 text-white pl-12 pr-4 py-3 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {Array.from({ length: 48 }, (_, i) => {
                const hour = Math.floor(i / 2);
                const minute = i % 2 === 0 ? '00' : '30';
                const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                return (
                  <option key={time} value={time}>
                    {time}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm text-zinc-400">
          <span>Duration</span>
          <span>{duration} hours</span>
        </label>
        <input
          type="range"
          min="2"
          max="12"
          step="0.5"
          value={duration}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>2h</span>
          <span>12h</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm text-zinc-400">
          <span>Budget</span>
          <span>${budget}</span>
        </label>
        <input
          type="range"
          min="20"
          max="500"
          step="10"
          value={budget}
          onChange={(e) => onBudgetChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>$20</span>
          <span>$500</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !location || !selectedDate}
        className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Planning Your Date...</span>
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            <span>Generate Date Plan</span>
          </>
        )}
      </button>
    </form>
  );
}