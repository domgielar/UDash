
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DASHER = 'DASHER',
}

export enum DiningHallName {
  FRANKLIN = 'Franklin DC',
  BERKSHIRE = 'Berkshire DC',
  WORCESTER = 'Worcester DC',
  HAMPSHIRE = 'Hampshire DC',
}

export interface DiningHall {
  name: DiningHallName;
  location: {
    lat: number;
    lng: number;
  };
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export enum OrderStatus {
    PENDING = "Order Placed",
    ACCEPTED = "Dasher Assigned",
    AT_HALL = "Arrived at Dining Hall",
    IN_LINE = "In Line for Food",
    PICKED_UP = "On The Way",
    DELIVERED = "Delivered"
}

export interface Order {
  id: string;
  customer: {
    id: string;
    location: {
      lat: number;
      lng: number;
    }
  };
  dasherId?: string;
  diningHall: DiningHall;
  items: CartItem[];
  totalPrice: number;
  deliveryFee: number;
  tip: number;
  eta: number; // in minutes
  status: OrderStatus;
  createdAt: number; // timestamp
}

// Type for the scraped menu data returned from backend
export interface ScrapedMenu {
  date: string;
  locations: Array<{
    name: string;
    items: Array<{
      id?: string;
      name: string;
      description?: string;
      category: string;
      mealPeriod?: string;
      price: number;
      calories?: string;
      image?: string;
    }>;
  }>;
  isFutureMenu: boolean;
  source?: 'scraped' | 'mock';
  message?: string;
}
