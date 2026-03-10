import React, { useState, useEffect } from 'react';
import { Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

const ErrorNotification = ({ 
  error, 
  onClose, 
  autoHideDuration = 6000,
  showAsDialog = false,
  title = "Error"
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (error) {
      setOpen(true);
    }
  }, [error]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  if (!error) return null;

  // Show as dialog for critical errors like foreign key constraints
  if (showAsDialog) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <ErrorIcon />
          {title}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Show as snackbar for regular errors
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity="error"
        variant="filled"
        sx={{ width: '100%', minWidth: 300 }}
      >
        {error}
      </Alert>
    </Snackbar>
  );
};

export default ErrorNotification;