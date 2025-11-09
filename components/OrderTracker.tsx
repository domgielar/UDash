
import React from 'react';
import { Order, OrderStatus } from '../types';
import { ORDER_STATUS_FLOW } from '../constants';
import { MapPin } from 'lucide-react';

interface OrderTrackerProps {
  order: Order;
  userRole: "CUSTOMER" | "DASHER";
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const OrderTracker: React.FC<OrderTrackerProps> = ({ order, userRole, updateOrderStatus }) => {
  const currentStatusIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  
  const dasherActions: Partial<Record<OrderStatus, { nextStatus: OrderStatus, buttonText: string }>> = {
    [OrderStatus.ACCEPTED]: { nextStatus: OrderStatus.AT_HALL, buttonText: "I've Arrived at Dining Hall" },
    [OrderStatus.AT_HALL]: { nextStatus: OrderStatus.IN_LINE, buttonText: "I'm in Line" },
    [OrderStatus.IN_LINE]: { nextStatus: OrderStatus.PICKED_UP, buttonText: "I've Picked Up the Order" },
  };

  const nextAction = dasherActions[order.status];

  const getMapLink = () => {
    const origin = `${order.diningHall.location.lat},${order.diningHall.location.lng}`;
    const destination = `${order.customer.location.lat},${order.customer.location.lng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Order Status</h3>
          <p className="text-sm text-gray-500">From: {order.diningHall.name}</p>
          <p className="text-lg font-semibold text-udash-blue mt-1">{order.status}</p>
        </div>
        <div className="text-right">
           <p className="text-sm text-gray-500">Order ID</p>
           <p className="font-mono text-xs">{order.id.split('-')[1]}</p>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div 
          className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${((currentStatusIndex + 1) / ORDER_STATUS_FLOW.length) * 100}%` }}
        ></div>
      </div>
       <ul className="text-xs text-gray-500 flex justify-between mb-6">
        {ORDER_STATUS_FLOW.map((status, index) => (
            <li key={status} className={`w-1/6 text-center ${index <= currentStatusIndex ? 'font-bold text-gray-700' : ''}`}>
                {status.split(' ')[0]}
            </li>
        ))}
      </ul>

       {userRole === 'DASHER' && order.status === OrderStatus.PICKED_UP && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-bold mb-2">Delivery Route</h4>
          <a 
            href={getMapLink()}
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <MapPin size={20} />
            Open Navigation in Google Maps
          </a>
        </div>
      )}

      {userRole === 'DASHER' && nextAction && (
        <div className="mt-6">
          <button
            onClick={() => updateOrderStatus(order.id, nextAction.nextStatus)}
            className="w-full bg-udash-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {nextAction.buttonText}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderTracker;
