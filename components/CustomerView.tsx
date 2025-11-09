
import React, { useState, useMemo } from 'react';
import { DiningHall, Order, CartItem, OrderStatus } from '../types';
import { DINING_HALLS, MENU_DATA } from '../constants';
import MenuList from './MenuList';
import Cart from './Cart';
import OrderTracker from './OrderTracker';

interface CustomerViewProps {
  activeOrder: Order | null;
  placeOrder: (newOrder: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ activeOrder, placeOrder, updateOrderStatus }) => {
  const [selectedHall, setSelectedHall] = useState<DiningHall | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

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
    return MENU_DATA[selectedHall.name];
  }, [selectedHall]);
  
  if (activeOrder) {
    return <OrderTracker order={activeOrder} userRole="CUSTOMER" updateOrderStatus={updateOrderStatus} />;
  }

  return (
    <div className="space-y-6">
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
