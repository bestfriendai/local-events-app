import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Loader2, Send, Calendar, MapPin, Clock, Menu, Bookmark, BookmarkCheck, X } from 'lucide-react';
import MapView from '../components/Map';
import Header from '../components/Header';
import { Event } from '../types';
import { AIManager } from '../services/ai-manager';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Message } from '../types/chat';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import { useLocation } from '../hooks/useLocation';

const INITIAL_MESSAGE = {
  id: '1',
  role: 'assistant',
  content: `Hi! I'm your AI date planner. I can help you find events, restaurants, and activities for the perfect date. 

Some things I can help with:
- Find events and activities nearby
- Suggest restaurants based on cuisine and atmosphere
- Create custom date itineraries
- Provide recommendations based on your preferences

For example, you can ask:
"Find romantic restaurants in downtown"
"What's happening this weekend?"
"Plan a fun first date"
"Suggest outdoor activities for two"

What kind of experience are you looking for?`
};

const TYPING_INDICATORS = [
  "Searching for the perfect recommendations...",
  "Analyzing local events and venues...",
  "Crafting personalized suggestions...",
  "Finding the best options for you..."
];

const aiManager = new AIManager();

export default function ChatPage() {
  const { currentUser } = useAuth();
  const { location: userLocation } = useLocation();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [typingIndicator, setTypingIndicator] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      const loadSavedEvents = async () => {
        try {
          const savedIds = new Set<string>();
          for (const event of events) {
            const savedRef = doc(db, 'savedEvents', `${currentUser.uid}-${event.id}`);
            const savedDoc = await getDoc(savedRef);
            if (savedDoc.exists()) {
              savedIds.add(event.id);
            }
          }
          setSavedEvents(savedIds);
        } catch (error) {
          console.error('Error loading saved events:', error);
          setError('Failed to load saved events. Please try again.');
        }
      };
      loadSavedEvents();
    }
  }, [currentUser, events]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateTypingIndicator = () => {
    const index = Math.floor(Math.random() * TYPING_INDICATORS.length);
    setTypingIndicator(TYPING_INDICATORS[index]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const messageId = Date.now().toString();
    setInput('');
    
    // Add location context to the message if available
    const locationContext = userLocation 
      ? `\n\nContext: User is located at coordinates (${userLocation.latitude}, ${userLocation.longitude})`
      : '';
    
    const fullMessage = userMessage + locationContext;

    setMessages(prev => [...prev, { id: messageId, role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);
    updateTypingIndicator();

    const typingInterval = setInterval(updateTypingIndicator, 3000);

    try {
      const response = await aiManager.getCompletion([
        ...messages,
        { id: messageId, role: 'user', content: fullMessage }
      ]);

      const newMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        events: response.events
      };

      setMessages(prev => [...prev, newMessage]);

      if (response.events && response.events.length > 0) {
        setEvents(prev => {
          // Filter out duplicates based on event ID
          const existingIds = new Set(prev.map(e => e.id));
          const newEvents = response.events.filter(e => !existingIds.has(e.id));
          return [...prev, ...newEvents];
        });
        setSuccess('Found some great options for you!');
      }

      // Log completion statistics if available
      if (response.usage) {
        console.log('AI Response Stats:', {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: "I apologize, but I'm having trouble processing your request. Please try asking in a different way or try again later."
      }]);
    } finally {
      setIsLoading(false);
      setTypingIndicator('');
      clearInterval(typingInterval);
      chatInputRef.current?.focus();
    }
  };

  const toggleSaveEvent = async (event: Event) => {
    if (!currentUser) {
      setError('Please sign in to save events');
      return;
    }

    const eventId = event.id;
    const savedRef = doc(db, 'savedEvents', `${currentUser.uid}-${eventId}`);

    try {
      if (savedEvents.has(eventId)) {
        await deleteDoc(savedRef);
        setSavedEvents(prev => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        setSuccess('Event removed from saved items');
      } else {
        await setDoc(savedRef, {
          ...event,
          userId: currentUser.uid,
          savedAt: new Date().toISOString()
        });
        setSavedEvents(prev => new Set([...prev, eventId]));
        setSuccess('Event saved successfully');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      setError('Failed to save event. Please try again.');
    }
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setShowChat(false);
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black">
      <Header />
      
      <div className="h-[calc(100vh-64px)] w-full mt-16 flex relative">
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="md:hidden fixed top-20 left-4 z-50 bg-blue-500 text-white p-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
        >
          {showChat ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Chat Panel */}
        <div className={`
          fixed md:relative w-full md:w-[450px] h-[calc(100vh-64px)]
          transition-transform duration-300 ease-in-out
          ${showChat ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          bg-black border-r border-zinc-800 z-40 md:z-auto
          flex flex-col
        `}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {error && (
              <ErrorMessage 
                message={error} 
                onDismiss={() => setError(null)} 
              />
            )}
            
            {success && (
              <SuccessMessage 
                message={success} 
                onDismiss={() => setSuccess(null)} 
              />
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === 'assistant' ? 'text-blue-400' : 'text-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  message.role === 'assistant' ? 'bg-blue-500/10' : 'bg-zinc-800'
                }`}>
                  {message.role === 'assistant' ? (
                    <Bot className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className={`flex-1 space-y-4 ${
                  message.role === 'assistant' ? 'text-blue-400' : 'text-white'
                }`}>
                  <div className={`p-4 rounded-lg ${
                    message.role === 'assistant' ? 'bg-blue-500/10' : 'bg-zinc-800'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.events && message.events.length > 0 && (
                    <div className="grid gap-3">
                      {message.events.map((event) => (
                        <div
                          key={event.id}
                          className="bg-zinc-900/50 p-4 rounded-lg hover:bg-zinc-800 transition-all border border-zinc-800/50"
                        >
                          {event.imageUrl && (
                            <img 
                              src={event.imageUrl} 
                              alt={event.title}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          )}
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleEventSelect(event)}>
                              {event.title}
                            </h3>
                            {currentUser && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveEvent(event);
                                }}
                                className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
                              >
                                {savedEvents.has(event.id) ? (
                                  <BookmarkCheck className="w-5 h-5 text-blue-400" />
                                ) : (
                                  <Bookmark className="w-5 h-5 text-zinc-400" />
                                )}
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleEventSelect(event)}>
                                {event.location.address}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-blue-400">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1 p-4 rounded-lg bg-blue-500/10">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{typingIndicator}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
            <div className="flex gap-2">
              <input
                ref={chatInputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about date ideas..."
                className="flex-1 bg-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
        
        {/* Map View */}
        <div className="flex-1 relative">
          <MapView 
            events={events}
            onEventSelect={handleEventSelect}
            userLocation={userLocation}
            selectedEvent={selectedEvent}
          />
        </div>

        {/* Mobile Overlay */}
        {showChat && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            onClick={() => setShowChat(false)}
          />
        )}
      </div>
    </div>
  );
}