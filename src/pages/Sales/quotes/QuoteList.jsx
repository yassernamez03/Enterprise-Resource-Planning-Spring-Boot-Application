import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import quoteService from "../../../services/Sales/quoteService";
import { generateQuotePdf, downloadPdf } from "../../../services/Sales/pdfService";
import {
  Search,
  Filter,
  PlusCircle,
  FileText,
  Edit,
  Trash2,
  Download
} from "lucide-react";
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog";

const statusLabels = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  CONVERTED_TO_ORDER: "Converted to Order"
};

const statusColors = {
  DRAFT: "bg-gray-200 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-yellow-100 text-yellow-800",
  CONVERTED_TO_ORDER: "bg-purple-100 text-purple-800"
};

const QuoteList = () => {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    quoteId: "",
    quoteNumber: ""
  });

  useEffect(() => {
    fetchQuotes();
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    filterQuotes();
  }, [quotes, searchTerm, statusFilter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await quoteService.getQuotes({
        page: pagination.page,
        pageSize: pagination.pageSize
      });
      
      setQuotes(response.data);
      setPagination({
        ...pagination,
        total: response.total
      });
      setFilteredQuotes(response.data);
    } catch (err) {
      setError("Failed to fetch quotes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterQuotes = () => {
    let filtered = [...quotes];

    if (searchTerm) {
      filtered = filtered.filter(
        quote =>
          quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quote.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    setFilteredQuotes(filtered);
  };

  const handleSearch = event => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilter = status => {
    setStatusFilter(status === statusFilter ? "" : status);
  };

  const handleDeletePrompt = (id, quoteNumber) => {
    setDeleteDialog({
      open: true,
      quoteId: id,
      quoteNumber: quoteNumber
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await quoteService.deleteQuote(deleteDialog.quoteId);
      setQuotes(quotes.filter(quote => quote.id !== deleteDialog.quoteId));
      setError(null);
    } catch (err) {
      setError("Failed to delete quote");
      console.error(err);
    } finally {
      setDeleteDialog({ open: false, quoteId: "", quoteNumber: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, quoteId: "", quoteNumber: "" });
  };

  const handleDownloadPdf = async (id, quoteNumber) => {
    try {
      const pdfBlob = await generateQuotePdf(id);
      downloadPdf(pdfBlob, `Quote-${quoteNumber}.pdf`);
    } catch (err) {
      setError("Failed to generate PDF");
      console.error(err);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  if (loading)
    return <div className="flex justify-center p-8">Loading quotes...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Quotes</h1>
        <Link
          to="/sales/quotes/new"
          className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusCircle size={18} className="mr-2" />
          New Quote
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search quotes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-gray-700 mr-2 flex items-center">
            <Filter size={18} className="mr-1" /> Filter:
          </span>
          {Object.entries(statusLabels).map(([status, label]) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`px-3 py-1 rounded-md ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredQuotes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No quotes found. Create your first quote!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredQuotes.map(quote => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/sales/quotes/${quote.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {quote.quoteNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {quote.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    ${quote.total ? quote.total.toFixed(2) : "0.00"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[quote.status] || "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {statusLabels[quote.status] || quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/sales/quotes/${quote.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <FileText size={18} />
                      </Link>
                      <Link
                        to={`/sales/quotes/${quote.id}/edit`}
                        className="text-amber-600 hover:text-amber-900"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() =>
                          handleDownloadPdf(quote.id, quote.quoteNumber)
                        }
                        className="text-green-600 hover:text-green-900"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeletePrompt(quote.id, quote.quoteNumber)
                        }
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      {pagination.total > pagination.pageSize && (
        <div className="flex justify-center mt-6">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => handlePageChange(Math.max(0, pagination.page - 1))}
              disabled={pagination.page === 0}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                pagination.page === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from(
              { length: Math.ceil(pagination.total / pagination.pageSize) },
              (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`relative inline-flex items-center px-4 py-2 border ${
                    pagination.page === i
                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  } text-sm font-medium`}
                >
                  {i + 1}
                </button>
              )
            )}
            
            <button
              onClick={() =>
                handlePageChange(
                  Math.min(
                    Math.ceil(pagination.total / pagination.pageSize) - 1,
                    pagination.page + 1
                  )
                )
              }
              disabled={
                pagination.page >=
                Math.ceil(pagination.total / pagination.pageSize) - 1
              }
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                pagination.page >=
                Math.ceil(pagination.total / pagination.pageSize) - 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete Quote"
        message={`Are you sure you want to delete Quote ${deleteDialog.quoteNumber}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  );
};

export default QuoteList;