
import React from 'react';
import { UserRole } from '../types';

interface HeaderProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ userRole, setUserRole }) => {
  return (
    <header className="bg-umass-maroon text-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto max-w-4xl p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">UDash</h1>
        <div className="hidden md:flex items-center bg-white/20 rounded-full p-1">
          <button
            onClick={() => setUserRole(UserRole.CUSTOMER)}
            className={`px-4 py-1 text-sm font-semibold rounded-full transition-colors duration-300 ${
              userRole === UserRole.CUSTOMER ? 'bg-white text-umass-maroon' : 'text-white'
            }`}
          >
            I'm Hungry
          </button>
          <button
            onClick={() => setUserRole(UserRole.DASHER)}
            className={`px-4 py-1 text-sm font-semibold rounded-full transition-colors duration-300 ${
              userRole === UserRole.DASHER ? 'bg-white text-umass-maroon' : 'text-white'
            }`}
          >
            I'm Dashing
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
