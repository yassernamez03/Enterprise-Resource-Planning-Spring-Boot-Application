import React, { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown
} from "lucide-react"

function DataTable({
  data,
  columns,
  total = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onSort,
  loading = false,
  emptyMessage = "No data available",
  rowActions,
  onRowClick,
  keyExtractor
}) {
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")

  const totalPages = Math.ceil(total / pageSize)

  const handleSort = field => {
    const newDirection =
      sortField === field && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(newDirection)
    onSort?.(field, newDirection)
  }

  const getValue = (item, accessor) => {
    if (typeof accessor === "string" && accessor.includes(".")) {
      // Handle nested object properties
      return accessor.split(".").reduce((obj, key) => obj && obj[key], item)
    }
    return item[accessor]
  }

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center">
                    <span>{column.header}</span>
                    {column.sortable && onSort && (
                      <button
                        className="ml-2 focus:outline-none"
                        onClick={() => handleSort(column.accessor)}
                      >
                        {sortField === column.accessor ? (
                          sortDirection === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )
                        ) : (
                          <div className="opacity-30">
                            <ArrowUp size={14} />
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && <th className="px-6 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr
                  key={keyExtractor(item)}
                  className={`hover:bg-gray-50 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((column, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-800"
                    >
                      {column.cell
                        ? column.cell(item)
                        : getValue(item, column.accessor)?.toString()}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {rowActions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && totalPages > 1 && (
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, total)}
                </span>{" "}
                of <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => onPageChange(1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">First</span>
                  <ChevronsLeft size={18} />
                </button>
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft size={18} />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }).map(
                  (_, idx) => {
                    // Logic to determine which pages to show
                    let pageNum
                    if (totalPages <= 5 || currentPage <= 3) {
                      pageNum = idx + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx
                    } else {
                      pageNum = currentPage - 2 + idx
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => onPageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  }
                )}

                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Last</span>
                  <ChevronsRight size={18} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
