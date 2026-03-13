export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'package' | 'addon';
  hours?: number;
}

export interface QuoteRequest {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  event_type: string;
  event_date: string;
  venue: string;
  guest_count: number;
  distance_km?: number;
  services: Service[];
  total_amount: number;
  status?: 'pending' | 'canceled' | 'booked' | 'paid';
  created_at?: string;
}
