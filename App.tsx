import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import CustomerView from './components/CustomerView';
import DasherView from './components/DasherView';
import { UserRole, OrderStatus } from './types';
import type { Order } from './types';

// The context that will be shared between Customer and Dasher views
interface OrderContextType {
  activeOrder: Order | null;
  placeOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => void;
  updateOrderStatus: (newStatus: OrderStatus) => void;
  acceptOrder: () => void;
}
export const OrderContext = React.createContext<OrderContextType | null>(null);


const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // A dasher updates the order status
  const updateOrderStatus = useCallback((newStatus: OrderStatus) => {
    setActiveOrder((prevOrder) => {
      if (!prevOrder) return null;
      console.log(`Order status changing from ${prevOrder.status} to ${newStatus}`);
      return { ...prevOrder, status: newStatus };
    });
  }, []);
  
  // A customer places an order
  const placeOrder = useCallback((orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    const newOrder: Order = {
      ...orderData,
      id: new Date().getTime().toString(),
      createdAt: Date.now(),
      status: OrderStatus.PENDING,
    };
    setActiveOrder(newOrder);

    // Simulate backend processing and finding a dasher
    setTimeout(() => {
        updateOrderStatus(OrderStatus.AWAITING_PICKUP);
    }, 2000);
  }, [updateOrderStatus]);

  // A dasher accepts the order
  const acceptOrder = useCallback(() => {
      updateOrderStatus(OrderStatus.CONFIRMED);
  }, [updateOrderStatus]);

  // Clear delivered orders after a delay to reset the flow
  useEffect(() => {
      if (activeOrder?.status === OrderStatus.DELIVERED) {
          const timer = setTimeout(() => {
              setActiveOrder(null);
          }, 5000); // Show "Delivered" state for 5 seconds
          return () => clearTimeout(timer);
      }
  }, [activeOrder]);


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header userRole={userRole} setUserRole={setUserRole} />
      <main>
        <OrderContext.Provider value={{ activeOrder, placeOrder, updateOrderStatus, acceptOrder }}>
            {userRole === UserRole.CUSTOMER ? (
                <CustomerView activeOrder={activeOrder} placeOrder={placeOrder} />
            ) : (
                <DasherView activeOrder={activeOrder} updateOrderStatus={updateOrderStatus} acceptOrder={acceptOrder} />
            )}
        </OrderContext.Provider>
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>UDash Demo App. For illustrative purposes only.</p>
      </footer>
       <style>{`
          .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          
          .animate-slide-up { animation: slideUp 0.3s ease-out; }
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;