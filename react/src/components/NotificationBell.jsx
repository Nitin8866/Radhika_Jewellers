import React, { useState, useEffect } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import ApiService from '../services/api.js';

const NotificationBell = () => {
  const [hasNotifications, setHasNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  // Function to check for real udhari notifications
  const checkForNotifications = async () => {
    try {
      setLoading(true);
      const [receivableResponse, payableResponse] = await Promise.all([
        ApiService.getOutstandingToCollectUdhari(),
        ApiService.getOutstandingToPayUdhari(),
      ]);

      const customerMap = new Map();
      let customersWithNonZeroBalance = 0;
      let totalOutstandingAmount = 0;

      // Process receivable data
      if (receivableResponse.success) {
        totalOutstandingAmount += Number(receivableResponse.data.totalToCollect || 0);
        receivableResponse.data.customerWise.forEach(item => {
          const id = item.customer._id.toString();
          customerMap.set(id, {
            customer: item.customer,
            toCollect: item.totalOutstanding,
            toPay: 0,
            net: item.totalOutstanding,
          });
        });
      }

      // Process payable data
      if (payableResponse.success) {
        totalOutstandingAmount += Number(payableResponse.data.totalToPay || 0);
        payableResponse.data.customerWise.forEach(item => {
          const id = item.customer._id.toString();
          if (customerMap.has(id)) {
            const entry = customerMap.get(id);
            entry.toPay = item.totalOutstanding;
            entry.net = entry.toCollect - entry.toPay;
          } else {
            customerMap.set(id, {
              customer: item.customer,
              toCollect: 0,
              toPay: item.totalOutstanding,
              net: -item.totalOutstanding,
            });
          }
        });
      }

      // Count customers with non-zero net balance (same logic as your Udhari component)
      Array.from(customerMap.values()).forEach(entry => {
        if (Math.abs(entry.net) > 0.01) { // Allow small floating-point differences
          customersWithNonZeroBalance++;
        }
      });

      setNotificationCount(customersWithNonZeroBalance);
      setHasNotifications(customersWithNonZeroBalance > 0);
      setTotalOutstanding(totalOutstandingAmount);
      
    } catch (error) {
      console.error('Error checking for notifications:', error);
      setHasNotifications(false);
      setNotificationCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkForNotifications();
    // Check for notifications every 30 seconds
    const interval = setInterval(checkForNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  return (
    <div className="relative group">
      <button
        className={`p-2 rounded-full transition-all duration-300 ${
          hasNotifications 
            ? 'bg-red-100 hover:bg-red-200' 
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
        onClick={() => {
          // Navigate to udhari page or show notification panel
          window.location.href = '/udhaar';
        }}
        disabled={loading}
      >
        {loading ? (
          <Loader2 size={20} className="text-gray-600 animate-spin" />
        ) : (
          <Bell 
            size={20} 
            className={`transition-colors duration-300 ${
              hasNotifications ? 'text-red-600 animate-pulse' : 'text-gray-600'
            }`} 
          />
        )}
      </button>
      
      {/* Notification Badge */}
      {hasNotifications && notificationCount > 0 && (
        <>
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center animate-ping">
            <span className="text-xs text-white font-bold opacity-0">{notificationCount > 99 ? '99+' : notificationCount}</span>
          </div>
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">{notificationCount > 99 ? '99+' : notificationCount}</span>
          </div>
        </>
      )}

      {/* Tooltip */}
      {hasNotifications && (
        <div className="absolute bottom-full mb-2 right-0 bg-black text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
          <div className="text-center">
            <div className="font-semibold">{notificationCount} Active Udhari{notificationCount !== 1 ? 's' : ''}</div>
            <div className="text-gray-300">Outstanding: {formatCurrency(totalOutstanding)}</div>
          </div>
          <div className="absolute top-full right-4 border-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;