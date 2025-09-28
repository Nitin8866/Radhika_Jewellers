import React, { useState, useEffect } from 'react';
import { AlertCircle, DollarSign, CheckCircle, Clock } from 'lucide-react';
import ApiService from '../services/api';

const UdhariTab = ({ customerId }) => {
  const [customerSummary, setCustomerSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (customerId) {
      loadCustomerSummary();
    } else {
      setError('No customer specified');
      setLoading(false);
    }
  }, [customerId]);

  const loadCustomerSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getCustomerUdharSummary(customerId);
      if (response.success && response.data) {
        setCustomerSummary({
          outstandingToCollect: response.data.outstandingToCollect || 0,
          outstandingToPay: response.data.outstandingToPay || 0,
          netAmount: response.data.netAmount || 0,
          transactionHistory: response.data.transactionHistory || []
        });
      } else {
        setError('Failed to load customer data');
      }
    } catch (error) {
      console.error('Error loading customer summary:', error);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const transactionDate = new Date(date);
    return transactionDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const transactionDate = new Date(date);
    const diffTime = Math.abs(now - transactionDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const txnDate = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());

    if (nowDate.getTime() === txnDate.getTime()) return 'Today';
    if (diffDays === 0 && nowDate.getDate() - txnDate.getDate() === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 text-lg font-medium">Loading data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <span className="text-red-700 text-lg font-medium">{error}</span>
          </div>
          <button
            onClick={loadCustomerSummary}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!customerSummary) return null;

  const totalGiven = customerSummary.outstandingToCollect || 0;
  const totalTaken = customerSummary.outstandingToPay || 0;
  const net = customerSummary.netAmount || 0;

  const netColor = net >= 0 ? 'text-green-600' : 'text-red-600';
  const netBalanceMessage = net === 0 
    ? 'Clear with this customer'
    : net > 0 
      ? `This customer needs to pay you ${formatCurrency(net)}`
      : `You need to pay this customer ${formatCurrency(Math.abs(net))}`;

  // Payment history includes UDHAR_GIVEN, UDHAR_TAKEN, UDHAR_PAYMENT, and UDHAR_CLOSURE
  const paymentHistory = customerSummary.transactionHistory
    ?.filter(txn => ['UDHAR_GIVEN', 'UDHAR_TAKEN', 'UDHAR_PAYMENT', 'UDHAR_CLOSURE'].includes(txn.type))
    ?.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    || [];

  const totalTransactions = paymentHistory.length;
  const totalPages = Math.ceil(totalTransactions / pageSize);
  const paginatedHistory = paymentHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Given to Customer</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalGiven)}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Total amount given</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Taken from Customer</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalTaken)}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Total amount taken</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className={netColor} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${netColor}`}>
                  {formatCurrency(Math.abs(net))}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">{netBalanceMessage}</p>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Payment History</h3>
          {paginatedHistory.length > 0 ? (
            <div className="space-y-4">
              {paginatedHistory.map((txn) => {
                const isIncoming = txn.direction === 1;
                const color = isIncoming ? 'text-green-600' : 'text-red-600';
                let prefix = '';
                if (txn.type === 'UDHAR_GIVEN') prefix = 'Udhar Given';
                else if (txn.type === 'UDHAR_TAKEN') prefix = 'Udhar Taken';
                else if (txn.type === 'UDHAR_PAYMENT') prefix = isIncoming ? 'Received Payment' : 'Made Payment';
                else if (txn.type === 'UDHAR_CLOSURE') prefix = isIncoming ? 'Received Final Payment' : 'Made Final Payment';

                return (
                  <div key={txn._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CheckCircle size={20} className={color} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{prefix}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(txn.date)} • {getTimeAgo(txn.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={`font-medium ${color} text-lg`}>
                        {isIncoming ? '+' : '-'} {formatCurrency(txn.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {txn.metadata?.paymentMethod || 'CASH'} {txn.metadata?.paymentReference && `• ${txn.metadata.paymentReference}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={40} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-base">No payment history available</p>
            </div>
          )}
          {totalTransactions > 0 && (
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-6 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors font-medium"
              >
                Previous
              </button>
              <span className="text-gray-600 font-medium">
                Page {currentPage} of {totalPages} ({totalTransactions} transactions)
              </span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= totalPages}
                className="px-6 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors font-medium"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UdhariTab;