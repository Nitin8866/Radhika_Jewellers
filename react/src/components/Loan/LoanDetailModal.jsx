// LoanDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { X, CreditCard, Percent, Phone, FileText, DollarSign, CheckCircle, Clock } from 'lucide-react';

const LoanDetailModal = ({ isOpen, loanData, loanType, onClose, onPrincipalPayment, onInterestPayment }) => {
  const [selectedLoan, setSelectedLoan] = useState(null);

  useEffect(() => {
    if (isOpen && loanData && loanData.loans && loanData.loans.length > 0) {
      setSelectedLoan(loanData.loans[0]);
    }
  }, [isOpen, loanData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const transactionDate = new Date(date);
    const diffTime = Math.abs(now - transactionDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const getMonthlyInterest = (loan) => {
    if (!loan?.outstandingPrincipal || !loan?.interestRateMonthlyPct) return 0;
    return (loan.outstandingPrincipal * loan.interestRateMonthlyPct)  ; // Convert paise to rupees
  };

  const handlePrincipalPayment = () => {
    if (selectedLoan) {
      onPrincipalPayment(selectedLoan);
    }
  };

  const handleInterestPayment = () => {
    if (selectedLoan) {
      onInterestPayment(selectedLoan);
    }
  };

  if (!isOpen || !loanData) return null;

  const customer = loanData.customer || {};
  const loans = loanData.loans || [];
  const isReceivable = loanType === 'receivable';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isReceivable ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              <span className="text-white text-xl font-bold">{getInitials(customer.name)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{customer.name || 'Unknown Customer'}</h2>
              <div className="flex items-center gap-4 text-slate-600 mt-1">
                {customer.phone && (
                  <div className="flex items-center gap-1">
                    <Phone size={16} />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <FileText size={16} />
                  <span>{loans.length} active loan{loans.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {loans.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-900 mb-2">No Active Loans</h4>
            <p className="text-slate-500">No active loan records found for this customer</p>
          </div>
        ) : (
          <>
            {loans.length > 1 && (
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Select Loan</h3>
                <div className="flex gap-2 overflow-x-auto">
                  {loans.map((loan, index) => (
                    <button
                      key={loan._id}
                      onClick={() => setSelectedLoan(loan)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 bg-gradient-to-r ${
                        selectedLoan?._id === loan._id
                          ? 'from-blue-600 to-blue-700 text-white'
                          : 'from-blue-50 to-blue-100 text-blue-700 border border-blue-200 hover:from-blue-100 hover:to-blue-200'
                      }`}
                    >
                      Loan #{index + 1} - {formatCurrency(loan.originalAmount)}
                      <span className="ml-2 text-xs opacity-75">
                        {formatDate(loan.takenDate)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedLoan && (
              <>
                <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isReceivable ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          <DollarSign size={20} className={isReceivable ? 'text-red-600' : 'text-green-600'} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">Outstanding</p>
                          <p className={`text-2xl font-bold ${
                            isReceivable ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(selectedLoan.outstandingAmount)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">
                        {isReceivable ? 'Amount to collect' : 'Amount to pay'}
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Percent size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">Monthly Interest</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {selectedLoan.monthlyInterest}

                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">
                        {selectedLoan.interestRateMonthlyPct}% per month
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <CheckCircle size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">Total Paid</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(selectedLoan.totalPrincipalPaid )}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">
                        Principal payments made
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                      <div className="flex gap-2">
                        <button
                          onClick={handlePrincipalPayment}
                          className={`px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105 bg-gradient-to-r ${
                            isReceivable ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <CreditCard size={14} />
                            {isReceivable ? 'Receive' : 'Pay'}
                          </div>
                        </button>
                        <button
                          onClick={handleInterestPayment}
                          className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Percent size={14} />
                            Interest
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Loan Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Original Amount</p>
                        <p className="font-bold text-slate-900">
                          {formatCurrency(selectedLoan.originalAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Loan Date</p>
                        <p className="font-medium text-slate-900">
                          {formatDate(selectedLoan.takenDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          selectedLoan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          selectedLoan.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedLoan.status}
                        </span>
                      </div>
                      {selectedLoan.note && (
                        <div className="md:col-span-3">
                          <p className="text-sm text-slate-600 mb-1">Note</p>
                          <p className="text-slate-900">{selectedLoan.note}</p>
                        </div>
                      )}
                      {selectedLoan.dueDate && (
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Due Date</p>
                          <p className="font-medium text-slate-900">
                            {formatDate(selectedLoan.dueDate)}
                          </p>
                        </div>
                      )}
                    </div>

                    
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Payment History</h3>
                    {selectedLoan.paymentHistory && selectedLoan.paymentHistory.length > 0 ? (
                      <div className="space-y-4">
                        {selectedLoan.paymentHistory.map((payment, index) => (
                          <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <CheckCircle size={16} className="text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">
                                    Payment #{payment.installmentNumber || (index + 1)}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {formatDate(payment.date)} • {getTimeAgo(payment.date)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex gap-4">
                                  {payment.principalAmount > 0 && (
                                    <div>
                                      <p className="text-sm text-slate-600">Principal</p>
                                      <p className="font-medium text-green-600">
                                        {formatCurrency(payment.principalAmount )}
                                      </p>
                                    </div>
                                  )}
                                  {payment.interestAmount > 0 && (
                                    <div>
                                      <p className="text-sm text-slate-600">Interest</p>
                                      <p className="font-medium text-purple-600">
                                        {formatCurrency(payment.interestAmount )}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500 mt-1">
                                  {payment.paymentMethod} {payment.paymentReference && `• ${payment.paymentReference}`}
                                </p>
                              </div>
                            </div>
                            {payment.note && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <p className="text-sm text-slate-600">{payment.note}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock size={32} className="text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No payments recorded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-1.5 text-sm font-semibold text-slate-700 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 border border-slate-300 transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105"
            >
              Close
            </button>
            {selectedLoan && (
              <>
                <button
                  onClick={handlePrincipalPayment}
                  className={`flex-1 px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105 bg-gradient-to-r ${
                    isReceivable ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <CreditCard size={14} />
                    {isReceivable ? 'Receive Principal' : 'Pay Principal'}
                  </div>
                </button>
                <button
                  onClick={handleInterestPayment}
                  className="flex-1 px-3 py-1.5 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center justify-center gap-1">
                    <Percent size={14} />
                    {isReceivable ? 'Receive Interest' : 'Pay Interest'}
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetailModal;
