
import React, { useState, useCallback } from 'react';
import { UserRole, Order, OrderStatus } from './types';
import Header from './components/Header';
import CustomerView from './components/CustomerView';
import DasherView from './components/DasherView';
import { Truck, ShoppingCart } from 'lucide-react';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dasher, setDasher] = useState<{ id: string; currentOrder: Order | null; earnings: number }>({
    id: 'dasher-01',
    currentOrder: null,
    earnings: 0,
  });

  const placeOrder = useCallback((newOrder: Order) => {
    setOrders(prevOrders => [...prevOrders, newOrder]);
  }, []);

  const acceptOrder = useCallback((orderToAccept: Order) => {
    if (dasher.currentOrder) {
      alert("You already have an active delivery.");
      return;
    }
    const updatedOrder = { ...orderToAccept, status: OrderStatus.ACCEPTED };
    setDasher(prev => ({ ...prev, currentOrder: updatedOrder }));
    setOrders(prev => prev.filter(o => o.id !== orderToAccept.id));
  }, [dasher.currentOrder]);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    // Update dasher's current order
    if (dasher.currentOrder && dasher.currentOrder.id === orderId) {
      setDasher(prev => ({
        ...prev,
        currentOrder: prev.currentOrder ? { ...prev.currentOrder, status } : null,
      }));
    } else {
        // Update customer's view of their order
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? {...o, status} : o));
    }
  }, [dasher.currentOrder]);
  
  const completeOrder = useCallback((completedOrder: Order) => {
    const finalFee = completedOrder.deliveryFee + completedOrder.tip;
    setDasher(prev => ({
      ...prev,
      currentOrder: null,
      earnings: prev.earnings + finalFee,
    }));
    // In a real app, this order would be persisted. For this simulation, we'll just remove it.
    // The customer view will lose track of it, simulating completion.
  }, []);


  const getCustomerOrder = () => {
    // In this simulation, the first order that is not the dasher's is the customer's.
    // A real app would use user IDs.
    const dasherOrderId = dasher.currentOrder?.id;
    return orders.find(o => o.id !== dasherOrderId) || dasher.currentOrder;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header userRole={userRole} setUserRole={setUserRole} />
      <main className="p-4 mx-auto max-w-4xl pb-24">
        {userRole === UserRole.CUSTOMER ? (
          <CustomerView
            activeOrder={getCustomerOrder()}
            placeOrder={placeOrder}
            updateOrderStatus={updateOrderStatus}
          />
        ) : (
          <DasherView
            dasher={dasher}
            availableOrders={orders.filter(o => !dasher.currentOrder || o.id !== dasher.currentOrder.id)}
            acceptOrder={acceptOrder}
            updateOrderStatus={updateOrderStatus}
            completeOrder={completeOrder}
          />
        )}
      </main>
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
            <div className="flex justify-around items-center h-16">
                <button 
                    onClick={() => setUserRole(UserRole.CUSTOMER)}
                    className={`flex flex-col items-center justify-center w-full h-full text-sm ${userRole === UserRole.CUSTOMER ? 'text-umass-maroon' : 'text-gray-500'}`}
                >
                    <ShoppingCart size={24} />
                    <span>Order</span>
                </button>
                <button 
                    onClick={() => setUserRole(UserRole.DASHER)}
                    className={`flex flex-col items-center justify-center w-full h-full text-sm ${userRole === UserRole.DASHER ? 'text-umass-maroon' : 'text-gray-500'}`}
                >
                    <Truck size={24} />
                    <span>Dash</span>
                </button>
            </div>
        </footer>
    </div>
  );
};

export default App;
