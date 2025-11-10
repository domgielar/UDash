
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
  
  // Status label mapping for cleaner display
  const statusLabels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "Order",
    [OrderStatus.ACCEPTED]: "Dasher Confirmed",
    [OrderStatus.AT_HALL]: "Arrived at DC",
    [OrderStatus.IN_LINE]: "In Line",
    [OrderStatus.PICKED_UP]: "On the Way",
    [OrderStatus.DELIVERED]: "Delivered"
  };
  
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
      <div className="flex justify-between items-start mb-6">
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

      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${((currentStatusIndex + 1) / ORDER_STATUS_FLOW.length) * 100}%` }}
        ></div>
      </div>
       <ul className="text-xs text-gray-500 flex justify-between mb-6 relative">
        {ORDER_STATUS_FLOW.map((status, index) => (
            <li key={status} className="flex-1 text-center relative flex justify-center items-center whitespace-nowrap">
              {/* Left arrow moving right at current status */}
              {index === currentStatusIndex && (
                <span 
                  className="text-xs font-black select-none"
                  style={{
                    color: '#000000',
                    animation: 'slide-left-right 1s infinite',
                    minWidth: '14px',
                    display: 'inline-block'
                  }}
                >
                  →
                </span>
              )}
              <span className={`inline-block px-2 ${
                index === currentStatusIndex 
                  ? 'font-black text-sm' 
                  : index < currentStatusIndex 
                  ? 'font-bold text-gray-700 text-xs' 
                  : 'text-gray-400 text-xs'
              }`}
              style={index === currentStatusIndex ? {
                color: '#3b82f6',
                textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, -2px 0px 0 #000, 2px 0px 0 #000, 0px -2px 0 #000, 0px 2px 0 #000'
              } : {}}
              >
                {statusLabels[status]}
              </span>
              {/* Right arrow moving left at current status */}
              {index === currentStatusIndex && (
                <span 
                  className="text-xs font-black select-none"
                  style={{
                    color: '#000000',
                    animation: 'slide-right-left 1s infinite',
                    animationDelay: '0s',
                    minWidth: '14px',
                    display: 'inline-block'
                  }}
                >
                  ←
                </span>
              )}
            </li>
        ))}
      </ul>

      {/* Status descriptions - Only show for customers */}
      {userRole === 'CUSTOMER' && (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
        {order.status === OrderStatus.PENDING && (
          <p className="text-sm text-blue-900">⏳ <strong>Order Confirmed:</strong> Your order is confirmed and a dasher will be assigned shortly.</p>
        )}
        {order.status === OrderStatus.ACCEPTED && userRole === 'CUSTOMER' && (
          <p className="text-sm text-blue-900">✨ <strong>Dasher Assigned:</strong> A dasher has been assigned to your order.</p>
        )}
        {order.status === OrderStatus.AT_HALL && (
          <p className="text-sm text-blue-900">� <strong>Dasher Arriving:</strong> Your dasher has arrived at the dining hall and is picking up your order.</p>
        )}
        {order.status === OrderStatus.IN_LINE && (
          <p className="text-sm text-blue-900">📍 <strong>In Line:</strong> Your dasher is currently in line at the dining hall, picking up your order.</p>
        )}
        {order.status === OrderStatus.PICKED_UP && (
          <p className="text-sm text-blue-900">🚚 <strong>On the Way:</strong> Your order has been picked up and is on the way to you. Estimated arrival: ~{order.eta} minutes.</p>
        )}
        {order.status === OrderStatus.DELIVERED && (
          <p className="text-sm text-green-900 bg-green-50 border-green-200">✅ <strong>Arrived:</strong> Your order has been delivered! Enjoy your meal!</p>
        )}
      </div>
      )}

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

      <style>{`
        @keyframes slide-left-right {
          0%, 100% {
            transform: translateX(-6px);
          }
          50% {
            transform: translateX(6px);
          }
        }
        
        @keyframes slide-right-left {
          0%, 100% {
            transform: translateX(6px);
          }
          50% {
            transform: translateX(-6px);
          }
        }
      `}</style>
    </div>
  );
};

export default OrderTracker;
