// src/modules/sales/SalesModule.jsx
import { AppProvider } from "../context/Sales/AppContext";
import SalesRoutes from './SalesRoutes';
// import '../styles/sales.css';

export default function SalesModule() {
  return (
    <div className="sales-module">
    <AppProvider>
      <SalesRoutes />
    </AppProvider>
    </div>
  );
}