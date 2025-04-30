package com.secureops.service;

import java.text.SimpleDateFormat;
import java.util.Date;


import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

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

    

    public void sendPasswordChangedNotificationEmail(String to, String fullName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Your Password Has Been Changed");
        
        String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        
        message.setText("Hello " + fullName + ",\n\n"
                + "We're sending this email to notify you that your password has been reset by an administrator on our system at " + timestamp + ".\n\n"
                + "If you did not request this change, please contact our support team immediately, as someone else may have accessed your account.\n\n"
                + "For security purposes, you may want to change your password again to something that only you know by logging into your account and updating it from your profile settings.\n\n"
                + "Thank you for using our service.\n\n"
                + "Best regards,\nThe Security Ops Team");
        
        mailSender.send(message);
    }

    // The original sendPasswordResetEmail is kept for backward compatibility
    // but in the new flow, we'll use sendPasswordResetVerificationEmail first,
    // then sendNewPasswordEmail after verification
    public void sendPasswordResetEmail(String to, String fullName, String password) {
        sendNewPasswordEmail(to, fullName, password);
    }
}