
import React, { useState, useMemo, useEffect } from 'react';
import { DiningHall, Order, CartItem, OrderStatus } from '../types';
import { DINING_HALLS, MENU_DATA } from '../constants';
import MenuList from './MenuList';
import Cart from './Cart';
import OrderTracker from './OrderTracker';
import { fetchLatestMenu } from '../menuApi';

interface CustomerViewProps {
  activeOrder: Order | null;
  placeOrder: (newOrder: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ activeOrder, placeOrder, updateOrderStatus }) => {
  const [selectedHall, setSelectedHall] = useState<DiningHall | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [realMenuData, setRealMenuData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real menu data from backend on component mount
  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        const menuData = await fetchLatestMenu();
        console.log('Real menu data fetched:', menuData);
        setRealMenuData(menuData);
      } catch (err) {
        console.error('Failed to fetch real menu:', err);
        setError('Failed to load menu from server');
        // Fall back to mock data
        setRealMenuData(null);
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, []);

  const addToCart = (item: CartItem['menuItem']) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menuItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.menuItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
     setCart(prevCart => {
        const existingItem = prevCart.find(cartItem => cartItem.menuItem.id === itemId);
        if (existingItem && existingItem.quantity > 1) {
            return prevCart.map(cartItem =>
                cartItem.menuItem.id === itemId
                    ? { ...cartItem, quantity: cartItem.quantity - 1 }
                    : cartItem
            );
        }
        return prevCart.filter(cartItem => cartItem.menuItem.id !== itemId);
    });
  };
  
  const resetOrderFlow = () => {
    setSelectedHall(null);
    setCart([]);
  }

  const menu = useMemo(() => {
    if (!selectedHall) return [];
    
    // Try to use real menu data first
    if (realMenuData && realMenuData.locations) {
      const hallData = realMenuData.locations.find((loc: any) => 
        loc.name.toLowerCase() === selectedHall.name.toLowerCase()
      );
      if (hallData && hallData.items) {
        return hallData.items.map((item: any, idx: number) => ({
          id: `${selectedHall.name}-${idx}`,
          name: item.name,
          category: item.category,
          price: item.price,
          image: item.image,
          description: item.description || '',
        }));
      }
    }
    
    // Fall back to mock data
    return MENU_DATA[selectedHall.name];
  }, [selectedHall, realMenuData]);
  
  if (activeOrder) {
    return <OrderTracker order={activeOrder} userRole="CUSTOMER" updateOrderStatus={updateOrderStatus} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umass-maroon mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu data...</p>
        </div>
      </div>
    );
  }

  // Dining hall images - using local images from public/images/
  const hallImages: Record<string, string> = {
    'Franklin DC': '/images/franklin-dc.jpg',
    'Berkshire DC': '/images/berkshire-dc.jpg',
    'Worcester DC': '/images/worcester-dc.jpg',
    'Hampshire DC': '/images/hampshire-dc.jpg',
  };

  const hallDescriptions: Record<string, string> = {
    'Franklin DC': 'Fresh & Organic',
    'Berkshire DC': 'Classic Comfort Food',
    'Worcester DC': 'Asian Fusion',
    'Hampshire DC': 'Vegan & Healthy',
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          {error} - Using cached menu
        </div>
      )}
      {realMenuData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          ✓ Real menu data loaded ({realMenuData.locations.length} locations)
        </div>
      )}
      
      {!selectedHall ? (
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative bg-gradient-to-r from-umass-maroon to-red-600 rounded-2xl overflow-hidden shadow-lg">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&fit=crop")', backgroundSize: 'cover'}}></div>
            <div className="relative p-8 md:p-12 text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">Welcome to UDash</h1>
              <p className="text-lg md:text-xl opacity-90">Order in seconds, eat in minutes || no lines, no waiting.</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-umass-maroon">
              <p className="text-3xl font-bold text-umass-maroon">4</p>
              <p className="text-gray-600 text-sm mt-1">Dining Halls</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-blue-500">
              <p className="text-3xl font-bold text-blue-500">10+</p>
              <p className="text-gray-600 text-sm mt-1">Min Delivery</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-green-500">
              <p className="text-3xl font-bold text-green-500">24/7</p>
              <p className="text-gray-600 text-sm mt-1">Available</p>
            </div>
          </div>

          {/* Dining Halls Section */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Select Your Dining Hall</h2>
            <p className="text-gray-600 mb-6">Choose from our featured dining locations</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DINING_HALLS.map(hall => (
                <button
                  key={hall.name}
                  onClick={() => setSelectedHall(hall)}
                  className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 h-48 md:h-56"
                >
                  {/* Image */}
                  <img 
                    src={hallImages[hall.name]} 
                    alt={hall.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/40 transition-colors duration-300 flex flex-col items-end justify-end p-4">
                    <h3 className="text-white font-bold text-sm md:text-base text-right">{hall.name}</h3>
                    <p className="text-gray-200 text-xs mt-1">{hallDescriptions[hall.name]}</p>
                  </div>
                  
                  {/* Floating badge */}
                  <div className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 text-xs font-semibold text-umass-maroon opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Click to Order
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Why Choose UDash?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h4 className="font-bold text-gray-800 mb-2">Lightning Fast</h4>
                <p className="text-gray-600 text-sm">Get your food delivered in 10-15 minutes</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">💰</div>
                <h4 className="font-bold text-gray-800 mb-2">Best Prices</h4>
                <p className="text-gray-600 text-sm">Competitive rates with no hidden fees</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">📍</div>
                <h4 className="font-bold text-gray-800 mb-2">Track Your Order</h4>
                <p className="text-gray-600 text-sm">Real-time tracking from pickup to delivery</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Back button and header */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <button
              onClick={() => resetOrderFlow()}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 w-fit"
            >
              ← Back
            </button>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{selectedHall.name}</h2>
              <p className="text-gray-600 text-sm">{hallDescriptions[selectedHall.name]}</p>
            </div>
          </div>

          {/* Hall image */}
          <div className="overflow-hidden rounded-xl shadow-md animate-fade-in h-64 md:h-80">
            <img 
              src={hallImages[selectedHall.name]} 
              alt={selectedHall.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Menu and Cart */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 animate-slide-in-left">
              <h2 className="text-2xl font-bold mb-4 text-gray-700">Browse Menu</h2>
              <MenuList menu={menu} onAddToCart={addToCart} />
            </div>
            <div className="animate-slide-in-right">
              <h2 className="text-2xl font-bold mb-4 text-gray-700">Order Summary</h2>
              <Cart 
                cart={cart} 
                onAddToCart={addToCart} 
                onRemoveFromCart={removeFromCart} 
                onPlaceOrder={placeOrder} 
                diningHall={selectedHall} 
                resetOrderFlow={resetOrderFlow}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CustomerView;
