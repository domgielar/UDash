
import React, { useState, useEffect } from 'react';
import { CartItem, Order, DiningHall, OrderStatus } from '../types';
import useGeolocation from '../hooks/useGeolocation';
import { calculateDistance, calculateDeliveryFee, calculateETA } from '../services/locationService';
import { Plus, Minus, CreditCard, Loader2 } from 'lucide-react';

interface CartProps {
  cart: CartItem[];
  onAddToCart: (item: CartItem['menuItem']) => void;
  onRemoveFromCart: (itemId: string) => void;
  onPlaceOrder: (newOrder: Order) => void;
  diningHall: DiningHall;
  resetOrderFlow: () => void;
}

const Cart: React.FC<CartProps> = ({ cart, onAddToCart, onRemoveFromCart, onPlaceOrder, diningHall, resetOrderFlow }) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [tip, setTip] = useState(2.00);
  const { location, loading: locationLoading, error: locationError, requestLocation } = useGeolocation();
  
  const subtotal = cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const distance = location ? calculateDistance(diningHall.location, location) : 0;
  const deliveryFee = calculateDeliveryFee(distance);
  const eta = calculateETA(distance);
  const total = subtotal + deliveryFee + tip;
  
  useEffect(() => {
    if (showCheckout) {
      requestLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCheckout]);
  
  const handlePlaceOrder = () => {
    if (!location) {
      alert("Could not get your location. Please enable location services.");
      return;
    }
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      customer: { id: 'customer-01', location },
      diningHall,
      items: cart,
      totalPrice: total,
      deliveryFee,
      tip,
      eta,
      status: OrderStatus.PENDING,
      createdAt: Date.now(),
    };
    
    // Simulate payment
    alert(`Payment of $${total.toFixed(2)} successful! Your order has been placed.`);
    onPlaceOrder(newOrder);
    resetOrderFlow();
  };

  if (cart.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <p className="text-sm text-gray-400">Add items from the menu to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
      {!showCheckout ? (
        <>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {cart.map(item => (
              <li key={item.menuItem.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold">{item.menuItem.name}</p>
                  <p className="text-gray-500">${item.menuItem.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => onRemoveFromCart(item.menuItem.id)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Minus size={12}/></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => onAddToCart(item.menuItem)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Plus size={12}/></button>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            className="mt-4 w-full bg-umass-maroon text-white font-bold py-3 px-4 rounded-lg hover:bg-red-800 transition-colors"
          >
            Checkout
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <h4 className="font-bold text-lg text-center">Confirm Order</h4>
          {locationLoading && <div className="flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2" /> Getting your location...</div>}
          {locationError && <p className="text-red-500 text-sm">{locationError}</p>}
          {location && (
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Delivery Fee:</span> <span>${deliveryFee.toFixed(2)}</span></div>
              <div className="flex justify-between items-center">
                <label htmlFor="tip">Tip:</label>
                <input id="tip" type="number" value={tip} onChange={e => setTip(parseFloat(e.target.value) || 0)} className="w-20 p-1 border rounded-md text-right"/>
              </div>
               <div className="flex justify-between border-t pt-2 mt-2 font-bold text-base">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
               <p className="text-xs text-gray-500 text-center pt-2">Est. Delivery Time: {eta} minutes</p>
            </div>
          )}
          <button
            onClick={handlePlaceOrder}
            disabled={locationLoading || !location}
            className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <CreditCard size={20}/>
            Pay & Place Order
          </button>
          <button
            onClick={() => setShowCheckout(false)}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
          >
            Back to Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
