import { apiService } from '../apiInterceptor';

const BASE_URL = "/sales/invoices";

export const emailInvoicePdf = async (invoiceId, pdfBlob, customMessage = "") => {
  try {
    const formData = new FormData();
    formData.append('pdfFile', pdfBlob, `Invoice-${invoiceId}.pdf`);
    
    if (customMessage) {
      formData.append('message', customMessage);
    }
    
    const response = await apiService.post(
      `${BASE_URL}/${invoiceId}/email`, 
      formData
    );
    
    return response;
  } catch (error) {
    console.error(`Error emailing invoice ${invoiceId}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error("Invoice not found");
    } else if (error.response?.status === 400) {
      throw new Error(error.response?.data?.error || "Invalid request");
    } else if (error.message?.includes('timeout')) {
      throw new Error("Email sending timed out. Please try again.");
    } else {
      throw new Error("Failed to send email. Please check your connection and try again.");
    }
  }
};

export default {
  emailInvoicePdf
};