package com.secureops.service;

import java.text.SimpleDateFormat;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.AuthenticationFailedException;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    
    @Value("${company.name:SecureOps Solutions}")
    private String companyName;
    
    @Value("${company.email}")
    private String companyEmail;
    
    @Value("${company.phone:(555) 123-4567}")
    private String companyPhone;
    
    @Value("${company.address:1234 Security Boulevard, Tech City, CA 90210}")
    private String companyAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        logger.info("EmailService initialized with mail sender: {}", mailSender.getClass().getSimpleName());
    }

    public void sendPasswordEmail(String to, String fullName, String password) {
        logger.debug("Preparing account approval email for user: {}", maskEmail(to));
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Your Account Has Been Approved - Login Details");
            message.setText("Hello " + fullName + ",\n\n"
                    + "Your account has been approved. You can now log in using the following credentials:\n\n"
                    + "Email: " + to + "\n"
                    + "Password: " + password + "\n\n"
                    + "Please change your password after logging in for the first time.\n\n"
                    + "Regards,\nSecureOps Team");
            
            mailSender.send(message);
            logger.info("Account approval email sent successfully to: {}", maskEmail(to));
        } catch (MailException e) {
            logger.error("Failed to send account approval email to: {}", maskEmail(to), e);
            throw e;
        }
    }

    public void sendPasswordResetVerificationEmail(String to, String fullName, String verificationCode) {
        logger.debug("Preparing password reset verification email for user: {}", maskEmail(to));
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Password Reset - Verification Code");
            message.setText("Hello " + fullName + ",\n\n"
                    + "We received a request to reset your password. Please use the following verification code to continue:\n\n"
                    + "Verification Code: " + verificationCode + "\n\n"
                    + "This code will expire in 15 minutes. If you did not request this password reset, please ignore this email.\n\n"
                    + "Regards,\nSecureOps Team");
            
            mailSender.send(message);
            logger.info("Password reset verification email sent successfully to: {}", maskEmail(to));
            // Log the verification code with limited visibility - only first and last character
            if (verificationCode != null && verificationCode.length() > 2) {
                String maskedCode = verificationCode.charAt(0) + "****" + 
                                   verificationCode.charAt(verificationCode.length() - 1);
                logger.debug("Verification code sent (masked): {}", maskedCode);
            }
        } catch (MailException e) {
            logger.error("Failed to send password reset verification email to: {}", maskEmail(to), e);
            throw e;
        }
    }

    public void sendNewPasswordEmail(String to, String fullName, String password) {
        logger.debug("Preparing new password email for user: {}", maskEmail(to));
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Password Reset - New Login Details");
            message.setText("Hello " + fullName + ",\n\n"
                    + "Your password has been reset. You can now log in using the following credentials:\n\n"
                    + "Email: " + to + "\n"
                    + "Password: " + password + "\n\n"
                    + "Please change your password after logging in for security purposes.\n\n"
                    + "Regards,\nSecureOps Team");
            
            mailSender.send(message);
            logger.info("New password email sent successfully to: {}", maskEmail(to));
        } catch (MailException e) {
            logger.error("Failed to send new password email to: {}", maskEmail(to), e);
            throw e;
        }
    }

    public void sendPasswordChangedNotificationEmail(String to, String fullName) {
        logger.debug("Preparing password change notification email for user: {}", maskEmail(to));
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Your Password Has Been Changed");
            
            String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
            logger.debug("Password change timestamp: {}", timestamp);
            
            message.setText("Hello " + fullName + ",\n\n"
                    + "We're sending this email to notify you that your password has been reset by an administrator on our system at " + timestamp + ".\n\n"
                    + "If you did not request this change, please contact our support team immediately, as someone else may have accessed your account.\n\n"
                    + "For security purposes, you may want to change your password again to something that only you know by logging into your account and updating it from your profile settings.\n\n"
                    + "Thank you for using our service.\n\n"
                    + "Best regards,\nThe Security Ops Team");
            
            mailSender.send(message);
            logger.info("Password change notification email sent successfully to: {}", maskEmail(to));
        } catch (MailException e) {
            logger.error("Failed to send password change notification email to: {}", maskEmail(to), e);
            throw e;
        }
    }

    // The original sendPasswordResetEmail is kept for backward compatibility
    public void sendPasswordResetEmail(String to, String fullName, String password) {
        logger.debug("Legacy password reset email method called for user: {}", maskEmail(to));
        sendNewPasswordEmail(to, fullName, password);
    }
    
    /**
     * Send invoice email with PDF attachment
     * @param toEmail recipient email
     * @param clientName client name
     * @param invoiceNumber invoice number
     * @param invoiceTotal formatted total amount
     * @param pdfContent PDF content as byte array
     * @throws MessagingException if email sending fails
     */
    public void sendInvoiceEmail(String toEmail, String clientName, String invoiceNumber, 
                               String invoiceTotal, byte[] pdfContent) throws MessagingException {
        
        logger.info("Attempting to send invoice email to: {} for invoice: {}", maskEmail(toEmail), invoiceNumber);
        logger.debug("Using sender email: {}", maskEmail(companyEmail));
        
        // Validate inputs
        if (toEmail == null || toEmail.trim().isEmpty()) {
            throw new MessagingException("Recipient email cannot be null or empty");
        }
        if (pdfContent == null || pdfContent.length == 0) {
            throw new MessagingException("PDF content cannot be null or empty");
        }
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            // Set sender
            helper.setFrom(companyEmail);
            
            // Set recipient and subject
            helper.setTo(toEmail);
            helper.setSubject("Invoice " + invoiceNumber + " from " + companyName);
            
            // Set email body
            String emailBody = buildInvoiceEmailBody(clientName, invoiceNumber, invoiceTotal);
            helper.setText(emailBody, true);
            
            // Attach PDF
            ByteArrayResource pdfResource = new ByteArrayResource(pdfContent);
            helper.addAttachment("Invoice-" + invoiceNumber + ".pdf", pdfResource);
            
            // Send email
            logger.debug("Sending email message...");
            mailSender.send(message);
            logger.info("Invoice email sent successfully to: {} for invoice: {}", maskEmail(toEmail), invoiceNumber);
            
        } catch (AuthenticationFailedException e) {
            logger.error("Email authentication failed. Please check email credentials.", e);
            throw new MessagingException("Email authentication failed. Please verify email configuration.");
        } catch (MessagingException e) {
            logger.error("MessagingException sending invoice email to: {} - Error: {}", maskEmail(toEmail), e.getMessage());
            throw new MessagingException("Failed to send invoice email: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error sending invoice email to: {} - Error: {}", maskEmail(toEmail), e.getMessage(), e);
            throw new MessagingException("Failed to send invoice email: " + e.getMessage());
        }
    }
    
    /**
     * Send test email for configuration verification
     * @param toEmail recipient email
     * @throws MessagingException if email sending fails
     */
    public void sendTestEmail(String toEmail) throws MessagingException {
        try {
            logger.info("Sending test email to: {}", maskEmail(toEmail));
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            
            helper.setFrom(companyEmail);
            helper.setTo(toEmail);
            helper.setSubject("Test Email from " + companyName);
            helper.setText("This is a test email to verify email configuration.", false);
            
            mailSender.send(message);
            logger.info("Test email sent successfully to: {}", maskEmail(toEmail));
            
        } catch (Exception e) {
            logger.error("Failed to send test email to: {}", maskEmail(toEmail), e);
            throw new MessagingException("Test email failed: " + e.getMessage());
        }
    }
    
    /**
     * Build HTML email body for invoice
     * @param clientName client name
     * @param invoiceNumber invoice number
     * @param invoiceTotal formatted total amount
     * @return HTML email body
     */
    private String buildInvoiceEmailBody(String clientName, String invoiceNumber, String invoiceTotal) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f8f9fa; }
                    .invoice-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    .footer { text-align: center; padding: 15px; font-size: 12px; color: #666; }
                    .amount { font-size: 18px; font-weight: bold; color: #2563eb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>%s</h1>
                        <p>Invoice Notification</p>
                    </div>
                    
                    <div class="content">
                        <p>Dear %s,</p>
                        
                        <p>Thank you for your business! Please find attached your invoice.</p>
                        
                        <div class="invoice-details">
                            <h3>Invoice Details:</h3>
                            <p><strong>Invoice Number:</strong> %s</p>
                            <p><strong>Total Amount:</strong> <span class="amount">%s</span></p>
                            <p><strong>Invoice Date:</strong> %s</p>
                        </div>
                        
                        <p>The invoice PDF is attached to this email. If you have any questions about this invoice, please don't hesitate to contact us.</p>
                        
                        <p>Best regards,<br>
                        %s Team</p>
                    </div>
                    
                    <div class="footer">
                        <p>%s<br>
                        %s<br>
                        Phone: %s</p>
                    </div>
                </div>
            </body>
            </html>
            """, 
            companyName, clientName, invoiceNumber, invoiceTotal, 
            java.time.LocalDate.now().toString(), companyName, 
            companyName, companyAddress, companyPhone
        );
    }
    
    /**
     * Send an HTML email using MimeMessage
     * @param to recipient email
     * @param subject email subject
     * @param htmlContent HTML content
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        logger.debug("Preparing HTML email to: {}, subject: {}", maskEmail(to), subject);
        
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(mimeMessage);
            logger.info("HTML email sent successfully to: {}", maskEmail(to));
        } catch (MessagingException | MailException e) {
            logger.error("Failed to send HTML email to: {}", maskEmail(to), e);
            throw new RuntimeException("Failed to send HTML email", e);
        }
    }
    
    /**
     * Masks an email address for privacy in logs
     * Converts user@example.com to u***@e***.com
     */
    private String maskEmail(String email) {
        if (email == null || email.isEmpty() || !email.contains("@")) {
            return "invalid-email";
        }
        
        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];
        
        String maskedUsername = username.substring(0, 1) + "***";
        
        String[] domainParts = domain.split("\\.");
        String domainName = domainParts[0];
        String tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : "";
        
        String maskedDomain = domainName.substring(0, 1) + "***";
        
        return maskedUsername + "@" + maskedDomain + "." + tld;
    }
}