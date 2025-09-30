import React from 'react';
import { DollarSign, Percent, FileText, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

const LoanCard = ({ loan, type, onView }) => {
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

  const customer = loan.customer || {};
  const isReceivable = type === 'receivable';
  // Calculate total principal and outstanding for all loans
  const totalPrincipal = loan.loans.reduce((sum, l) => sum + l.principalRupees, 0);
  const totalOutstanding = loan.loans.reduce((sum, l) => sum + l.outstandingRupees, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header Section */}
      <div className={`p-4 ${isReceivable ? 'bg-gradient-to-r from-red-50 to-rose-50' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-semibold text-white shadow-sm ${
            isReceivable ? 'bg-red-600' : 'bg-green-600'
          }`}>
            {getInitials(customer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate">{customer.name}</h3>
            <p className="text-sm text-slate-600">{customer.phone}</p>
          </div>
          <div className={`p-2 rounded-lg ${isReceivable ? 'bg-red-100' : 'bg-green-100'}`}>
            {isReceivable ? (
              <TrendingUp size={18} className="text-red-600" />
            ) : (
              <TrendingDown size={18} className="text-green-600" />
            )}
          </div>
        </div>
      </div>

      {/* Outstanding Amount Section */}
      <div className="px-4 py-5 border-b border-slate-100">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Outstanding</span>
          <span className={`text-2xl font-bold ${isReceivable ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(totalOutstanding)}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="px-4 py-4 bg-slate-50">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Active Loans</p>
              <p className="text-sm font-semibold text-slate-900">{loan.loans.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <DollarSign size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Principal</p>
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(totalPrincipal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-2 bg-white">
        <button
          onClick={onView}
          className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm flex items-center justify-center gap-2 border border-slate-200"
        >
          <FileText size={16} />
          View Details
        </button>
      </div>
    </div>
  );
};

export default LoanCard;