import { Service } from "./types";

export const SERVICES: Service[] = [
  {
    id: 'wedding-basic',
    name: 'Wedding Basic',
    description: 'Perfect for intimate weddings. Includes 5 hours of play, basic sound system (up to 50 guests), and 1 wireless mic.',
    price: 4500,
    category: 'package'
  },
  {
    id: 'wedding-premium',
    name: 'Wedding Premium',
    description: 'Full wedding experience. Includes 8 hours, premium sound (up to 50 guests), dance floor lighting, and MC services.',
    price: 7500,
    category: 'package'
  },
  {
    id: 'corporate-gala',
    name: 'Corporate Gala',
    description: 'Professional setup for corporate events. Includes high-end sound (up to 50 guests), stage lighting, and background music.',
    price: 6500,
    category: 'package'
  },
  {
    id: 'club-radio',
    name: 'Club / Radio Set',
    description: 'High-energy performance for clubs or radio broadcasts.',
    price: 1500,
    category: 'package'
  },
  {
    id: 'lighting-pro',
    name: 'Pro Lighting Add-on',
    description: 'Moving heads, uplighting, and smoke machine for enhanced atmosphere.',
    price: 1500,
    category: 'addon'
  },
  {
    id: 'mc-services',
    name: 'MC Services',
    description: 'Professional Master of Ceremonies to host your event.',
    price: 1200,
    category: 'addon'
  },
  {
    id: 'extra-hour',
    name: 'Additional Hour',
    description: 'Overtime rate per hour.',
    price: 800,
    category: 'addon'
  }
];

export const EVENT_TYPES = [
  'Wedding',
  'Corporate Event',
  'Private Party',
  'Club / Festival',
  'Other'
];
