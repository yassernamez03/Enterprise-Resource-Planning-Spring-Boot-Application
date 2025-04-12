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

    public void sendPasswordResetEmail(String to, String fullName, String password) {
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
}