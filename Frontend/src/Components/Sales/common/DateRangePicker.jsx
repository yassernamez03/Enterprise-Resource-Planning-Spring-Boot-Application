import React from "react"
import { Box, TextField } from "@mui/material"

const DateRangePicker = ({ dateRange, onChange, disabled = false }) => {
  const handleStartDateChange = e => {
    onChange({
      ...dateRange,
      startDate: e.target.value
    })
  }

  const handleEndDateChange = e => {
    onChange({
      ...dateRange,
      endDate: e.target.value
    })
  }

  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      <TextField
        label="Start Date"
        type="date"
        value={dateRange.startDate}
        onChange={handleStartDateChange}
        InputLabelProps={{ shrink: true }}
        disabled={disabled}
        size="small"
        fullWidth
        InputProps={{
          inputProps: {
            max: dateRange.endDate
          }
        }}
      />
      <TextField
        label="End Date"
        type="date"
        value={dateRange.endDate}
        onChange={handleEndDateChange}
        InputLabelProps={{ shrink: true }}
        disabled={disabled}
        size="small"
        fullWidth
        InputProps={{
          inputProps: {
            min: dateRange.startDate
          }
        }}
      />
    </Box>
  )
}

export default DateRangePicker
