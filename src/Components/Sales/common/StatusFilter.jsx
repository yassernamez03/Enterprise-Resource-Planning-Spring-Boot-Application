import React from "react"
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput
} from "@mui/material"

function StatusFilter({
  label,
  statuses,
  selectedStatuses,
  statusLabels,
  onChange,
  disabled = false
}) {
  const handleChange = event => {
    const value = event.target.value
    onChange(value)
  }

  return (
    <Box>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel id={`${label.toLowerCase()}-status-label`}>
          {label}
        </InputLabel>
        <Select
          labelId={`${label.toLowerCase()}-status-label`}
          multiple
          value={selectedStatuses}
          onChange={handleChange}
          input={<OutlinedInput label={label} />}
          renderValue={selected =>
            selected.map(s => statusLabels[s]).join(", ")
          }
        >
          {statuses.map(status => (
            <MenuItem key={status} value={status}>
              <Checkbox checked={selectedStatuses.indexOf(status) > -1} />
              <ListItemText primary={statusLabels[status]} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export default StatusFilter
