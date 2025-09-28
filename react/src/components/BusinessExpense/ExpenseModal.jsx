import React, { useState, useEffect } from 'react';
import { Plus, Edit2, CheckCircle2, XCircle } from 'lucide-react';

const ExpenseModal = ({ isEdit, editingExpense, onAdd, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && editingExpense) {
      const expenseId = editingExpense.id || editingExpense._id;
      if (!expenseId) {
        console.warn('Warning: Expense ID not found in editing expense:', editingExpense);
      }

      let expenseDate = editingExpense.date || editingExpense.expenseDate;
      if (expenseDate) {
        expenseDate = new Date(expenseDate).toISOString().split('T')[0];
      } else {
        expenseDate = new Date().toISOString().split('T')[0];
      }

      const grossAmount = editingExpense.amount || editingExpense.grossAmount || 0;

      setFormData({
        id: expenseId,
        date: expenseDate,
        description: editingExpense.description || '',
        amount: grossAmount.toString(), // Assume rupees from backend
      });
    } else {
      // Reset form for new expense
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
      });
    }
  }, [isEdit, editingExpense]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.date) newErrors.date = 'Date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setSuccess(false);
    setErrors((prev) => ({ ...prev, general: '' }));

    // Construct minimal expense data for backend
    const expenseData = {
      category: 'MISCELLANEOUS',
      title: formData.description.trim(),
      description: formData.description.trim(),
      vendor: {
        name: 'Unknown Vendor',
      },
      grossAmount: parseFloat(formData.amount), // Send in rupees
      taxDetails: {
        totalTax: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        cess: 0,
      },
      paymentStatus: 'PENDING',
      expenseDate: formData.date,
    };

    console.log('Submitting amount:', formData.amount, typeof parseFloat(formData.amount));
    console.log('Sending create data:', expenseData);

    const result = isEdit
      ? await onUpdate(formData.id, expenseData)
      : await onAdd(expenseData);

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        resetForm();
        setSuccess(false);
      }, 2000);
    } else {
      setErrors((prev) => ({ ...prev, general: result.message || 'Failed to save expense: Unknown error' }));
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
                {isEdit ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isEdit ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <p className="text-sm text-slate-600">
                  {isEdit ? 'Update expense details' : 'Enter expense information'}
                </p>
              </div>
            </div>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              disabled={loading}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Show success message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-green-600 text-sm">Expense saved successfully!</p>
            </div>
          )}

          {/* Show general error if any */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Debug info - remove in production */}
          {isEdit && process.env.NODE_ENV === 'development' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-600 text-xs">Debug: Editing expense ID: {formData.id || 'NOT FOUND'}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
              Expense Information
            </h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Transaction Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 ${
                  errors.date ? 'border-red-300' : 'border-slate-300'
                }`}
                required
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the expense..."
                rows="3"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 resize-none ${
                  errors.description ? 'border-red-300' : 'border-slate-300'
                }`}
                required
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Amount (₹) *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 ${
                  errors.amount ? 'border-red-300' : 'border-slate-300'
                }`}
                required
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 rounded-b-2xl -mx-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors font-semibold shadow-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;