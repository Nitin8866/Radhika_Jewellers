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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.get("/api/export-all-csv", async (req, res) => {
  try {
    // Define the CSV file path
    const csvFilePath = path.join(exportsDir, "daily-data.csv");

    // Define today's date range in IST
    const today = moment().tz('Asia/Kolkata').startOf('day').toDate();
    const tomorrow = moment(today).add(1, 'day').toDate();
    const dateHeader = `Data for ${moment(today).format('YYYY-MM-DD')}`;

    // Log timezone and date range for debugging
    console.log(`Exporting data for ${dateHeader}`);
    console.log(`Query date range: ${today.toISOString()} to ${tomorrow.toISOString()}`);

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="daily-data.csv"');

    // Initialize CSV stream for response
    const csvStream = csv.format({ headers: true, quoteColumns: true });
    csvStream.pipe(res);

    // Initialize file append stream
    const fileStream = fs.createWriteStream(csvFilePath, { flags: 'a' });
    const appendCsvStream = csv.format({ headers: false, quoteColumns: true });
    appendCsvStream.pipe(fileStream);

    // Write date header and separator if appending
    if (fs.existsSync(csvFilePath)) {
      csvStream.write({ Header: '--- Append Separator ---' });
      appendCsvStream.write({ Header: '--- Append Separator ---' });
    }
    csvStream.write({ Header: dateHeader });
    appendCsvStream.write({ Header: dateHeader });

    const collections = [
      { name: "customers", modelName: "Customer" },
      { name: "goldloans", modelName: "GoldLoan" },
      { name: "silverloans", modelName: "SilverLoan" },
      { name: "loans", modelName: "Loan" },
      { name: "udhars", modelName: "Udhar" },
      { name: "transactions", modelName: "Transaction" },
      { name: "businessExpenses", modelName: "BusinessExpense" },
      { name: "goldtransactions", modelName: "GoldTransaction" },
      { name: "silvertransactions", modelName: "SilverTransaction" },
    ];

    // Helper function to format dates
    const formatDate = (date) => {
      return date ? moment(date).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss') : '';
    };

    // Helper function to format amounts (convert paise to rupees)
    const formatAmount = (amount) => {
      return amount != null ? (amount / 100).toFixed(2) : '';
    };

    // Iterate through collections
    for (const { name, modelName } of collections) {
      try {
        const model = mongoose.models[modelName];
        if (!model) {
          console.warn(`Model ${modelName} not found for collection ${name}`);
          csvStream.write({ Header: `--- ${name} (skipped: model not found) ---` });
          appendCsvStream.write({ Header: `--- ${name} (skipped: model not found) ---` });
          continue;
        }

        // Write collection header
        csvStream.write({ Header: `--- ${name} ---` });
        appendCsvStream.write({ Header: `--- ${name} ---` });

        // Define headers based on collection
        let headers = {};
        let rowMapper = (doc) => doc;

        switch (name) {
          case 'customers':
            headers = {
              id: 'ID',
              name: 'Name',
              phone: 'Phone',
              adhaarNumber: 'Aadhaar Number',
              email: 'Email',
              'address.street': 'Street',
              'address.city': 'City',
              'address.state': 'State',
              'address.pincode': 'Pincode',
              totalAmountTakenFromJewellers: 'Amount Taken From Jewellers (₹)',
              totalAmountTakenByUs: 'Amount Taken By Us (₹)',
              status: 'Status',
              createdAt: 'Created At',
              updatedAt: 'Updated At'
            };
            rowMapper = (doc) => ({
              id: doc._id.toString(),
              name: doc.name || '',
              phone: doc.phone || '',
              adhaarNumber: doc.adhaarNumber || '',
              email: doc.email || '',
              'address.street': doc.address?.street || '',
              'address.city': doc.address?.city || '',
              'address.state': doc.address?.state || '',
              'address.pincode': doc.address?.pincode || '',
              totalAmountTakenFromJewellers: formatAmount(doc.totalAmountTakenFromJewellers),
              totalAmountTakenByUs: formatAmount(doc.totalAmountTakenByUs),
              status: doc.status || '',
              createdAt: formatDate(doc.createdAt),
              updatedAt: formatDate(doc.updatedAt)
            });
            break;

          case 'goldloans':
          case 'silverloans':
            headers = {
              id: 'ID',
              customer: 'Customer ID',
              totalLoanAmount: 'Total Loan Amount (₹)',
              currentPrincipal: 'Current Principal (₹)',
              outstandingAmount: 'Outstanding Amount (₹)',
              interestRateMonthlyPct: 'Monthly Interest Rate (%)',
              status: 'Status',
              startDate: 'Start Date',
              dueDate: 'Due Date',
              closureDate: 'Closure Date',
              items: 'Items',
              createdAt: 'Created At'
            };
            rowMapper = (doc) => ({
              id: doc._id.toString(),
              customer: doc.customer?.toString() || '',
              totalLoanAmount: formatAmount(doc.totalLoanAmount),
              currentPrincipal: formatAmount(doc.currentPrincipal),
              outstandingAmount: formatAmount(doc.outstandingAmount),
              interestRateMonthlyPct: doc.interestRateMonthlyPct?.toFixed(2) || '',
              status: doc.status || '',
              startDate: formatDate(doc.startDate),
              dueDate: formatDate(doc.dueDate),
              closureDate: formatDate(doc.closureDate),
              items: doc.items?.map(item => 
                `${item.name} (${item.weightGram}g, ${item.purityK}K)`
              ).join('; ') || '',
              createdAt: formatDate(doc.createdAt)
            });
            break;

          case 'loans':
            headers = {
              id: 'ID',
              customer: 'Customer ID',
              loanType: 'Loan Type',
              principalPaise: 'Principal Amount (₹)',
              outstandingPrincipal: 'Outstanding Principal (₹)',
              interestRateMonthlyPct: 'Monthly Interest Rate (%)',
              status: 'Status',
              takenDate: 'Taken Date',
              dueDate: 'Due Date',
              createdAt: 'Created At'
            };
            rowMapper = (doc) => ({
              id: doc._id.toString(),
              customer: doc.customer?.toString() || '',
              loanType: doc.loanType || '',
              principalPaise: formatAmount(doc.principalPaise),
              outstandingPrincipal: formatAmount(doc.outstandingPrincipal),
              interestRateMonthlyPct: doc.interestRateMonthlyPct?.toFixed(2) || '',
              status: doc.status || '',
              takenDate: formatDate(doc.takenDate),
              dueDate: formatDate(doc.dueDate),
              createdAt: formatDate(doc.createdAt)
            });
            break;

          case 'udhars':
            headers = {
              id: 'ID',
              customer: 'Customer ID',
              udharType: 'Udhar Type',
              principalPaise: 'Principal Amount (₹)',
              outstandingPrincipal: 'Outstanding Principal (₹)',
              status: 'Status',
              takenDate: 'Taken Date',
              dueDate: 'Due Date',
              createdAt: 'Created At'
            };
            rowMapper = (doc) => ({
              id: doc._id.toString(),
              customer: doc.customer?.toString() || '',
              udharType: doc.udharType || '',
              principalPaise: formatAmount(doc.principalPaise),
              outstandingPrincipal: formatAmount(doc.outstandingPrincipal),
              status: doc.status || '',
              takenDate: formatDate(doc.takenDate),
              dueDate: formatDate(doc.dueDate),
              createdAt: formatDate(doc.createdAt)
            });
            break;

          case 'transactions':
            headers = {
              id: 'ID',
              type: 'Type',
              customer: 'Customer ID',
              amount: 'Amount (₹)',
              direction: 'Direction',
              description: 'Description',
              date: 'Date',
              category: 'Category',
              relatedDoc: 'Related Document ID',
              relatedModel: 'Related Model',
              createdAt: 'Created At'
            };
            rowMapper = (doc) => ({
              id: doc._id.toString(),
              type: doc.type || '',
              customer: doc.customer?.toString() || '',
              amount: formatAmount(doc.amount),
              direction: doc.transactionDirection || doc.direction || '',
              description: doc.description || '',
              date: formatDate(doc.date),
              category: doc.category || '',
              relatedDoc: doc.relatedDoc?.toString() || '',
              relatedModel: doc.relatedModel || '',
              createdAt: formatDate(doc.createdAt)
            });
            break;

          case 'businessExpenses':
            headers = {
              id: 'ID',
              referenceNumber: 'Reference Number',
              category: 'Category',
              title: 'Title',
              description: 'Description',
              'vendor.name': 'Vendor Name',
              grossAmount: 'Gross Amount (₹)',
              netAmount: 'Net Amount (₹)',
              paidAmount: 'Paid Amount (₹)',
              pendingAmount: 'Pending Amount (₹)',
              expenseDate: 'Expense Date',
              dueDate: 'Due Date',
              createdAt: 'Created At'
            };
            rowMapper = (doc) => ({
              id: doc._id.toString(),
              referenceNumber: doc.referenceNumber || '',
              category: doc.category || '',
              title: doc.title || '',
              description: doc.description || '',
              'vendor.name': doc.vendor?.name || '',
              grossAmount: formatAmount(doc.grossAmount),
              netAmount: formatAmount(doc.netAmount),
              paidAmount: formatAmount(doc.paidAmount),
              pendingAmount: formatAmount(doc.pendingAmount),
              expenseDate: formatDate(doc.expenseDate),
              dueDate: formatDate(doc.dueDate),
              createdAt: formatDate(doc.createdAt)
            });
            break;

          case 'goldtransactions':
          case 'silvertransactions':
            headers = {
              id: 'ID',
              transactionType: 'Transaction Type',
              customer: 'Customer ID',
              'supplier.name': 'Supplier Name',
              totalWeight: 'Total Weight (g)',
              totalAmount: 'Total Amount (₹)',
              advanceAmount: 'Advance Amount (₹)',
              remainingAmount: 'Remaining Amount (₹)',
              paymentMode: 'Payment Mode',
              invoiceNumber: 'Invoice Number',
              date: 'Date',
              createdAt: 'Created At',
              items: 'Items'
            };
            rowMapper = (doc) => ({
              id: doc._id.toString(),
              transactionType: doc.transactionType || '',
              customer: doc.customer?.toString() || '',
              'supplier.name': doc.supplier?.name || '',
              totalWeight: doc.totalWeight?.toFixed(2) || '',
              totalAmount: formatAmount(doc.totalAmount),
              advanceAmount: formatAmount(doc.advanceAmount),
              remainingAmount: formatAmount(doc.remainingAmount),
              paymentMode: doc.paymentMode || '',
              invoiceNumber: doc.invoiceNumber || '',
              date: formatDate(doc.date),
              createdAt: formatDate(doc.createdAt),
              items: doc.items?.map(item => 
                `${item.itemName} (${item.weight}g, ${item.purity})`
              ).join('; ') || ''
            });
            break;

          default:
            headers = { id: 'ID' };
            rowMapper = (doc) => ({ id: doc._id.toString() });
        }

        // Write headers for the collection
        csvStream.write(headers);
        appendCsvStream.write(headers);

        // Fetch documents created today
        const query = {
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        };
        const cursor = name === 'customers' 
          ? model.find(query).lean().cursor() 
          : model.find(query).populate('customer', 'name phone').lean().cursor();

        // Stream documents
        let count = 0;
        for await (const doc of cursor) {
          const row = rowMapper(doc);
          csvStream.write(row);
          appendCsvStream.write(row);
          count++;
        }

        // If no documents found, try fetching all data (for debugging)
        if (count === 0) {
          console.log(`No documents found in ${name} for ${dateHeader}. Trying all data...`);
          const allDocsCursor = name === 'customers' 
            ? model.find().lean().cursor() 
            : model.find().populate('customer', 'name phone').lean().cursor();
          let allCount = 0;
          for await (const doc of allDocsCursor) {
            allCount++;
          }
          console.log(`Total documents in ${name}: ${allCount}`);
          csvStream.write({ Header: `No data for ${name} on ${dateHeader} (Total documents: ${allCount})` });
          appendCsvStream.write({ Header: `No data for ${name} on ${dateHeader} (Total documents: ${allCount})` });
        }

        // Add an empty row after each collection
        csvStream.write({});
        appendCsvStream.write({});
        console.log(`Exported ${count} documents from ${name} for ${dateHeader}`);
      } catch (collectionError) {
        console.error(`Error exporting collection ${name}:`, collectionError);
        csvStream.write({ Header: `--- ${name} (skipped: ${collectionError.message}) ---` });
        appendCsvStream.write({ Header: `--- ${name} (skipped: ${collectionError.message}) ---` });
        csvStream.write({});
        appendCsvStream.write({});
      }
    }

    // End streams
    csvStream.end();
    appendCsvStream.end();

    // Handle file stream errors
    fileStream.on('error', (error) => {
      console.error(`Error writing to file ${csvFilePath}:`, error);
    });
    fileStream.on('finish', () => {
      console.log(`Data appended to ${csvFilePath}`);
    });
  } catch (error) {
    console.error("Export endpoint error:", error);
    res.status(500).json({ success: false, error: `Failed to export data: ${error.message}` });
  }
});

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