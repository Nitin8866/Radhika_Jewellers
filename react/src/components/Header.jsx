import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { ExpenseContext } from '../context/ExpenseContext.jsx';
import { Menu, Bell, LogOut, Plus } from 'lucide-react';
import CustomerSearch from './CustomerSearch';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell.jsx';

const Header = ({ toggleSidebar, isMobile, onNotificationClick, onAddExpenseClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { setShowAddExpense, udhaarData } = useContext(ExpenseContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLogoutPopupOpen, setIsLogoutPopupOpen] = useState(false);
  const [hasPendingUdhaars, setHasPendingUdhaars] = useState(false);
  const [pendingUdhaarsCount, setPendingUdhaarsCount] = useState(0);

  // Check for pending udhaars (net !== 0)
  useEffect(() => {
    if (udhaarData && Array.isArray(udhaarData)) {
      const pending = udhaarData.filter((udhari) => Math.abs(udhari.net) > 0.01); // Match Udhaar.jsx filtering
      setPendingUdhaarsCount(pending.length);
      setHasPendingUdhaars(pending.length > 0);
    } else {
      setPendingUdhaarsCount(0);
      setHasPendingUdhaars(false);
    }
  }, [udhaarData]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/auth');
    setIsLogoutPopupOpen(false);
  };

  // Open/close logout popup
  const openLogoutPopup = () => {
    setIsLogoutPopupOpen(true);
  };

  const closeLogoutPopup = () => {
    setIsLogoutPopupOpen(false);
  };

  // Handle notification bell click
  const handleNotificationClick = () => {
    if (hasPendingUdhaars) {
      navigate('/udhaar');
      if (onNotificationClick) {
        onNotificationClick();
      }
    }
  };

  // Handle Add Expense button click
  const handleAddExpenseClick = () => {
    setShowAddExpense(true);
    if (onAddExpenseClick) {
      onAddExpenseClick();
    }
  };

  // Get page title from current route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/customers':
        return 'Customers';
      case '/udhaar':
        return 'Udhaar';
      case '/gold-loan':
        return 'GoldLoan Management';
      case '/silver-loan':
        return 'SilverLoan Management';
      case '/loan':
        return 'Loan Management';
      case '/business-expense':
        return 'Business - Expense';
      case '/transactions':
        return 'Transactions';
      case '/gold-buy-sell':
        return 'Gold Buy/Sell';
      case '/silver-buy-sell':
        return 'Silver Buy/Sell';
      case '/analysis':
        return 'Business Analysis';
      case '/setting':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  // Get page description from current route
  const getPageDescription = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Overview of your business performance';
      case '/customers':
        return 'Manage your customer database';
      case '/udhaar':
        return 'Track udhaar transactions';
      case '/gold-loan':
        return 'Manage goldloan inventory';
      case '/silver-loan':
        return 'Manage silverloan inventory';
      case '/loan':
        return 'Manage customer loans';
      case '/business-expense':
        return 'Financial overview and expenses';
      case '/transactions':
        return 'Manage transactions';
      case '/gold-buy-sell':
        return 'Gold trading operations';
      case '/silver-buy-sell':
        return 'Silver trading operations';
      case '/analysis':
        return 'Business insights and advice';
      case '/setting':
        return 'System configuration';
      default:
        return 'Manage your jewelry business';
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                {getPageTitle()}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {getPageDescription()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Customer Search Bar */}
            <div className="hidden md:block w-64 lg:w-96">
              <CustomerSearch
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onCustomerSelect={(customer) => {
                  console.log('Selected customer:', customer);
                }}
                onCreateCustomer={() => {
                  console.log('Create new customer clicked');
                }}
              />
            </div>

            {/* Add Expense Button (Visible on Dashboard) */}
            {location.pathname === '/dashboard' && (
              <button
                onClick={handleAddExpenseClick}
                className="p-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium sm:font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 flex items-center gap-1 sm:gap-2"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sm:inline">Add Expense</span>
              </button>
            )}

           <NotificationBell />
            {/* User Profile and Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">RJ</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">Jewelry Business</p>
                <p className="text-xs text-gray-500">Owner</p>
              </div>
              <button
                onClick={openLogoutPopup}
                className="flex items-center px-3 sm:px-4 py-1 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Popup */}
      <AnimatePresence>
        {isLogoutPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeLogoutPopup}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Confirm Logout
                </h3>
                <button
                  onClick={closeLogoutPopup}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to log out of your account?
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeLogoutPopup}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;