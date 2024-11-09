import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isToday, isThisWeek, isThisMonth, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined, preset?: string) => void;
}

const presets = [
  { label: 'Today', value: 'today', getDate: () => new Date() },
  { label: 'Tomorrow', value: 'tomorrow', getDate: () => addDays(new Date(), 1) },
  { label: 'This Weekend', value: 'weekend', getDate: () => {
    const today = new Date();
    const saturday = addDays(startOfWeek(today), 6);
    return saturday;
  }},
  { label: 'Next Week', value: 'week', getDate: () => addDays(new Date(), 7) },
  { label: 'Next Month', value: 'month', getDate: () => addDays(new Date(), 30) },
];

export default function DatePicker({ selectedDate, onSelect }: DatePickerProps) {
  const handlePresetClick = (preset: string) => {
    const presetConfig = presets.find(p => p.value === preset);
    if (presetConfig) {
      const date = presetConfig.getDate();
      onSelect(date, preset);
    }
  };

  const getPresetClassName = (preset: string): string => {
    if (!selectedDate) return '';
    const today = new Date();

    switch (preset) {
      case 'today':
        return isToday(selectedDate) ? 'bg-blue-500 text-white' : '';
      case 'tomorrow':
        return format(selectedDate, 'yyyy-MM-dd') === format(addDays(today, 1), 'yyyy-MM-dd') 
          ? 'bg-blue-500 text-white' 
          : '';
      case 'weekend': {
        const saturday = addDays(startOfWeek(today), 6);
        const sunday = addDays(saturday, 1);
        const selectedDay = new Date(selectedDate);
        return (format(selectedDay, 'yyyy-MM-dd') === format(saturday, 'yyyy-MM-dd') ||
                format(selectedDay, 'yyyy-MM-dd') === format(sunday, 'yyyy-MM-dd'))
          ? 'bg-blue-500 text-white'
          : '';
      }
      case 'week':
        return isThisWeek(selectedDate) ? 'bg-blue-500 text-white' : '';
      case 'month':
        return isThisMonth(selectedDate) ? 'bg-blue-500 text-white' : '';
      default:
        return '';
    }
  };

  const footer = (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <p className="text-sm text-zinc-400 text-center">
        {selectedDate ? (
          <>Selected: {format(selectedDate, 'PPP')}</>
        ) : (
          'Please pick a date'
        )}
      </p>
    </div>
  );

  return (
    <div className="bg-zinc-900/95 backdrop-blur-lg border border-zinc-800 rounded-xl overflow-hidden shadow-xl p-4 w-[340px]">
      <div className="flex gap-2 mb-4 flex-wrap">
        {presets.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handlePresetClick(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              getPresetClassName(value) || 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => onSelect(date, date ? format(date, 'yyyy-MM-dd') : undefined)}
        modifiers={{
          today: new Date(),
        }}
        modifiersStyles={{
          today: {
            fontWeight: 'bold',
            color: '#3b82f6',
          },
          selected: {
            backgroundColor: '#3b82f6',
            color: 'white',
          }
        }}
        className="!bg-transparent rdp-custom"
        classNames={{
          months: "flex flex-col",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center text-white",
          caption_label: "text-sm font-medium",
          nav: "flex items-center",
          nav_button: "h-7 w-7 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell: "text-zinc-400 rounded-md w-9 font-normal text-[0.8rem] flex-1",
          row: "flex w-full mt-2",
          cell: "text-sm relative p-0 flex-1",
          day: "h-9 w-9 p-0 font-normal text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center",
          day_selected: "bg-blue-500 hover:bg-blue-600 text-white",
          day_today: "text-blue-500 font-semibold",
          day_outside: "text-zinc-600",
          day_disabled: "text-zinc-600",
          day_hidden: "invisible",
        }}
        showOutsideDays={true}
        fromDate={new Date()}
        footer={footer}
      />
    </div>
  );
}