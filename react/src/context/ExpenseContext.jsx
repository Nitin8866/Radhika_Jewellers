import React, { createContext, useState, useCallback } from 'react';
import ApiService from '../services/api';

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [onExpenseAdded, setOnExpenseAdded] = useState(null);

  const handleAddExpense = async (expenseData) => {
    try {
      const response = await ApiService.createExpense(expenseData);
      console.log('New Expense Added:', response.data);
      setShowAddExpense(false);
      if (typeof onExpenseAdded === 'function') {
        onExpenseAdded();
      }
      return { success: true, data: response.data }; // Return success for ExpenseModal
    } catch (error) {
      console.error('Error adding expense:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : null,
        request: error.request ? error.request : null
      });
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      return { success: false, message: `Failed to add expense: ${errorMessage}` };
    }
  };

  const handleUpdateExpense = async (id, expenseData) => {
    try {
      await ApiService.updateExpense(id, expenseData);
      console.log('Expense Updated:', id);
      setShowAddExpense(false);
      setEditingExpense(null);
      if (typeof onExpenseAdded === 'function') {
        onExpenseAdded();
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating expense:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : null,
        request: error.request ? error.request : null
      });
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      return { success: false, message: `Failed to update expense: ${errorMessage}` };
    }
  };

  const handleCloseModal = () => {
    setShowAddExpense(false);
    setEditingExpense(null);
  };

  return (
    <ExpenseContext.Provider
      value={{
        showAddExpense,
        setShowAddExpense,
        editingExpense,
        setEditingExpense,
        handleAddExpense,
        handleUpdateExpense,
        handleCloseModal,
        setOnExpenseAdded,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};