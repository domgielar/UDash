
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

// Type for cart items (extended from menu item)
export interface CartItemExtended {
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
  mealPeriod?: string;
}

// Type for delivery fee calculation
export interface DeliveryFeeRequest {
  items: Array<{ category: string; quantity: number }>;
  distance?: number;
  fromLocation?: string;
  toLocation?: string;
}

export interface DeliveryFeeResponse {
  baseFee: number;
  itemCount: number;
  complexItems: number;
  distance: number;
  deliveryFee: number;
  breakdown: {
    baseFee: number;
    itemAddOn: number;
    complexityAddOn: number;
    distanceAddOn: number;
  };
}

// Type for order placement
export interface OrderRequest {
  items: CartItemExtended[];
  deliveryFee: number;
  subtotal: number;
  total: number;
  deliveryAddress: string;
  dinerName: string;
  dinerEmail: string;
  fromLocation: string;
}

export interface OrderResponse {
  success: boolean;
  order: {
    orderId: string;
    timestamp: string;
    status: string;
    dinerName: string;
    dinerEmail: string;
    deliveryAddress: string;
    fromLocation: string;
    items: CartItemExtended[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    estimatedDelivery: string;
  };
  message: string;
}
