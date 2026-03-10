import React from "react"
import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "../Components/Sales/layout/AppLayout"

// Dashboard
import Dashboard from "../pages/Sales/dashboard/Dashboard"

// Clients
import ClientList from "../pages/Sales/clients/ClientList"
import ClientDetail from "../pages/Sales/clients/ClientDetail"
import CreateClient from "../pages/Sales/clients/CreateClient"
import EditClient from "../pages/Sales/clients/EditClient"

// Products
import ProductList from "../pages/Sales/products/ProductList"
import ProductDetail from "../pages/Sales/products/ProductDetail"
import CreateProduct from "../pages/Sales/products/CreateProduct"
import EditProduct from "../pages/Sales/products/EditProduct"

// Quote Components
import QuoteList from "../pages/Sales/quotes/QuoteList"
import QuoteForm from "../pages/Sales/quotes/QuoteForm"
import QuoteDetail from "../pages/Sales/quotes/QuoteDetail"

// Orde../pages/Sales
import OrderList from "../pages/Sales/orders/OrderList"
import OrderDetail from "../pages/Sales/orders/OrderDetail"
import OrderForm from "../pages/Sales/orders/OrderForm"
// Invoic../pages/Sales
import InvoiceList from "../pages/Sales/invoices/InvoiceList"
import InvoiceDetail from "../pages/Sales/invoices/InvoiceDetail"
import PaymentForm from "../pages/Sales/invoices/PaymentForm"

// Report Components
import ReportsDashboard from "../pages/Sales/reports/ReportsDashboard"

const SalesRoutes = () => {
  return (
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />

          <Route path="clients" element={<ClientList />} />
          <Route path="clients/new" element={<CreateClient />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="clients/:id/edit" element={<EditClient />} />

          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<CreateProduct />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="products/:id/edit" element={<EditProduct />} />

          <Route path="quotes" element={<QuoteList />} />
          <Route path="quotes/new" element={<QuoteForm />} />
          <Route path="quotes/:id" element={<QuoteDetail />} />
          <Route path="quotes/:id/edit" element={<QuoteForm />} />

          <Route path="orders" element={<OrderList />} />
          <Route path="orders/new" element={<OrderForm />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="orders/:id/edit" element={<OrderForm />} />

          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="invoices/:id/payment" element={<PaymentForm />} />

          {/* Reports */}
          <Route path="reports" element={<ReportsDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
  );
};

export default SalesRoutes;
