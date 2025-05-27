package com.secureops.util;

import java.security.SecureRandom;

public class PasswordGenerator {
    private static final String CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String CHAR_UPPER = CHAR_LOWER.toUpperCase();
    private static final String NUMBER = "0123456789";
    private static final String SPECIAL = "!@#$%^&*()_-+=<>?";
    private static final String ALL = CHAR_LOWER + CHAR_UPPER + NUMBER + SPECIAL;
    
    private static final SecureRandom random = new SecureRandom();
    
    public static String generateRandomPassword(int length) {
        if (length < 8) {
            length = 8; // Minimum recommended length for security
        }
        
        StringBuilder password = new StringBuilder(length);
        
        // Ensure at least one character from each category
        password.append(CHAR_LOWER.charAt(random.nextInt(CHAR_LOWER.length())));
        password.append(CHAR_UPPER.charAt(random.nextInt(CHAR_UPPER.length())));
        password.append(NUMBER.charAt(random.nextInt(NUMBER.length())));
        password.append(SPECIAL.charAt(random.nextInt(SPECIAL.length())));
        
        // Fill remaining length with random characters
        for (int i = 4; i < length; i++) {
            password.append(ALL.charAt(random.nextInt(ALL.length())));
        }
        
        // Shuffle the password characters
        char[] passwordArray = password.toString().toCharArray();
        for (int i = 0; i < passwordArray.length; i++) {
            int j = random.nextInt(passwordArray.length);
            char temp = passwordArray[i];
            passwordArray[i] = passwordArray[j];
            passwordArray[j] = temp;
        }
        
        return new String(passwordArray);
    }
}