// react/src/components/Loan/LoanCard.jsx
import React, { useState } from 'react';
import { 
  Edit3, 
  Eye, 
  Phone, 
  Calendar, 
  Coins, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  User,
  MessageSquare,
  Camera,
  MapPin,
  Clock,
  Percent,
  History,
  Receipt,
  CreditCard,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  TrendingUp
} from 'lucide-react';
import LInterestPaymentModal from './LInterestPaymentModal';
import LoanPaymentModal from './LoanPaymentModal';

export const LoanCard = ({ loan, onEdit, onView, onPayment, onSendReminder }) => {
  const [showInterestPaymentModal, setShowInterestPaymentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const actualLoan = loan.loans?.[0] || {};

  const getStatusConfig = (status) => {
    const configs = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Active' },
      OVERDUE: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Overdue' },
      PARTIALLY_PAID: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Partial' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' },
      DEFAULTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Defaulted' }
    };
    return configs[status] || configs.ACTIVE;
  };

  const getDaysUntilDue = () => {
    if (!actualLoan.dueDate) return 0;
    const today = new Date();
    const dueDate = new Date(actualLoan.dueDate);
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const statusConfig = getStatusConfig(actualLoan.status);
  const StatusIcon = statusConfig.icon;
  const daysUntilDue = getDaysUntilDue();
  const isOverdue = false;
  const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => date ? date.toLocaleDateString('en-IN') : 'N/A';
  const formatDateTime = (date) => date ? new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : 'N/A';

  const loanAmount = actualLoan.originalAmount || 0; 
  const outstandingAmount = actualLoan.outstandingAmount || 0;
  const interestRate = actualLoan.interestRateMonthlyPct || 0;

  // Calculate payment summaries from the payments array
  const interestPayments = actualLoan.paymentHistory?.filter(p => p.interestAmount > 0) || [];
  const principalPayments = actualLoan.paymentHistory?.filter(p => p.principalAmount > 0) || [];
  
  const totalInterestPaid = interestPayments.reduce((sum, p) => sum + (p.interestAmount || 0), 0) / 100;
  const totalPrincipalPaid = principalPayments.reduce((sum, p) => sum + (p.principalAmount || 0), 0) / 100;

  const handleInterestPaymentSuccess = (result) => {
    console.log('Interest payment successful:', result);
    setShowInterestPaymentModal(false);
    if (onPayment) {
      onPayment(loan);
    }
  };

  const handleItemRepaymentSuccess = (result) => {
    console.log('Item repayment successful:', result);
    if (onPayment) {
      onPayment(loan);
    }
  };

  return (
    <>
      <div 
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full"
        onClick={() => onView && onView()}
      >
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-5 border-b border-amber-100">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-amber-100 flex-shrink-0">
                <DollarSign size={20} className="sm:w-6 sm:h-6 drop-shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{actualLoan._id || 'Loan'}</h3>
                <p className="text-xs sm:text-sm text-amber-700 font-medium truncate">
                  {loan.loans?.length || 0} loans
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {(isOverdue || isDueSoon) && (
                <AlertTriangle size={16} className={`sm:w-[18px] sm:h-[18px] ${isOverdue ? 'text-red-500' : 'text-yellow-500'}`} />
              )}
              <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {(isOverdue || isDueSoon) && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-red-800">
                {isOverdue 
                  ? `Payment overdue by ${Math.abs(daysUntilDue)} days`
                  : `Payment due in ${daysUntilDue} days`
                }
              </span>
            </div>
          </div>
        )}

        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <User size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {loan.customer?.name || 'Unknown Customer'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 ml-6 sm:ml-0">
              <Phone size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0" />
              <span className="truncate">{loan.customer?.phone || 'N/A'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl">
              <div className="text-sm sm:text-lg font-bold text-gray-900 mb-1">
                {formatCurrency(loanAmount)}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                Loan Amount
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg sm:rounded-xl border border-red-100">
              <div className="text-sm sm:text-lg font-bold text-red-600 mb-1">
                {formatCurrency(outstandingAmount)}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                Outstanding
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-xs sm:text-sm">
              <span className="text-gray-600">Interest Rate:</span>
              <span className="font-semibold text-gray-900">
                {interestRate}% /month
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600">Due: {formatDate(actualLoan.dueDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 ml-6 sm:ml-0">
              <TrendingUp size={14} className="sm:w-4 sm:h-4" />
              <span>₹{totalPrincipalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })} paid</span>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-5 pb-3 sm:pb-5">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView && onView();
              }}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Eye size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">View Details</span>
              <span className="xs:hidden">View</span>
            </button>
            
            {actualLoan.status !== "CLOSED" && (
              <div className="relative group">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white 
                            bg-gradient-to-r from-green-500 to-green-600 
                            hover:from-green-600 hover:to-green-700 
                            rounded-lg shadow-sm transition-all"
                >
                  <DollarSign size={16} />
                  Payment
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-9" />
                  </svg>
                </button>
              
                <div className="absolute bottom-full left-0 mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInterestPaymentModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Interest Payment
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPaymentModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-md transition-colors"
                    >
                      Principal Payment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(isOverdue || isDueSoon) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendReminder && onSendReminder(loan);
                }}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-600 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <MessageSquare size={14} className="sm:w-4 sm:h-4" />
                Remind
              </button>
            )}
          </div>
        </div>
      </div>
      
      <LInterestPaymentModal
        isOpen={showInterestPaymentModal}
        onClose={() => setShowInterestPaymentModal(false)}
        loan={actualLoan}
        onSuccess={handleInterestPaymentSuccess}
      />
      <LoanPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        loan={actualLoan}
        onSuccess={handleItemRepaymentSuccess}
      />
    </>
  );
};

export default LoanCard;