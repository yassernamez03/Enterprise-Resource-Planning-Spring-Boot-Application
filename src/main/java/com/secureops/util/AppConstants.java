package com.secureops.util;

public class AppConstants {
    // Pagination defaults
    public static final String DEFAULT_PAGE_NUMBER = "0";
    public static final String DEFAULT_PAGE_SIZE = "10";
    public static final String DEFAULT_SORT_BY = "id";
    public static final String DEFAULT_SORT_DIRECTION = "asc";
    
    // Security constants
    public static final long JWT_EXPIRATION_IN_MS = 86400000; // 24 hours
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
    
    // File upload constants
    public static final String FILE_UPLOAD_DIR = "uploads";
    public static final int MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    // Log types
    public static final String LOG_TYPE_USER = "USER";
    public static final String LOG_TYPE_AUTH = "AUTH";
    public static final String LOG_TYPE_CALENDAR = "CALENDAR";
    public static final String LOG_TYPE_EVENT = "EVENT";
    public static final String LOG_TYPE_CHAT = "CHAT";
    public static final String LOG_TYPE_FILE = "FILE";
    
    // Log actions
    public static final String LOG_ACTION_CREATE = "CREATE";
    public static final String LOG_ACTION_UPDATE = "UPDATE";
    public static final String LOG_ACTION_DELETE = "DELETE";
    public static final String LOG_ACTION_LOGIN = "LOGIN";
    public static final String LOG_ACTION_LOGOUT = "LOGOUT";
    public static final String LOG_ACTION_REGISTER = "REGISTER";
    public static final String LOG_ACTION_APPROVE = "APPROVE";
    public static final String LOG_ACTION_REJECT = "REJECT";
    public static final String LOG_ACTION_PASSWORD_RESET = "PASSWORD_RESET";
}