
import { DiningHall, DiningHallId, MenuItem, Location, LocationId } from './types';

export const DINING_HALLS: DiningHall[] = [
  { id: DiningHallId.BLUE_WALL, name: "Blue Wall", location: { lat: 42.3906, lng: -72.5253 } },
  { id: DiningHallId.BERKSHIRE, name: "Berkshire DC", location: { lat: 42.3958, lng: -72.5285 } },
  { id: DiningHallId.WORCESTER, name: "Worcester DC", location: { lat: 42.3879, lng: -72.5218 } },
  { id: DiningHallId.HAMPSHIRE, name: "Hampshire DC", location: { lat: 42.3941, lng: -72.5323 } },
  { id: DiningHallId.FRANKLIN, name: "Franklin DC", location: { lat: 42.3872, lng: -72.5240 } },
];

export const DELIVERY_LOCATIONS: Location[] = [
    { id: LocationId.SWELLS, name: "Sylvan", location: { lat: 42.3900, lng: -72.5180 } },
    { id: LocationId.OHILL, name: "Orchard Hill", location: { lat: 42.3925, lng: -72.5200 } },
    { id: LocationId.CENTRAL, name: "Central", location: { lat: 42.3880, lng: -72.5260 } },
    { id: LocationId.SOUTHWEST, name: "Southwest", location: { lat: 42.3835, lng: -72.5300 } },
    { id: LocationId.NORTHEAST, name: "Northeast", location: { lat: 42.3945, lng: -72.5215 } },
    { id: LocationId.DUBOIS, name: "W.E.B. Du Bois Library", location: { lat: 42.3908, lng: -72.5273 } },
];

export const MENUS: Record<DiningHallId, MenuItem[]> = {
  [DiningHallId.BLUE_WALL]: [
    { id: 'bw1', name: "Harvest Chicken Salad Wrap", description: "Grilled chicken, mixed greens, cranberries, and walnuts.", price: 8.99, image: "https://picsum.photos/seed/bw1/400", category: "Wrap" },
    { id: 'bw2', name: "Spicy California Roll", description: "Fresh sushi with spicy mayo.", price: 9.50, image: "https://picsum.photos/seed/bw2/400", category: "Sushi" },
    { id: 'bw3', name: "Create-Your-Own Salad", description: "Choose from a variety of fresh toppings and dressings.", price: 10.25, image: "https://picsum.photos/seed/bw3/400", category: "Salad" },
  ],
  [DiningHallId.BERKSHIRE]: [
    { id: 'b1', name: "Berkshire Burger", description: "Classic beef burger with lettuce, tomato, and cheese.", price: 9.75, image: "https://picsum.photos/seed/b1/400", category: "Grill" },
    { id: 'b2', name: "Margherita Pizza", description: "Personal pizza with fresh mozzarella and basil.", price: 11.50, image: "https://picsum.photos/seed/b2/400", category: "Pizza" },
    { id: 'b3', name: "Vegan Tofu Scramble", description: "Hearty tofu scramble with seasonal vegetables.", price: 8.50, image: "https://picsum.photos/seed/b3/400", category: "Vegan" },
  ],
  [DiningHallId.WORCESTER]: [
    { id: 'w1', name: "Street Tacos (3)", description: "Choice of carnitas, chicken, or veggie on corn tortillas.", price: 10.00, image: "https://picsum.photos/seed/w1/400", category: "Tacos" },
    { id: 'w2', name: "Ramen Noodle Bowl", description: "Rich broth with noodles, pork belly, and a soft-boiled egg.", price: 12.00, image: "https://picsum.photos/seed/w2/400", category: "Noodles" },
    { id: 'w3', name: "Fruit & Yogurt Parfait", description: "Layers of Greek yogurt, berries, and granola.", price: 6.50, image: "https://picsum.photos/seed/w3/400", category: "Breakfast" },
  ],
  [DiningHallId.HAMPSHIRE]: [
    { id: 'h1', name: "Gluten-Free Pasta", description: "Pasta with your choice of sauce and toppings.", price: 9.25, image: "https://picsum.photos/seed/h1/400", category: "Pasta" },
    { id: 'h2', name: "Chicken Teriyaki Bowl", description: "Grilled chicken with teriyaki glaze over rice.", price: 10.75, image: "https://picsum.photos/seed/h2/400", category: "Bowl" },
    { id: 'h3', name: "Berry Smoothie", description: "A refreshing blend of mixed berries and banana.", price: 7.00, image: "https://picsum.photos/seed/h3/400", category: "Beverage" },
  ],
  [DiningHallId.FRANKLIN]: [
    { id: 'f1', name: "Franklin Philly Cheesesteak", description: "Shaved steak with peppers, onions, and provolone cheese.", price: 11.25, image: "https://picsum.photos/seed/f1/400", category: "Sandwich" },
    { id: 'f2', name: "Custom Veggie Stir-Fry", description: "Your choice of fresh vegetables and sauce over rice.", price: 9.75, image: "https://picsum.photos/seed/f2/400", category: "Stir-fry" },
    { id: 'f3', name: "Buffalo Chicken Wrap", description: "Crispy chicken, buffalo sauce, lettuce, and blue cheese.", price: 8.99, image: "https://picsum.photos/seed/f3/400", category: "Wrap" },
  ],
};

// Mock distance calculation for delivery fee and ETA
// In a real app, this would use the Google Maps Distance Matrix API
export const calculateDeliveryInfo = (diningHallLoc: {lat: number, lng: number}, userLoc: {lat: number, lng: number}) => {
    const latDiff = Math.abs(diningHallLoc.lat - userLoc.lat);
    const lngDiff = Math.abs(diningHallLoc.lng - userLoc.lng);
    const distance = Math.sqrt(latDiff*latDiff + lngDiff*lngDiff) * 100; // A rough multiplier

    const fee = 1.50 + distance * 0.5; // Base fee + per "unit" distance
    const travelTime = Math.round(distance * 5); // 5 minutes per "unit"
    const queueTime = 10; // Simulated 10 min wait time in the dining hall
    const eta = queueTime + travelTime;

    return {
        fee: parseFloat(fee.toFixed(2)),
        eta
    };
};
