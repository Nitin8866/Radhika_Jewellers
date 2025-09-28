import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calculator } from "lucide-react";
import ApiService from "../../services/api";

const SummaryCards = () => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState("daily");

  useEffect(() => {
    fetchDashboardStats();
  }, [timePeriod]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getDashboardStats({ period: timePeriod });
      console.log(`Dashboard Stats Response (${timePeriod}):`, response.data.financials);
      if (response && response.data) {
        const data = response.data.financials?.[timePeriod] || {};
        const totalIncome = data.income || 0;
        const totalExpenses = data.expense || 0;
        const netProfit = data.netIncome || 0;
        const profitMargin = totalIncome > 0 ? Number(((netProfit / totalIncome) * 100).toFixed(2)) : 0;

        setStats({
          totalIncome,
          totalExpenses,
          netProfit,
          profitMargin
        });
      } else {
        setStats({
          totalIncome: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0
        });
      }
    } catch (error) {
      console.error(`Failed to fetch ${timePeriod} dashboard stats:`, error);
      setError(`Failed to load ${timePeriod} dashboard statistics`);
      setStats({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCompactCurrency = (amount) => {
    if (typeof amount !== "number") {
      amount = parseFloat(amount) || 0;
    }
    
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(absAmount * (isNegative ? -1 : 1));
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 min-w-[200px] max-w-[300px] p-4 rounded-lg shadow-sm border border-gray-200 bg-white">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium text-sm">Dashboard Error</div>
          <div className="text-red-600 text-xs mt-1">{error}</div>
          <button
            onClick={fetchDashboardStats}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summaryData = [
    {
      title: "Total Income",
      value: formatCompactCurrency(stats.totalIncome),
      icon: TrendingUp,
      color: "emerald",
      bgGradient: "from-emerald-500 to-green-600",
      subtitle: "Money received",
      trend: "+12.5% from last period"
    },
    {
      title: "Total Expenses",
      value: formatCompactCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: "rose",
      bgGradient: "from-rose-500 to-red-600",
      subtitle: "Money spent",
      trend: "-5.2% from last period"
    },
    {
      title: "Net Profit",
      value: formatCompactCurrency(stats.netProfit),
      icon: DollarSign,
      color: stats.netProfit >= 0 ? "blue" : "red",
      bgGradient: stats.netProfit >= 0 ? "from-blue-500 to-indigo-600" : "from-red-500 to-rose-600",
      subtitle: "Income - Expenses",
      trend: `${stats.profitMargin.toFixed(2)}% margin`
    },
    {
      title: "Profit Margin",
      value: `${stats.profitMargin.toFixed(2)}%`,
      icon: Calculator,
      color: stats.profitMargin >= 0 ? "purple" : "orange",
      bgGradient: stats.profitMargin >= 0 ? "from-purple-500 to-indigo-600" : "from-orange-500 to-red-600",
      subtitle: "Profit efficiency",
      trend: stats.netProfit >= 0 ? "Profitable" : "Review expenses"
    }
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 mb-8">
      {/* Time Period Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {["Daily", "Monthly", "Yearly"].map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period.toLowerCase())}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timePeriod === period.toLowerCase()
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-4">
        {summaryData.map((item, index) => (
          <div
            key={index}
            className="flex-1 min-w-[200px] max-w-[300px] bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 bg-gradient-to-r ${item.bgGradient} rounded-lg flex items-center justify-center shadow-md`}
              >
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-right ml-2 flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {item.title}
                </p>
              </div>
            </div>
            <div className="mb-3">
              <h3
                className={`text-lg font-bold ${
                  item.title === "Net Profit"
                    ? stats.netProfit >= 0
                      ? "text-blue-600"
                      : "text-red-600"
                    : `text-${item.color}-600`
                } truncate`}
              >
                {item.value}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p
                className={`text-xs font-medium ${
                  item.trend.includes("+") || item.trend.includes("Profitable")
                    ? "text-green-600"
                    : item.trend.includes("Review")
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {item.trend}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryCards;
