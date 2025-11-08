
import React from 'react';
import { UserRole } from '../types';
import { UserIcon, MotorcycleIcon } from './icons';

interface HeaderProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ userRole, setUserRole }) => {
  const isCustomer = userRole === UserRole.CUSTOMER;

  return (
    <header className="bg-red-800 text-white shadow-lg sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">UDash</h1>
        <div className="flex items-center space-x-2">
          <span className={`transition-opacity duration-300 ${isCustomer ? 'opacity-100' : 'opacity-50'}`}>
            <UserIcon className="w-6 h-6" />
          </span>
          <button
            onClick={() => setUserRole(isCustomer ? UserRole.DASHER : UserRole.CUSTOMER)}
            className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-white"
            style={{ backgroundColor: isCustomer ? '#4ade80' : '#f87171' }}
          >
            <span
              className="inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300"
              style={{ transform: isCustomer ? 'translateX(2px)' : 'translateX(22px)' }}
            />
          </button>
          <span className={`transition-opacity duration-300 ${!isCustomer ? 'opacity-100' : 'opacity-50'}`}>
            <MotorcycleIcon className="w-6 h-6" />
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
