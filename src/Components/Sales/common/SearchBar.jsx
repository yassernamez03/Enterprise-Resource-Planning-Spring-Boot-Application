import React, { useState, useEffect } from "react"
import { TextField, InputAdornment, IconButton } from "@mui/material"
import { Search, Clear } from "@mui/icons-material"

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  onSearch,
  disabled = false,
  debounceMs = 500
}) => {
  const [inputValue, setInputValue] = useState(value)

  // Update local state when the external value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Debounce the search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue !== value) {
        onChange(inputValue)
      }
    }, debounceMs)

    return () => {
      clearTimeout(handler)
    }
  }, [inputValue, onChange, value, debounceMs])

  const handleChange = e => {
    setInputValue(e.target.value)
  }

  const handleKeyDown = e => {
    if (e.key === "Enter") {
      onSearch()
    }
  }

  const handleClear = () => {
    setInputValue("")
    onChange("")
  }

  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <IconButton
              edge="start"
              onClick={onSearch}
              disabled={disabled}
              size="small"
              aria-label="search"
            >
              <Search />
            </IconButton>
          </InputAdornment>
        ),
        endAdornment: inputValue ? (
          <InputAdornment position="end">
            <IconButton
              edge="end"
              onClick={handleClear}
              disabled={disabled}
              size="small"
              aria-label="clear"
            >
              <Clear />
            </IconButton>
          </InputAdornment>
        ) : null
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          transition: "box-shadow 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.1)"
          },
          "&.Mui-focused": {
            boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.2)"
          }
        }
      }}
    />
  )
}

export default SearchBar
