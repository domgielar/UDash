

// FIX: Import `OrderStatus` from `types.ts` to resolve reference errors.
import { DiningHall, DiningHallName, MenuItem, OrderStatus } from './types';

export const DINING_HALLS: DiningHall[] = [
  { name: DiningHallName.FRANKLIN, location: { lat: 42.3892516, lng: -72.522508 } },
  { name: DiningHallName.BERKSHIRE, location: { lat: 42.3819085, lng: -72.5299679 } },
  { name: DiningHallName.WORCESTER, location: { lat: 42.393611330062605, lng: -72.5242175344014 } },
  { name: DiningHallName.HAMPSHIRE, location: { lat: 42.3838499, lng: -72.530519 } },
];

export const MENU_DATA: Record<DiningHallName, MenuItem[]> = {
  [DiningHallName.FRANKLIN]: [
    { id: 'bw1', name: 'Harvest Chicken Salad Sandwich', price: 8.99, category: 'Sandwiches' },
    { id: 'bw2', name: 'Spicy Chicken Famous Bowl', price: 10.50, category: 'Bowls' },
    { id: 'bw3', name: 'Street Corn Chicken Tacos', price: 9.75, category: 'Tacos' },
    { id: 'bw4', name: 'Classic Sushi Roll', price: 11.25, category: 'Sushi' },
    { id: 'bw5', name: 'Iced Latte', price: 4.50, category: 'Drinks' },
    { id: 'bw6', name: 'Green Smoothie', price: 6.75, category: 'Drinks' },
  ],
  [DiningHallName.BERKSHIRE]: [
    { id: 'b1', name: 'Berkshire Burger', price: 9.50, category: 'Grill' },
    { id: 'b2', name: 'Chicken Tenders & Fries', price: 8.75, category: 'Grill' },
    { id: 'b3', name: 'Cheese Pizza Slice', price: 3.50, category: 'Pizza' },
    { id: 'b4', name: 'Pepperoni Pizza Slice', price: 3.75, category: 'Pizza' },
    { id: 'b5', name: 'Large Fountain Soda', price: 2.50, category: 'Drinks' },
    { id: 'b6', name: 'Garden Salad', price: 6.00, category: 'Salads' },
  ],
  [DiningHallName.WORCESTER]: [
    { id: 'w1', name: 'Stir-fry with Tofu', price: 10.25, category: 'Stir-fry' },
    { id: 'w2', name: 'Chicken Teriyaki Bowl', price: 11.00, category: 'Bowls' },
    { id: 'w3', name: 'Worcester Omelette', price: 7.50, category: 'Breakfast' },
    { id: 'w4', name: 'Pancakes with Syrup', price: 6.75, category: 'Breakfast' },
    { id: 'w5', name: 'Iced Coffee', price: 3.75, category: 'Drinks' },
    { id: 'w6', name: 'Fruit Parfait', price: 5.50, category: 'Desserts' },
  ],
  [DiningHallName.HAMPSHIRE]: [
    { id: 'h1', name: 'Hampden Deli Sandwich', price: 9.25, category: 'Sandwiches' },
    { id: 'h2', name: 'Vegan Chili Bowl', price: 8.50, category: 'Bowls' },
    { id: 'h3', name: 'Macaroni and Cheese', price: 7.75, category: 'Comfort Food' },
    { id: 'h4', name: 'Tomato Soup', price: 4.50, category: 'Soups' },
    { id: 'h5', name: 'Bottled Water', price: 2.00, category: 'Drinks' },
    { id: 'h6', name: 'Brownie', price: 3.25, category: 'Desserts' },
  ],
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.ACCEPTED,
    OrderStatus.AT_HALL,
    OrderStatus.IN_LINE,
    OrderStatus.PICKED_UP,
    OrderStatus.DELIVERED
];