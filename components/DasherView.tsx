
import React from 'react';
import { Order, OrderStatus } from '../types';
import OrderTracker from './OrderTracker';
import { DollarSign, Package, CheckCircle } from 'lucide-react';

interface DasherViewProps {
  dasher: { id: string; currentOrder: Order | null; earnings: number };
  availableOrders: Order[];
  acceptOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  completeOrder: (order: Order) => void;
}

const DasherView: React.FC<DasherViewProps> = ({ dasher, availableOrders, acceptOrder, updateOrderStatus, completeOrder }) => {

  const handleCompleteOrder = () => {
    if (dasher.currentOrder) {
      completeOrder(dasher.currentOrder);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dasher Dashboard</h2>
          <p className="text-gray-500">Welcome, Dasher!</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm">Total Earnings</p>
          <p className="text-2xl font-bold text-green-600">${dasher.earnings.toFixed(2)}</p>
        </div>
      </div>

      {dasher.currentOrder ? (
        <div>
          <h3 className="text-2xl font-bold mb-3 text-gray-700">Current Delivery</h3>
          <OrderTracker order={dasher.currentOrder} userRole="DASHER" updateOrderStatus={updateOrderStatus}/>
           {dasher.currentOrder.status === OrderStatus.PICKED_UP && (
            <button
              onClick={handleCompleteOrder}
              className="mt-4 w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              Mark as Delivered & Get Paid
            </button>
          )}
        </div>
      ) : (
        <div>
          <h3 className="text-2xl font-bold mb-3 text-gray-700">Available Orders</h3>
          {availableOrders.length > 0 ? (
            <div className="space-y-4">
              {availableOrders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                  <div>
                    <p className="font-bold">{order.diningHall.name}</p>
                    <p className="text-sm text-gray-500">{order.items.reduce((acc, item) => acc + item.quantity, 0)} items</p>
                     <p className="text-sm text-gray-500">ETA: {order.eta} mins</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">Payout: ${(order.deliveryFee + order.tip).toFixed(2)}</p>
                    <button
                      onClick={() => acceptOrder(order)}
                      className="mt-2 bg-udash-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow-md">
              <Package size={48} className="mx-auto text-gray-400" />
              <p className="mt-4 text-gray-500">No available orders right now. Check back soon!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DasherView;
