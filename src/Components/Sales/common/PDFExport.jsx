import React from "react"
import { Button, IconButton, Tooltip } from "@mui/material"
import { FileDownload, Print } from "@mui/icons-material"

const PDFExport = ({
  onExport,
  documentName,
  variant = "button",
  label = "Export PDF",
  disabled = false
}) => {
  const handleExport = async () => {
    try {
      const blob = await onExport()
      const url = URL.createObjectURL(blob)

      // Create a hidden link and trigger a download
      const a = document.createElement("a")
      a.href = url
      a.download = `${documentName}.pdf`
      document.body.appendChild(a)
      a.click()

      // Clean up
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting PDF:", error)
    }
  }

  const handlePrint = async () => {
    try {
      const blob = await onExport()
      const url = URL.createObjectURL(blob)

      // Open PDF in a new window for printing
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print()
        })
      }

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 60000) // 1 minute timeout
    } catch (error) {
      console.error("Error printing PDF:", error)
    }
  }

  if (variant === "icon") {
    return (
      <>
        <Tooltip title="Export PDF">
          <IconButton
            onClick={handleExport}
            disabled={disabled}
            aria-label="Export PDF"
            size="small"
          >
            <FileDownload />
          </IconButton>
        </Tooltip>
        <Tooltip title="Print">
          <IconButton
            onClick={handlePrint}
            disabled={disabled}
            aria-label="Print"
            size="small"
          >
            <Print />
          </IconButton>
        </Tooltip>
      </>
    )
  }

  return (
    <Button
      variant="outlined"
      startIcon={<FileDownload />}
      onClick={handleExport}
      disabled={disabled}
      size="small"
    >
      {label}
    </Button>
  )
}

export default PDFExport
