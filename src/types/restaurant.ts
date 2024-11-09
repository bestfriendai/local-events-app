export interface Restaurant {
  id: string;
  name: string;
  image_url: string;
  url: string;
  review_count: number;
  categories: {
    alias: string;
    title: string;
  }[];
  rating: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  price?: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance: number;
  is_closed: boolean;
  description?: string;
  photos?: string[];
  hours?: {
    open: {
      is_overnight: boolean;
      start: string;
      end: string;
      day: number;
    }[];
    hours_type: string;
    is_open_now: boolean;
  }[];
  transactions: string[];
  source?: 'yelp' | 'rapidapi';
  special_hours?: {
    date: string;
    is_closed: boolean;
    start: string;
    end: string;
  };
  events?: {
    name: string;
    start_date: string;
    end_date: string;
    description: string;
  }[];
}

export interface RestaurantFilter {
  categories: string[];
  price: string[];
  rating: number;
  distance: number;
  openNow: boolean;
}
