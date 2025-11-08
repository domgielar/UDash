
import React, { useState } from 'react';
import type { Order } from '../types';
import { OrderStatus } from '../types';
import { MapPinIcon, ClockIcon } from './icons';

interface DasherViewProps {
  activeOrder: Order | null;
  updateOrderStatus: (status: OrderStatus) => void;
  acceptOrder: () => void;
}

const DasherView: React.FC<DasherViewProps> = ({ activeOrder, updateOrderStatus, acceptOrder }) => {
  const [isAvailable, setIsAvailable] = useState(false);

  const getNextStatus = (currentStatus: OrderStatus): { status: OrderStatus; label: string } | null => {
    switch (currentStatus) {
      case OrderStatus.CONFIRMED:
        return { status: OrderStatus.IN_LINE, label: 'Arrived at Dining Hall' };
      case OrderStatus.IN_LINE:
        return { status: OrderStatus.PICKED_UP, label: 'Picked Up Order' };
      case OrderStatus.PICKED_UP:
        return { status: OrderStatus.DELIVERED, label: 'Complete Delivery' };
      default:
        return null;
    }
  };

  const renderOrderCard = (order: Order) => {
    const nextAction = getNextStatus(order.status);
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Delivery Request</h2>
                <p className="text-gray-500">Order #{order.id.substring(0, 6)}</p>
            </div>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{order.status}</span>
        </div>

        <div className="border-t border-b border-gray-200 my-4 py-4 space-y-3">
            <div className="flex items-start">
                <MapPinIcon className="w-5 h-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-gray-700">Pickup: {order.diningHall.name}</p>
                    <p className="font-semibold text-gray-700">Dropoff: {order.deliveryLocation.name}</p>
                </div>
            </div>
            <div className="flex items-center">
                <ClockIcon className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                <p className="font-semibold text-gray-700">ETA: {order.eta} minutes</p>
            </div>
        </div>

        <div>
            <h3 className="font-semibold text-gray-600 mb-2">Items:</h3>
            <ul className="list-disc list-inside text-gray-600 text-sm">
                {order.items.map(item => (
                    <li key={item.id}>{item.name} (x{item.quantity})</li>
                ))}
            </ul>
        </div>
        
        <div className="mt-6">
            {order.status === OrderStatus.AWAITING_PICKUP ? (
                 <button 
                 onClick={acceptOrder}
                 className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors text-lg"
               >
                 Accept Delivery
               </button>
            ) : nextAction ? (
                <button 
                  onClick={() => updateOrderStatus(nextAction.status)}
                  className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors text-lg"
                >
                  {nextAction.label}
                </button>
            ) : (
                <div className="text-center bg-green-100 text-green-800 font-bold py-3 rounded-lg">
                    Order Delivered! Payment processing.
                </div>
            )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
        <div className="flex items-center space-x-3 mb-8">
            <span className={`font-semibold text-lg ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                {isAvailable ? 'Available for Deliveries' : 'Offline'}
            </span>
            <button
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative inline-flex items-center h-7 rounded-full w-12 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
            >
                <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-300 ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
        
        {isAvailable ? (
            activeOrder ? (
                renderOrderCard(activeOrder)
            ) : (
                <div className="text-center p-10 bg-white rounded-lg shadow-md animate-fade-in">
                    <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-gray-400 rounded-full animate-pulse"></div>
                    <h2 className="text-xl font-semibold text-gray-700">Waiting for orders...</h2>
                    <p className="text-gray-500 mt-2">You'll be notified when a new delivery is available.</p>
                </div>
            )
        ) : (
            <div className="text-center p-10 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700">You are offline</h2>
                <p className="text-gray-500 mt-2">Toggle the switch above to start receiving delivery requests.</p>
            </div>
        )}
    </div>
  );
};

export default DasherView;
