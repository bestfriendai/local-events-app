export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  category: string;
  subcategory: string;
  priceRange?: string;
  status: string;
  distance?: number;
  imageUrl?: string;
  ticketUrl?: string;
  venue: {
    name: string;
    city: string;
    state: string;
    capacity?: number;
    generalInfo?: string;
  };
  attractions?: {
    name: string;
    type: string;
    image?: string;
    url?: string;
  }[];
}

export interface Filter {
  category: string;
  date: string;
  distance: number;
  priceRange: string[];
  sortBy?: 'date' | 'distance';
}