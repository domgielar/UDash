
import React from 'react';
import { MenuItem } from '../types';
import { PlusCircle } from 'lucide-react';

const isMenuArray = (value: unknown): value is MenuItem[] => {
  if (!Array.isArray(value)) return false;

  return value.every(item => {
    if (!item || typeof item !== 'object') return false;
    const typedItem = item as Partial<MenuItem>;

    return (
      typeof typedItem.id === 'string' ||
      typeof typedItem.id === 'number' // Allow both in case backend returns numeric IDs
    ) && typeof typedItem.name === 'string' &&
      typeof typedItem.category === 'string' &&
      typeof typedItem.price === 'number';
  });
};

interface MenuListProps {
  menu: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

const MenuList: React.FC<MenuListProps> = ({ menu, onAddToCart }) => {
  if (!isMenuArray(menu) || menu.length === 0) {
    return <div className="text-center text-gray-500">No menu items available</div>;
  }

  // FIX: Explicitly type the accumulator `acc` to ensure `categorizedMenu` has the correct type.
  const categorizedMenu = (menu as MenuItem[]).reduce((acc: Record<string, MenuItem[]>, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
      {Object.entries(categorizedMenu).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-lg font-bold border-b pb-2 mb-2 text-gray-600">{category}</h3>
          <ul className="space-y-2">
            {items.map(item => (
              <li key={item.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => onAddToCart(item)}
                  className="text-umass-maroon hover:text-red-700"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <PlusCircle size={24} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default MenuList;
