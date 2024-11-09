import React from 'react';
import { RecommendationType } from '../services/recommendations';
import { Utensils, Landmark, Activity, Music, PaintBrush } from 'lucide-react';

interface RecommendationFiltersProps {
  selectedType: RecommendationType;
  onTypeChange: (type: RecommendationType) => void;
  preferences: string[];
  onPreferencesChange: (preferences: string[]) => void;
}

const RECOMMENDATION_TYPES: { value: RecommendationType; label: string; icon: React.ReactNode }[] = [
  { value: 'restaurants', label: 'Restaurants', icon: <Utensils className="w-4 h-4" /> },
  { value: 'attractions', label: 'Attractions', icon: <Landmark className="w-4 h-4" /> },
  { value: 'activities', label: 'Activities', icon: <Activity className="w-4 h-4" /> },
  { value: 'nightlife', label: 'Nightlife', icon: <Music className="w-4 h-4" /> },
  { value: 'cultural', label: 'Cultural', icon: <PaintBrush className="w-4 h-4" /> }
];

const PREFERENCES = [
  'Family-friendly',
  'Romantic',
  'Budget-friendly',
  'Luxury',
  'Outdoor',
  'Indoor',
  'Popular',
  'Hidden Gems'
];

export default function RecommendationFilters({
  selectedType,
  onTypeChange,
  preferences,
  onPreferencesChange
}: RecommendationFiltersProps) {
  const handlePreferenceToggle = (preference: string) => {
    if (preferences.includes(preference)) {
      onPreferencesChange(preferences.filter(p => p !== preference));
    } else {
      onPreferencesChange([...preferences, preference]);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Type</h3>
        <div className="flex flex-wrap gap-2">
          {RECOMMENDATION_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => onTypeChange(type.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedType === type.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {type.icon}
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Preferences</h3>
        <div className="flex flex-wrap gap-2">
          {PREFERENCES.map(preference => (
            <button
              key={preference}
              onClick={() => handlePreferenceToggle(preference)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                preferences.includes(preference)
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {preference}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}