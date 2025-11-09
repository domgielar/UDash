
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

  return (
    <div className="space-y-6">
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
      <div>
        <h2 className="text-2xl font-bold mb-3 text-gray-700">1. Select a Dining Hall</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DINING_HALLS.map(hall => (
            <button
              key={hall.name}
              onClick={() => setSelectedHall(hall)}
              className={`p-4 rounded-lg shadow-md transition-all duration-200 text-center font-semibold ${
                selectedHall?.name === hall.name
                  ? 'bg-umass-maroon text-white ring-2 ring-offset-2 ring-umass-maroon'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              {hall.name}
            </button>
          ))}
        </div>
      </div>
      
      {selectedHall && (
        <>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold mb-3 text-gray-700">2. Choose Your Items</h2>
                    <MenuList menu={menu} onAddToCart={addToCart} />
                </div>
                <div>
                     <h2 className="text-2xl font-bold mb-3 text-gray-700">3. Your Order</h2>
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
        </>
      )}
    </div>
  );
};

export default CustomerView;
