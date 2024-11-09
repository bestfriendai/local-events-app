import React, { useState, useEffect } from 'react';
import { Restaurant } from '../types/restaurant';
import { getRestaurantReviews } from '../services/restaurants';
import { Star, MapPin, Phone, Clock, DollarSign, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface RestaurantDetailsProps {
  restaurant: Restaurant;
  onClose: () => void;
}

interface Review {
  id: string;
  rating: number;
  text: string;
  time_created: string;
  user: {
    name: string;
    image_url?: string;
  };
}

export default function RestaurantDetails({ restaurant, onClose }: RestaurantDetailsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const data = await getRestaurantReviews(restaurant.id);
        setReviews(data.reviews || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [restaurant.id]);

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? restaurant.photos.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === restaurant.photos.length - 1 ? 0 : prev + 1
    );
  };

  const formatHours = (hours: any[]) => {
    if (!hours || hours.length === 0) return 'Hours not available';
    
    const today = new Date().getDay();
    const todayHours = hours[0]?.open?.find(h => h.day === today);
    
    if (!todayHours) return 'Closed today';
    
    const start = formatTime(todayHours.start);
    const end = formatTime(todayHours.end);
    return `${start} - ${end}`;
  };

  const formatTime = (time: string) => {
    const hour = parseInt(time.slice(0, 2));
    const minute = time.slice(2);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute} ${period}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {restaurant.photos && restaurant.photos.length > 0 && (
            <div className="relative h-64 sm:h-80">
              <img
                src={restaurant.photos[currentImageIndex]}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
              {restaurant.photos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-bold text-white">{restaurant.name}</h2>
              {restaurant.price && (
                <span className="text-green-400 font-medium">{restaurant.price}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-5 h-5" />
                <span className="font-medium">{restaurant.rating}</span>
              </div>
              <span className="text-zinc-400">({restaurant.review_count} reviews)</span>
            </div>

            <div className="space-y-3 text-zinc-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-zinc-400" />
                <span>{restaurant.location.display_address.join(', ')}</span>
              </div>
              
              {restaurant.display_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-zinc-400" />
                  <span>{restaurant.display_phone}</span>
                </div>
              )}
              
              {restaurant.hours && restaurant.hours.length > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-zinc-400" />
                  <span>{formatHours(restaurant.hours)}</span>
                </div>
              )}

              {restaurant.price && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-zinc-400" />
                  <span>{restaurant.price}</span>
                </div>
              )}
            </div>

            {restaurant.url && (
              <a
                href={restaurant.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                View on Website
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Reviews</h3>
            {isLoadingReviews ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-zinc-400 mt-4">Loading reviews...</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-zinc-800 pb-6 last:border-0">
                    <div className="flex items-center gap-3 mb-3">
                      {review.user.image_url && (
                        <img
                          src={review.user.image_url}
                          alt={review.user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-white">{review.user.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="text-yellow-400">{'★'.repeat(review.rating)}</div>
                          <span className="text-zinc-400 text-sm">
                            {new Date(review.time_created).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-zinc-300">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 text-center py-8">No reviews available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}