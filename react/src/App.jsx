import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ExpenseProvider } from './context/ExpenseContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout';
import Customers from './pages/Customers';
import Udhaar from './pages/Udhaar';
import GoldLoan from './pages/GoldLoan';
import SilverLoan from './pages/SilverLoan';
import Loan from './pages/Loan';
import BusinessExpense from './pages/BusinessExpense';
import Transactions from './pages/Transactions';
import GoldBuySell from './pages/GoldBuySell';
import SilverBuySell from './pages/SilverBuySell';
import Analysis from './pages/Analysis';
import Setting from './pages/Setting';
import Auth from './pages/Auth.jsx';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ExpenseProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Transactions />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Customers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/udhaar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Udhaar />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gold-loan"
              element={
                <ProtectedRoute>
                  <Layout>
                    <GoldLoan />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/silver-loan"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SilverLoan />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loan"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Loan />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/business-expense"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BusinessExpense />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Transactions />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gold-buy-sell"
              element={
                <ProtectedRoute>
                  <Layout>
                    <GoldBuySell />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/silver-buy-sell"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SilverBuySell />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Analysis />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/setting"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Setting />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ExpenseProvider>
    </AuthProvider>
  );
}

export default App;