
export enum UserRole {
  CUSTOMER = 'Customer',
  DASHER = 'Dasher',
}

export enum DiningHallId {
  BLUE_WALL = 'blue-wall',
  BERKSHIRE = 'berkshire',
  WORCESTER = 'worcester',
  HAMPSHIRE = 'hampshire',
  FRANKLIN = 'franklin',
}

export enum LocationId {
    SWELLS = 'swells',
    OHILL = 'ohill',
    CENTRAL = 'central',
    SOUTHWEST = 'southwest',
    NORTHEAST = 'northeast',
    DUBOIS = 'dubois',
}

export interface DiningHall {
  id: DiningHallId;
  name: string;
  location: { lat: number; lng: number };
}

export interface Location {
    id: LocationId;
    name: string;
    location: { lat: number; lng: number };
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'Pending Confirmation',
  CONFIRMED = 'Order Confirmed',
  AWAITING_PICKUP = 'Waiting for Dasher',
  IN_LINE = 'Dasher is in Line',
  PICKED_UP = 'On The Way',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  diningHall: DiningHall;
  deliveryLocation: Location;
  eta: number; // in minutes
  createdAt: number;
}

// Types for the scraped menu data API
export interface ScrapedMenuItem {
    name: string;
    description: string;
    category: string;
    price: number;
    image: string;
}

export interface ScrapedLocationMenu {
    name: string;
    items: ScrapedMenuItem[];
}

export interface ScrapedMenu {
    date: string;
    locations: ScrapedLocationMenu[];
    message?: string;
    isFutureMenu?: boolean;
}