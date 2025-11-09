
import React, { useState, useEffect } from 'react';
import { CartItem, Order, DiningHall, OrderStatus } from '../types';
import useGeolocation from '../hooks/useGeolocation';
import { calculateDistance, calculateDeliveryFee, calculateETA } from '../services/locationService';
import { Plus, Minus, CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

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
  const [dinerName, setDinerName] = useState('');
  const [dinerEmail, setDinerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [error, setError] = useState('');
  
  const { location, loading: locationLoading, error: locationError, requestLocation } = useGeolocation();
  
  const subtotal = cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const distance = location ? calculateDistance(diningHall.location, location) : 0.5;
  const eta = calculateETA(distance);
  const total = subtotal + deliveryFee + tip;
  
  // Calculate delivery fee when checkout is opened or cart changes
  useEffect(() => {
    if (showCheckout && cart.length > 0) {
      calculateDeliveryFeeFromAPI();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCheckout, cart]);

  const calculateDeliveryFeeFromAPI = async () => {
    setIsCalculating(true);
    setError('');
    try {
      const items = cart.map(item => ({
        category: item.menuItem.category,
        quantity: item.quantity
      }));

      const response = await fetch('http://localhost:3001/calculate-delivery-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          distance,
          fromLocation: diningHall.name,
          toLocation: deliveryAddress || 'Campus'
        })
      });

      if (!response.ok) throw new Error('Failed to calculate delivery fee');
      
      const data = await response.json();
      setDeliveryFee(data.deliveryFee);
    } catch (err) {
      setError(`Delivery fee calculation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setDeliveryFee(2.50); // Fallback to base fee
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Validate inputs
    if (!dinerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!dinerEmail.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!deliveryAddress.trim()) {
      setError('Please enter your delivery address');
      return;
    }
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsCalculating(true);
    setError('');

    try {
      const orderItems = cart.map(item => ({
        name: item.menuItem.name,
        category: item.menuItem.category,
        price: item.menuItem.price,
        quantity: item.quantity,
        image: item.menuItem.id
      }));

      const response = await fetch('http://localhost:3001/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          deliveryFee,
          subtotal,
          total: total,
          deliveryAddress,
          dinerName,
          dinerEmail,
          fromLocation: diningHall.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const data = await response.json();
      
      if (data.success) {
        setPlacedOrderId(data.order.orderId);
        setOrderPlaced(true);

        // Create order object for tracking
        const newOrder: Order = {
          id: data.order.orderId,
          customer: { id: dinerEmail, location: location || { lat: 0, lng: 0 } },
          diningHall,
          items: cart,
          totalPrice: total,
          deliveryFee,
          tip,
          eta,
          status: OrderStatus.PENDING,
          createdAt: Date.now(),
        };
        
        onPlaceOrder(newOrder);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          resetOrderFlow();
          setOrderPlaced(false);
          setDinerName('');
          setDinerEmail('');
          setDeliveryAddress('');
          setShowCheckout(false);
        }, 3000);
      }
    } catch (err) {
      setError(`Order failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // Success screen
  if (orderPlaced) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center space-y-4">
        <CheckCircle size={48} className="text-green-500 mx-auto" />
        <h3 className="text-xl font-bold text-green-600">Order Confirmed!</h3>
        <p className="text-gray-600">Order ID: <span className="font-mono font-bold">{placedOrderId}</span></p>
        <p className="text-sm text-gray-500">Estimated delivery: {eta} minutes</p>
        <p className="text-sm text-gray-500">A confirmation email has been sent to {dinerEmail}</p>
      </div>
    );
  }

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
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-3 text-sm">
            <input
              type="text"
              placeholder="Your Name"
              value={dinerName}
              onChange={(e) => setDinerName(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
            <input
              type="email"
              placeholder="Email"
              value={dinerEmail}
              onChange={(e) => setDinerEmail(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
            <textarea
              placeholder="Delivery Address (e.g., 123 Main St, Dorm Room 456)"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={2}
            />
          </div>

          {isCalculating ? (
            <div className="flex items-center justify-center text-gray-500 py-3">
              <Loader2 className="animate-spin mr-2" size={16} /> Calculating fee...
            </div>
          ) : (
            <div className="text-sm space-y-1 bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between"><span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-blue-600 font-semibold"><span>Delivery Fee:</span> <span>${deliveryFee.toFixed(2)}</span></div>
              <div className="flex justify-between items-center">
                <label htmlFor="tip">Tip:</label>
                <input
                  id="tip"
                  type="number"
                  step="0.50"
                  value={tip}
                  onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                  className="w-20 p-1 border rounded-md text-right"
                />
              </div>
              <div className="flex justify-between border-t pt-2 mt-2 font-bold text-base">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 text-center pt-2">Est. Delivery Time: ~{eta} minutes</p>
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={isCalculating || !dinerName || !dinerEmail || !deliveryAddress}
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
