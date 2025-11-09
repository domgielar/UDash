
import React, { useState, useMemo, useEffect } from 'react';
import { DINING_HALLS, DELIVERY_LOCATIONS, MENUS, calculateDeliveryInfo } from '../constants';
import type { DiningHall, DiningHallId, MenuItem, CartItem, Location, LocationId, Order, ScrapedMenu } from '../types';
import { OrderStatus } from '../types';
import { ShoppingCartIcon, MapPinIcon, ClockIcon, CheckCircleIcon } from './icons';
import { fetchLatestMenu } from '../menuApi';


interface CustomerViewProps {
  activeOrder: Order | null;
  placeOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => void;
}

const OrderStatusTracker: React.FC<{ order: Order }> = ({ order }) => {
    const statuses = [
        OrderStatus.CONFIRMED,
        OrderStatus.IN_LINE,
        OrderStatus.PICKED_UP,
        OrderStatus.DELIVERED
    ];
    const currentStatusIndex = statuses.indexOf(order.status);

    return (
        <div className="w-full max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Your Order is on its way!</h2>
            <p className="text-center text-gray-500 mb-6">From: <span className="font-semibold">{order.diningHall.name}</span></p>
            
            <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg mb-8">
                 <div className="flex items-center">
                    <ClockIcon className="w-8 h-8 text-red-600 mr-3" />
                    <div>
                        <p className="text-gray-600">Estimated Arrival</p>
                        <p className="font-bold text-xl text-gray-800">{order.eta} min</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-gray-600">Order Total</p>
                    <p className="font-bold text-xl text-gray-800">${order.total.toFixed(2)}</p>
                 </div>
            </div>

            <div className="relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 transform -translate-x-1/2"></div>
                {statuses.map((status, index) => {
                    const isActive = index <= currentStatusIndex;
                    return (
                        <div key={status} className="flex items-center justify-center mb-8 last:mb-0 relative">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors duration-300 ${isActive ? 'bg-red-600' : 'bg-gray-300'}`}>
                                <CheckCircleIcon className="w-6 h-6 text-white" />
                             </div>
                             <p className={`ml-4 text-lg transition-colors duration-300 ${isActive ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>{status}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};


const CustomerView: React.FC<CustomerViewProps> = ({ activeOrder, placeOrder }) => {
  const [selectedHall, setSelectedHall] = useState<DiningHall | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewingCart, setViewingCart] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [menuData, setMenuData] = useState<ScrapedMenu | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState(false);
  const [menuMessage, setMenuMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadMenu = async () => {
        setIsLoadingMenu(true);
        setMenuMessage(null);
        try {
            const data = await fetchLatestMenu();
            setMenuData(data);
            if (data.locations.length === 0 && data.message) {
                setMenuMessage(data.message);
            }
            setMenuError(false);
        } catch (error) {
            console.error("Failed to fetch menu:", error);
            setMenuError(true);
        } finally {
            setIsLoadingMenu(false);
        }
    };
    loadMenu();
  }, []);

  const menuToDisplay = useMemo(() => {
    if (!selectedHall) return [];
    
    // Use fallback if there was an error fetching the live menu
    if (menuError) {
        console.warn("Using fallback menu due to an API error.");
        return MENUS[selectedHall.id];
    }

    // Use live data if available
    if (menuData) {
        const locationData = menuData.locations.find(loc => loc.name === selectedHall.name);
        if (locationData) {
            // Map scraped data to MenuItem type, creating a stable ID
            return locationData.items.map(item => ({
                ...item,
                id: `${selectedHall.id}-${item.name.replace(/\s+/g, '-').toLowerCase()}`
            }));
        }
    }
    return [];
  }, [selectedHall, menuData, menuError]);

  const deliveryInfo = useMemo(() => {
    if (selectedHall && selectedLocation) {
      return calculateDeliveryInfo(selectedHall.location, selectedLocation.location);
    }
    return { fee: 0, eta: 0 };
  }, [selectedHall, selectedLocation]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const total = useMemo(() => subtotal + deliveryInfo.fee, [subtotal, deliveryInfo]);

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    setViewingCart(true);
  };

  const removeFromCart = (itemId: string) => {
      setCart(cart.filter(item => item.id !== itemId));
  };
  
  const handleCheckout = () => {
      if(!selectedHall || !selectedLocation) return;
      setIsPaying(true);
      // Simulate payment processing
      setTimeout(() => {
          placeOrder({
              items: cart,
              subtotal,
              deliveryFee: deliveryInfo.fee,
              total,
              diningHall: selectedHall,
              deliveryLocation: selectedLocation,
              eta: deliveryInfo.eta,
          });
          // Reset state after order
          setCart([]);
          setSelectedHall(null);
          setSelectedLocation(null);
          setViewingCart(false);
          setIsPaying(false);
      }, 2000);
  };

  if (activeOrder) {
    return <div className="p-4 md:p-8"><OrderStatusTracker order={activeOrder} /></div>;
  }
  
  if (isPaying) {
    return (
        <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-gray-700">Processing Payment...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      {!selectedHall || !selectedLocation ? (
        <div className="text-center p-8 bg-white rounded-lg shadow-md animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to UDash!</h2>
          <p className="text-gray-600 mb-8">Your on-campus food delivery solution.</p>
          
          <div className="max-w-md mx-auto space-y-6">
              <div>
                  <label htmlFor="dining-hall" className="block text-sm font-medium text-gray-700 mb-1">1. Choose a Dining Hall</label>
                  <select 
                      id="dining-hall"
                      value={selectedHall?.id || ''}
                      onChange={(e) => setSelectedHall(DINING_HALLS.find(h => h.id === e.target.value as DiningHallId) || null)}
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  >
                      <option value="" disabled>Select Dining Hall</option>
                      {DINING_HALLS.map(hall => <option key={hall.id} value={hall.id}>{hall.name}</option>)}
                  </select>
              </div>

              <div>
                <label htmlFor="delivery-location" className="block text-sm font-medium text-gray-700 mb-1">2. Where are you?</label>
                <select 
                    id="delivery-location"
                    value={selectedLocation?.id || ''}
                    onChange={(e) => setSelectedLocation(DELIVERY_LOCATIONS.find(l => l.id === e.target.value as LocationId) || null)}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                >
                    <option value="" disabled>Select Delivery Location</option>
                    {DELIVERY_LOCATIONS.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedHall.name} Grab & Go</h2>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        <span>Delivering to {selectedLocation.name}</span>
                    </div>
                </div>
                <button 
                  onClick={() => { setSelectedHall(null); setSelectedLocation(null); }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Change
                </button>
            </div>
            
            {menuData && !isLoadingMenu && !menuError && !menuMessage && (
              <div className="text-center text-gray-600 bg-gray-100 p-2 rounded-md mb-4 text-sm">
                {menuData.isFutureMenu ? (
                  `Showing menu for ${new Date(menuData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} (next available day)`
                ) : (
                  `Showing today's Grab & Go menu`
                )}
              </div>
            )}

            {menuError && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md" role="alert">
                  <p className="font-bold">Could not load today's menu</p>
                  <p>This is the next available menu. Some items may not be available.</p>
              </div>
            )}
            
            {isLoadingMenu ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-lg text-gray-600">Loading Today's Menu...</p>
              </div>
            ) : menuMessage ? (
                 <div className="text-center p-8 bg-gray-100 rounded-lg shadow-inner mt-6 animate-fade-in">
                    <h3 className="text-xl font-semibold text-gray-700">Service Update</h3>
                    <p className="text-gray-600 mt-2">{menuMessage}</p>
                </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuToDisplay.map(item => (
                  <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover"/>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">{item.name}</h3>
                        {item.category && <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{item.category}</span>}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xl font-bold text-gray-800">${item.price.toFixed(2)}</span>
                        <button onClick={() => addToCart(item)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl p-4 border-t-2 border-red-600 animate-slide-up">
            <div className="container mx-auto">
                {viewingCart ? (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Your Order</h3>
                            <button onClick={() => setViewingCart(false)} className="text-sm font-semibold text-gray-600">Back to Menu</button>
                        </div>
                        <div className="space-y-3 max-h-40 overflow-y-auto mb-4">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.name} <span className="text-gray-500">x{item.quantity}</span></p>
                                </div>
                                <div className="flex items-center">
                                    <p className="font-bold mr-4 text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="http://www.w3.org/2000/svg" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                        </div>
                        <div className="border-t pt-4">
                            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-gray-600"><span>Delivery Fee</span><span>${deliveryInfo.fee.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-xl mt-2 text-gray-800"><span>Total</span><span>${total.toFixed(2)}</span></div>
                            <button onClick={handleCheckout} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg mt-4 hover:bg-green-600 transition-colors">
                                Mock Pay with Stripe
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <ShoppingCartIcon className="w-6 h-6 text-red-600" />
                            <span className="ml-3 font-semibold text-lg">{cart.length} item{cart.length > 1 ? 's' : ''} in cart</span>
                        </div>
                        <button onClick={() => setViewingCart(true)} className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors">
                            View Cart (${total.toFixed(2)})
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;