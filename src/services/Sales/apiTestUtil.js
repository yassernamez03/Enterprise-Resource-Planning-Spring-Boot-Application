// API Test Utility for Sales Module
// Use this in the browser console to test backend connectivity

export const testSalesApi = async () => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8443/api";
  const token = localStorage.getItem("auth_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` })
  };

  const tests = [
    {
      name: "Sales Summary",
      url: `${baseUrl}/sales/reports/sales-summary?startDate=2024-01-01T00:00:00&endDate=2024-12-31T23:59:59`,
      expected: "SalesSummaryReport object"
    },
    {
      name: "Product Sales",
      url: `${baseUrl}/sales/reports/product-sales?startDate=2024-01-01T00:00:00&endDate=2024-12-31T23:59:59`,
      expected: "ProductSalesReport object"
    },
    {
      name: "Invoices (Paginated)",
      url: `${baseUrl}/sales/invoices?page=0&size=5`,
      expected: "Page<InvoiceResponse>"
    },
    {
      name: "Orders (Paginated)", 
      url: `${baseUrl}/sales/orders?page=0&size=5`,
      expected: "Page<OrderResponse>"
    },
    {
      name: "Quotes (Paginated)",
      url: `${baseUrl}/sales/quotes?page=0&size=5`, 
      expected: "Page<QuoteResponse>"
    }
  ];

  console.log("🧪 Testing Sales API Endpoints...\n");

  for (const test of tests) {
    try {
      console.log(`⏳ Testing: ${test.name}`);
      const response = await fetch(test.url, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: SUCCESS`);
        console.log(`   Expected: ${test.expected}`);
        console.log(`   Response:`, data);
      } else {
        console.error(`❌ ${test.name}: HTTP ${response.status}`);
        const errorText = await response.text();
        console.error(`   Error:`, errorText);
      }
    } catch (error) {
      console.error(`❌ ${test.name}: NETWORK ERROR`);
      console.error(`   Error:`, error.message);
    }
    console.log(""); // Empty line for readability
  }
  
  console.log("🏁 API Testing Complete");
};

// Auto-run test if this file is imported in development
if (import.meta.env.DEV) {
  window.testSalesApi = testSalesApi;
  console.log("💡 Run 'testSalesApi()' in console to test backend connectivity");
}
