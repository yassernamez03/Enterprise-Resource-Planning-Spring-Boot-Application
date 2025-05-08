import React from "react"
import { Chip } from "@mui/material"

const statusConfigs = {
  // Quote statuses
  draft: { label: "Draft", color: "default" },
  sent: { label: "Sent", color: "info" },
  accepted: { label: "Accepted", color: "success" },
  rejected: { label: "Rejected", color: "error" },
  expired: { label: "Expired", color: "warning" },

  // Order statuses
  pending: { label: "Pending", color: "info" },
  in_process: { label: "In Process", color: "warning" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },

  // Invoice statuses
  partial: { label: "Partially Paid", color: "warning" },
  paid: { label: "Paid", color: "success" },
  overdue: { label: "Overdue", color: "error" }
}

const StatusBadge = ({ status, size = "small", className }) => {
  const config = statusConfigs[status] || { label: status, color: "default" }

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      className={className}
      sx={{
        fontWeight: 500,
        transition: "all 0.2s ease"
      }}
    />
  )
}

export default StatusBadge
