import React from "react"
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Paper,
  Typography
} from "@mui/material"
import { Delete, Add } from "@mui/icons-material"

const LineItemTable = ({
  items,
  onItemsChange,
  readOnly = false,
  showControls = true
}) => {
  const handleQuantityChange = (index, value) => {
    if (readOnly) return

    const newItems = [...items]
    newItems[index].quantity = value
    updateItemCalculations(newItems, index)
    onItemsChange(newItems)
  }

  const handleUnitPriceChange = (index, value) => {
    if (readOnly) return

    const newItems = [...items]
    newItems[index].unitPrice = value
    updateItemCalculations(newItems, index)
    onItemsChange(newItems)
  }

  const handleDiscountChange = (index, value) => {
    if (readOnly) return

    const newItems = [...items]
    newItems[index].discount = value
    updateItemCalculations(newItems, index)
    onItemsChange(newItems)
  }

  const handleTaxChange = (index, value) => {
    if (readOnly) return

    const newItems = [...items]
    newItems[index].tax = value
    updateItemCalculations(newItems, index)
    onItemsChange(newItems)
  }

  const updateItemCalculations = (items, index) => {
    const item = items[index]
    const subtotal = item.quantity * item.unitPrice
    const discountAmount = subtotal * (item.discount / 100)
    const afterDiscount = subtotal - discountAmount
    const taxAmount = afterDiscount * (item.tax / 100)

    items[index].subtotal = subtotal
    items[index].total = afterDiscount + taxAmount
  }

  const handleDeleteItem = index => {
    if (readOnly) return

    const newItems = [...items]
    newItems.splice(index, 1)
    onItemsChange(newItems)
  }

  const handleAddItem = () => {
    if (readOnly) return

    // This is a placeholder item, in a real app you'd select from products
    const newItem = {
      id: `temp-${Date.now()}`,
      productId: "",
      productName: "New Product",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
      subtotal: 0,
      total: 0
    }

    onItemsChange([...items, newItem])
  }

  const formatCurrency = amount => {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    })
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const discountTotal = items.reduce(
    (sum, item) => sum + item.subtotal * (item.discount / 100),
    0
  )
  const taxTotal = items.reduce((sum, item) => {
    const afterDiscount = item.subtotal - item.subtotal * (item.discount / 100)
    return sum + afterDiscount * (item.tax / 100)
  }, 0)
  const total = items.reduce((sum, item) => sum + item.total, 0)

  return (
    <Box sx={{ width: "100%" }}>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "rgba(0, 0, 0, 0.04)" }}>
              <TableCell>Product</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Discount (%)</TableCell>
              <TableCell align="right">Tax (%)</TableCell>
              <TableCell align="right">Subtotal</TableCell>
              <TableCell align="right">Total</TableCell>
              {showControls && !readOnly && (
                <TableCell align="right">Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id || index}>
                <TableCell>{item.productName}</TableCell>
                <TableCell align="right">
                  {readOnly ? (
                    item.quantity
                  ) : (
                    <TextField
                      type="number"
                      InputProps={{ inputProps: { min: 1 } }}
                      value={item.quantity}
                      onChange={e =>
                        handleQuantityChange(index, Number(e.target.value))
                      }
                      size="small"
                      sx={{ width: "80px" }}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  {readOnly ? (
                    formatCurrency(item.unitPrice)
                  ) : (
                    <TextField
                      type="number"
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      value={item.unitPrice}
                      onChange={e =>
                        handleUnitPriceChange(index, Number(e.target.value))
                      }
                      size="small"
                      sx={{ width: "100px" }}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  {readOnly ? (
                    `${item.discount}%`
                  ) : (
                    <TextField
                      type="number"
                      InputProps={{ inputProps: { min: 0, max: 100 } }}
                      value={item.discount}
                      onChange={e =>
                        handleDiscountChange(index, Number(e.target.value))
                      }
                      size="small"
                      sx={{ width: "80px" }}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  {readOnly ? (
                    `${item.tax}%`
                  ) : (
                    <TextField
                      type="number"
                      InputProps={{ inputProps: { min: 0, max: 100 } }}
                      value={item.tax}
                      onChange={e =>
                        handleTaxChange(index, Number(e.target.value))
                      }
                      size="small"
                      sx={{ width: "80px" }}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(item.subtotal)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(item.total)}
                </TableCell>
                {showControls && !readOnly && (
                  <TableCell align="right">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteItem(index)}
                      aria-label="Delete item"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Item Button */}
      {showControls && !readOnly && (
        <Box sx={{ mb: 3 }}>
          <IconButton
            color="primary"
            onClick={handleAddItem}
            sx={{ border: "1px dashed", borderRadius: 1 }}
            aria-label="Add item"
          >
            <Add />
          </IconButton>
        </Box>
      )}

      {/* Summary Section */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Box sx={{ width: "300px" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body1">Subtotal:</Typography>
            <Typography variant="body1">{formatCurrency(subtotal)}</Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body1">Discount:</Typography>
            <Typography variant="body1">
              -{formatCurrency(discountTotal)}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body1">Tax:</Typography>
            <Typography variant="body1">+{formatCurrency(taxTotal)}</Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(0,0,0,0.12)",
              pt: 1
            }}
          >
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6" color="primary">
              {formatCurrency(total)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default LineItemTable
