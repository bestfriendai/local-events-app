import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
}

export default function SuccessMessage({ message, onDismiss }: SuccessMessageProps) {
  return (
    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-green-500 text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-500 hover:text-green-400 transition-colors p-1 rounded-lg hover:bg-green-500/10"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}