
interface Coordinates {
  lat: number;
  lng: number;
}

// Haversine formula to calculate distance between two lat/lng points
export const calculateDistance = (coords1: Coordinates, coords2: Coordinates): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (coords2.lat - coords1.lat) * (Math.PI / 180);
  const dLng = (coords2.lng - coords1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.lat * (Math.PI / 180)) *
      Math.cos(coords2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  return distanceKm * 0.621371; // Convert to miles
};

// Simulate delivery fee based on distance
export const calculateDeliveryFee = (distanceMiles: number): number => {
  const baseFee = 2.00;
  const perMileFee = 1.50;
  return baseFee + distanceMiles * perMileFee;
};

// Simulate ETA based on distance, including prep time
export const calculateETA = (distanceMiles: number): number => {
  const prepTime = 15; // minutes for queue and prep
  const travelTimePerMile = 10; // minutes per mile (walking)
  const travelTime = distanceMiles * travelTimePerMile;
  return Math.round(prepTime + travelTime);
};
