import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import csv from "fast-csv";
import moment from "moment-timezone";

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import customerRoutes from "./routes/customerRoutes.js";
import goldLoanRoutes from "./routes/goldLoanRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import udharRoutes from "./routes/udharRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import silverLoanRoutes from "./routes/silverLoanRoutes.js";
import goldRoutes from "./routes/goldRoutes.js";
import silverRoutes from "./routes/silverRoutes.js";
import bussinessExpenseRoutes from './routes/businessExpenseRoutes.js';
import { generateDailyReminders } from "./utils/reminderService.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Create exports directory if it doesn't exist
const exportsDir = path.join(__dirname, "exports");
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// Serve static files
app.use("/exports", express.static(exportsDir));

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/gold-loans", goldLoanRoutes);
app.use("/api/silver-loans", silverLoanRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/udhari", udharRoutes);
app.use('/api/gold', goldRoutes);
app.use('/api/silver', silverRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/business-expenses", bussinessExpenseRoutes);

// Enhanced CSV export endpoint with append functionality
// Complete rewrite of CSV export endpoint with proper data formatting
app.get("/api/export-all-csv", async (req, res) => {
  try {
    const timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DD_HH-mm-ss');
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="business-data_${timestamp}.csv"`);

    const collections = [
      { name: "customers", modelName: "Customer", populateFields: [] },
      { name: "goldloans", modelName: "GoldLoan", populateFields: ['customer'] },
      { name: "silverloans", modelName: "SilverLoan", populateFields: ['customer'] },
      { name: "loans", modelName: "Loan", populateFields: ['customer'] },
      { name: "udhars", modelName: "Udhar", populateFields: ['customer'] },
      { name: "transactions", modelName: "Transaction", populateFields: ['customer'] },
      { name: "businessExpenses", modelName: "BusinessExpense", populateFields: [] },
      { name: "goldtransactions", modelName: "GoldTransaction", populateFields: ['customer'] },
      { name: "silvertransactions", modelName: "SilverTransaction", populateFields: ['customer'] },
    ];

    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);

    // Export each collection
    for (const { name, modelName, populateFields } of collections) {
      try {
        const model = mongoose.models[modelName];
        if (!model) {
          console.warn(`Model ${modelName} not found`);
          continue;
        }

        // Build query with population
        let query = model.find({});
        populateFields.forEach(field => {
          if (field === 'customer') {
            query = query.populate('customer', 'name phone email city state');
          }
        });

        const documents = await query.lean().exec();
        console.log(`Found ${documents.length} documents in ${name}`);

        if (documents.length === 0) {
          csvStream.write({
            Collection: name.toUpperCase(),
            Status: 'NO_DATA',
            Count: 0,
            Message: 'No records found',
            Field1: '',
            Field2: '',
            Field3: '',
            Field4: '',
            Field5: ''
          });
          continue;
        }

        // Export based on collection type
        switch(name) {
          case 'customers':
            await exportCustomers(csvStream, documents);
            break;
          case 'goldloans':
            await exportGoldLoans(csvStream, documents);
            break;
          case 'silverloans':
            await exportSilverLoans(csvStream, documents);
            break;
          case 'loans':
            await exportLoans(csvStream, documents);
            break;
          case 'udhars':
            await exportUdhars(csvStream, documents);
            break;
          case 'transactions':
            await exportTransactions(csvStream, documents);
            break;
          case 'businessExpenses':
            await exportBusinessExpenses(csvStream, documents);
            break;
          case 'goldtransactions':
            await exportGoldTransactions(csvStream, documents);
            break;
          case 'silvertransactions':
            await exportSilverTransactions(csvStream, documents);
            break;
        }

      } catch (error) {
        console.error(`Error exporting ${name}:`, error);
        csvStream.write({
          Collection: name.toUpperCase(),
          Status: 'ERROR',
          Error: error.message,
          Field1: '', Field2: '', Field3: '', Field4: '', Field5: ''
        });
      }
    }

    csvStream.end();
  } catch (error) {
    console.error("Export error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Helper functions for each collection type
async function exportCustomers(csvStream, customers) {
  // Header
  csvStream.write({
    Collection: '--- CUSTOMERS ---',
    Field1: 'ID',
    Field2: 'Name', 
    Field3: 'Phone',
    Field4: 'Email',
    Field5: 'City'
  });

  customers.forEach(customer => {
    csvStream.write({
      Collection: 'CUSTOMER',
      Field1: customer._id?.toString() || '',
      Field2: customer.name || '',
      Field3: customer.phone || '',
      Field4: customer.email || '',
      Field5: customer.city || '',
      Field6: customer.state || '',
      Field7: customer.pincode || '',
      Field8: customer.adhaarNumber || '',
      Field9: moment(customer.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      Field10: customer.status || ''
    });
  });
}

async function exportGoldLoans(csvStream, goldLoans) {
  csvStream.write({
    Collection: '--- GOLD LOANS ---',
    Field1: 'ID',
    Field2: 'Customer Name',
    Field3: 'Customer Phone', 
    Field4: 'Loan Amount',
    Field5: 'Interest Rate'
  });

  goldLoans.forEach(loan => {
    const customerName = loan.customer?.name || 'Unknown Customer';
    const customerPhone = loan.customer?.phone || '';
    
    csvStream.write({
      Collection: 'GOLDLOAN',
      Field1: loan._id?.toString() || '',
      Field2: customerName,
      Field3: customerPhone,
      Field4: loan.totalLoanAmount || 0,
      Field5: loan.interestRateMonthlyPct || 0,
      Field6: loan.currentPrincipal || 0,
      Field7: loan.outstandingAmount || 0,
      Field8: loan.status || '',
      Field9: moment(loan.startDate).format('YYYY-MM-DD'),
      Field10: loan.items?.length || 0,
      Field11: loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0,
      Field12: moment(loan.createdAt).format('YYYY-MM-DD HH:mm:ss')
    });
  });
}

async function exportSilverLoans(csvStream, silverLoans) {
  csvStream.write({
    Collection: '--- SILVER LOANS ---',
    Field1: 'ID',
    Field2: 'Customer Name',
    Field3: 'Customer Phone',
    Field4: 'Loan Amount', 
    Field5: 'Interest Rate'
  });

  silverLoans.forEach(loan => {
    const customerName = loan.customer?.name || 'Unknown Customer';
    const customerPhone = loan.customer?.phone || '';
    
    csvStream.write({
      Collection: 'SILVERLOAN',
      Field1: loan._id?.toString() || '',
      Field2: customerName,
      Field3: customerPhone,
      Field4: loan.totalLoanAmount || 0,
      Field5: loan.interestRateMonthlyPct || 0,
      Field6: loan.currentPrincipal || 0,
      Field7: loan.outstandingAmount || 0,
      Field8: loan.status || '',
      Field9: moment(loan.startDate).format('YYYY-MM-DD'),
      Field10: loan.items?.length || 0,
      Field11: loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0,
      Field12: moment(loan.createdAt).format('YYYY-MM-DD HH:mm:ss')
    });
  });
}

async function exportLoans(csvStream, loans) {
  csvStream.write({
    Collection: '--- LOANS ---',
    Field1: 'ID',
    Field2: 'Customer Name',
    Field3: 'Customer Phone',
    Field4: 'Type',
    Field5: 'Principal Amount'
  });

  loans.forEach(loan => {
    const customerName = loan.customer?.name || 'Unknown Customer';
    const customerPhone = loan.customer?.phone || '';
    
    csvStream.write({
      Collection: 'LOAN',
      Field1: loan._id?.toString() || '',
      Field2: customerName,
      Field3: customerPhone,
      Field4: loan.loanType || '',
      Field5: (loan.principalPaise ) || 0,
      Field6: (loan.outstandingPrincipal ) || 0,
      Field7: loan.interestRateMonthlyPct || 0,
      Field8: loan.status || '',
      Field9: moment(loan.takenDate).format('YYYY-MM-DD'),
      Field10: (loan.totalPrincipalPaid ) || 0,
      Field11: (loan.totalInterestPaid ) || 0,
      Field12: moment(loan.createdAt).format('YYYY-MM-DD HH:mm:ss')
    });
  });
}

async function exportUdhars(csvStream, udhars) {
  csvStream.write({
    Collection: '--- UDHARS ---',
    Field1: 'ID',
    Field2: 'Customer Name',
    Field3: 'Customer Phone',
    Field4: 'Type',
    Field5: 'Principal Amount'
  });

  udhars.forEach(udhar => {
    const customerName = udhar.customer?.name || 'Unknown Customer';
    const customerPhone = udhar.customer?.phone || '';
    
    csvStream.write({
      Collection: 'UDHAR',
      Field1: udhar._id?.toString() || '',
      Field2: customerName,
      Field3: customerPhone,
      Field4: udhar.udharType || '',
      Field5: (udhar.principalPaise ) || 0,
      Field6: (udhar.outstandingPrincipal ) || 0,
      Field7: udhar.status || '',
      Field8: moment(udhar.takenDate).format('YYYY-MM-DD'),
      Field9: udhar.paymentHistory?.length || 0,
      Field10: udhar.totalInstallments || 0,
      Field11: udhar.paidInstallments || 0,
      Field12: moment(udhar.createdAt).format('YYYY-MM-DD HH:mm:ss')
    });
  });
}

async function exportTransactions(csvStream, transactions) {
  csvStream.write({
    Collection: '--- TRANSACTIONS ---',
    Field1: 'ID',
    Field2: 'Type',
    Field3: 'Customer Name',
    Field4: 'Amount',
    Field5: 'Direction'
  });

  transactions.forEach(transaction => {
    const customerName = transaction.customer?.name || 'No Customer';
    
    csvStream.write({
      Collection: 'TRANSACTION',
      Field1: transaction._id?.toString() || '',
      Field2: transaction.type || '',
      Field3: customerName,
      Field4: transaction.amount || 0,
      Field5: transaction.direction || 0,
      Field6: transaction.description || '',
      Field7: transaction.category || '',
      Field8: moment(transaction.date).format('YYYY-MM-DD'),
      Field9: transaction.metadata?.paymentType || '',
      Field10: transaction.metadata?.paymentMethod || '',
      Field11: transaction.relatedModel || '',
      Field12: moment(transaction.createdAt).format('YYYY-MM-DD HH:mm:ss')
    });
  });
}

async function exportBusinessExpenses(csvStream, expenses) {
  csvStream.write({
    Collection: '--- BUSINESS EXPENSES ---',
    Field1: 'ID',
    Field2: 'Reference Number',
    Field3: 'Category',
    Field4: 'Title',
    Field5: 'Gross Amount'
  });

  expenses.forEach(expense => {
    csvStream.write({
      Collection: 'EXPENSE',
      Field1: expense._id?.toString() || '',
      Field2: expense.referenceNumber || '',
      Field3: expense.category || '',
      Field4: expense.title || '',
      Field5: (expense.grossAmount ) || 0,
      Field6: (expense.netAmount ) || 0,
      Field7: expense.vendor?.name || '',
      Field8: moment(expense.expenseDate).format('YYYY-MM-DD'),
      Field9: expense.paymentMethod || '',
      Field10: (expense.paidAmount ) || 0,
      Field11: (expense.pendingAmount ) || 0,
      Field12: moment(expense.createdAt).format('YYYY-MM-DD HH:mm:ss')
    });
  });
}

async function exportGoldTransactions(csvStream, transactions) {
  csvStream.write({
    Collection: '--- GOLD TRANSACTIONS ---',
    Field1: 'ID',
    Field2: 'Type',
    Field3: 'Customer Name',
    Field4: 'Total Amount',
    Field5: 'Total Weight'
  });

  transactions.forEach(transaction => {
    const customerName = transaction.customer?.name || 'No Customer';
    
    csvStream.write({
      Collection: 'GOLDTRANSACTION',
      Field1: transaction._id?.toString() || '',
      Field2: transaction.transactionType || '',
      Field3: customerName,
      Field4: (transaction.totalAmount ) || 0,
      Field5: transaction.totalWeight || 0,
      Field6: transaction.invoiceNumber || '',
      Field7: moment(transaction.date).format('YYYY-MM-DD'),
      Field8: transaction.paymentMode || '',
      Field9: (transaction.advanceAmount ) || 0,
      Field10: (transaction.remainingAmount ) || 0,
      Field11: transaction.items?.length || 0,
      Field12: moment(transaction.createdAt).format('YYYY-MM-DD HH:mm:ss')
    });
  });
}

async function exportSilverTransactions(csvStream, transactions) {
  csvStream.write({
    Collection: '--- SILVER TRANSACTIONS ---',
    Field1: 'ID',
    Field2: 'Type',
    Field3: 'Customer Name', 
    Field4: 'Total Amount',
    Field5: 'Total Weight'
  });

  transactions.forEach(transaction => {
    const customerName = transaction.customer?.name || 'No Customer';
    
    csvStream.write({
      Collection: 'SILVERTRANSACTION',
      Field1: transaction._id?.toString() || '',
      Field2: transaction.transactionType || '',
      Field3: customerName,
      Field4: (transaction.totalAmount ) || 0,
      Field5: transaction.totalWeight || 0,
      Field6: transaction.invoiceNumber || '',
      Field7: moment(transaction.date).format('YYYY-MM-DD'),
      Field8: transaction.paymentMode || '',
      Field9: (transaction.advanceAmount ) || 0,
      Field10: (transaction.remainingAmount ) || 0,
      Field11: transaction.items?.length || 0,
      Field12: moment(transaction.createdAt).format('YYYY-MM-DD HH:mm:ss')
    });
  });
}
// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/jewellery_business", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    setInterval(() => {
      generateDailyReminders();
    }, 24 * 60 * 60 * 1000);
    generateDailyReminders();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;