import React, { useState, useCallback, memo, useEffect, useMemo, useRef } from 'react';
import Map, { NavigationControl, Marker, Popup, ViewState, Source, Layer, MapRef } from 'react-map-gl';
import { MapPin, Calendar, Clock, Ticket, MapPinOff, Users, ChevronLeft, ChevronRight, Maximize, Minimize, Star, DollarSign, ExternalLink } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Event } from '../types';

const EVENT_ICONS: Record<string, string> = {
  'live-music': '🎵',
  'comedy': '🎭',
  'sports-games': '⚽',
  'performing-arts': '🎪',
  'food-drink': '🍽️',
  'cultural': '🏛️',
  'social': '👥',
  'educational': '📚',
  'outdoor': '🌲',
  'special': '✨'
};

interface MapViewProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
  userLocation: { latitude: number; longitude: number } | null;
  selectedEvent: Event | null;
  showRoutes?: boolean;
  isLoadingEvents?: boolean;
}

const MARKERS_PER_BATCH = 50;
const BATCH_LOAD_DELAY = 100;

const MapView = memo(({ events, onEventSelect, userLocation, selectedEvent, showRoutes, isLoadingEvents }: MapViewProps) => {
  const [popupEvent, setPopupEvent] = useState<Event | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleMarkers, setVisibleMarkers] = useState<Event[]>([]);
  const [viewState, setViewState] = useState<ViewState>({
    longitude: userLocation?.longitude || -77.0369,
    latitude: userLocation?.latitude || 38.9072,
    zoom: 12,
    bearing: 0,
    pitch: 45,
    padding: { top: 0, bottom: 0, left: 0, right: 0 }
  });
  
  const mapRef = useRef<MapRef>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  // Load markers in batches
  useEffect(() => {
    let currentIndex = 0;

    const loadNextBatch = () => {
      const nextBatch = events.slice(
        currentIndex,
        currentIndex + MARKERS_PER_BATCH
      );
      
      setVisibleMarkers(prev => [...prev, ...nextBatch]);
      currentIndex += MARKERS_PER_BATCH;

      if (currentIndex < events.length) {
        loadingTimeoutRef.current = setTimeout(loadNextBatch, BATCH_LOAD_DELAY);
      }
    };

    setVisibleMarkers([]);
    currentIndex = 0;
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadNextBatch();

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [events]);

  useEffect(() => {
    if (selectedEvent) {
      setPopupEvent(selectedEvent);
      setCurrentImageIndex(0);
    }
  }, [selectedEvent]);

  const fitMapBounds = useCallback(() => {
    if (events.length === 0 && !userLocation) return;

    const points = events.map(event => ({
      longitude: event.location.longitude,
      latitude: event.location.latitude
    }));

    if (userLocation) {
      points.push({
        longitude: userLocation.longitude,
        latitude: userLocation.latitude
      });
    }

    if (points.length === 0) return;

    const bounds = points.reduce(
      (acc, point) => ({
        minLng: Math.min(acc.minLng, point.longitude),
        maxLng: Math.max(acc.maxLng, point.longitude),
        minLat: Math.min(acc.minLat, point.latitude),
        maxLat: Math.max(acc.maxLat, point.latitude)
      }),
      {
        minLng: points[0].longitude,
        maxLng: points[0].longitude,
        minLat: points[0].latitude,
        maxLat: points[0].latitude
      }
    );

    mapRef.current?.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat]
      ],
      { padding: 100, duration: 1000 }
    );
  }, [events, userLocation]);

  useEffect(() => {
    fitMapBounds();
  }, [events, userLocation, fitMapBounds]);

  useEffect(() => {
    if (selectedEvent?.location) {
      const padding = {
        top: 50,
        bottom: 50,
        left: window.innerWidth < 768 ? 50 : 100,
        right: window.innerWidth < 768 ? 50 : 450
      };

      mapRef.current?.flyTo({
        center: [selectedEvent.location.longitude, selectedEvent.location.latitude],
        zoom: 15,
        pitch: 45,
        duration: 1000
      });
    }
  }, [selectedEvent]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMarkerClick = useCallback((event: Event, e: React.MouseEvent) => {
    e.originalEvent.stopPropagation();
    setPopupEvent(event);
    setCurrentImageIndex(0);
    onEventSelect(event);

    mapRef.current?.flyTo({
      center: [event.location.longitude, event.location.latitude],
      zoom: 15,
      pitch: 45,
      duration: 1000
    });
  }, [onEventSelect]);

  const getEventImages = (event: Event): string[] => {
    const images: string[] = [];
    if (event.imageUrl) images.push(event.imageUrl);
    event.attractions?.forEach(attraction => {
      if (attraction.image) images.push(attraction.image);
    });
    return images.filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });
  };

  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (popupEvent) {
      const images = getEventImages(popupEvent);
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }
  }, [popupEvent]);

  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (popupEvent) {
      const images = getEventImages(popupEvent);
      setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
    }
  }, [popupEvent]);

  const routeData = useMemo(() => {
    if (!showRoutes || events.length < 2) return null;

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: events.map(event => [
          event.location.longitude,
          event.location.latitude
        ])
      }
    };
  }, [events, showRoutes]);

  const mapToken = import.meta.env.VITE_MAPBOX_TOKEN;
  
  if (!mapToken) {
    throw new Error('Mapbox token is not configured');
  }

  return (
    <div ref={mapContainerRef} className="relative w-full h-full">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={mapToken}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        minZoom={2}
        maxZoom={20}
        onClick={() => setPopupEvent(null)}
        ref={mapRef}
        terrain={{ source: 'mapbox-terrain', exaggeration: 1.5 }}
      >
        <NavigationControl position="bottom-right" />
        
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleFullscreen}
            className="bg-black/75 hover:bg-black text-white p-2 rounded-lg transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Loading Indicator */}
        {isLoadingEvents && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-lg z-10 flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            <span>Loading events...</span>
          </div>
        )}

        {/* Progress Indicator */}
        {events.length > 0 && visibleMarkers.length < events.length && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-lg z-10">
            Showing {visibleMarkers.length} of {events.length} events
          </div>
        )}
        
        {userLocation && (
          <Marker 
            longitude={userLocation.longitude} 
            latitude={userLocation.latitude}
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white pulse-animation" />
          </Marker>
        )}

        {showRoutes && routeData && (
          <Source type="geojson" data={routeData}>
            <Layer
              id="route"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 3,
                'line-dasharray': [2, 1]
              }}
            />
          </Source>
        )}

        {visibleMarkers.map((event) => {
          const isSelected = selectedEvent?.id === event.id;
          
          return (
            <Marker
              key={event.id}
              longitude={event.location.longitude}
              latitude={event.location.latitude}
              anchor="center"
              onClick={(e) => handleMarkerClick(event, e)}
            >
              <div className={`transform transition-all duration-300 ${
                isSelected ? 'scale-125 z-50' : 'hover:scale-110'
              }`}>
                <div 
                  className={`rounded-full flex items-center justify-center shadow-lg ${
                    isSelected 
                      ? 'bg-blue-500 text-white shadow-blue-500/20' 
                      : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                  }`}
                  style={{
                    width: '40px',
                    height: '40px'
                  }}
                >
                  {showRoutes ? (
                    <span className="font-bold">{events.indexOf(event) + 1}</span>
                  ) : (
                    <span className="text-xl">{EVENT_ICONS[event.category]}</span>
                  )}
                </div>
                {isSelected && (
                  <div 
                    className="w-2 h-2 bg-blue-500 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 shadow-lg"
                  />
                )}
              </div>
            </Marker>
          );
        })}

        {popupEvent && (
          <Popup
            longitude={popupEvent.location.longitude}
            latitude={popupEvent.location.latitude}
            closeButton={true}
            closeOnClick={false}
            onClose={() => setPopupEvent(null)}
            maxWidth="none"
            offset={20}
          >
            <div className="w-full max-w-md">
              {popupEvent.imageUrl && (
                <div className="relative rounded-lg overflow-hidden mb-4">
                  <img 
                    src={getEventImages(popupEvent)[currentImageIndex]} 
                    alt={popupEvent.title}
                    className="w-full h-48 object-cover"
                  />
                  {getEventImages(popupEvent).length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-1 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-1 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{popupEvent.title}</h3>
                  <p className="text-sm text-zinc-300">{popupEvent.description}</p>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span>{popupEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>{popupEvent.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span>{popupEvent.location.address}</span>
                  </div>
                  {popupEvent.venue?.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{popupEvent.venue.rating} / 5</span>
                    </div>
                  )}
                  {popupEvent.priceRange && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span>{popupEvent.priceRange}</span>
                    </div>
                  )}
                </div>

                {popupEvent.ticketUrl && (
                  <a
                    href={popupEvent.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors w-full justify-center mt-4"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Get Tickets</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
});

MapView.displayName = 'MapView';

export default MapView;