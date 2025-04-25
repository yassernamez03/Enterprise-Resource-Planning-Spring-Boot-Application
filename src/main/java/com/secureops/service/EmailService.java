package com.secureops.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordEmail(String to, String fullName, String password) {
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
    }

    public void sendPasswordResetVerificationEmail(String to, String fullName, String verificationCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Password Reset - Verification Code");
        message.setText("Hello " + fullName + ",\n\n"
                + "We received a request to reset your password. Please use the following verification code to continue:\n\n"
                + "Verification Code: " + verificationCode + "\n\n"
                + "This code will expire in 15 minutes. If you did not request this password reset, please ignore this email.\n\n"
                + "Regards,\nSecureOps Team");
        
        mailSender.send(message);
    }

    public void sendNewPasswordEmail(String to, String fullName, String password) {
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
    }

    // The original sendPasswordResetEmail is kept for backward compatibility
    // but in the new flow, we'll use sendPasswordResetVerificationEmail first,
    // then sendNewPasswordEmail after verification
    public void sendPasswordResetEmail(String to, String fullName, String password) {
        sendNewPasswordEmail(to, fullName, password);
    }
}