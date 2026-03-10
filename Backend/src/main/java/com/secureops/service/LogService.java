package com.secureops.service;

import com.secureops.entity.Log;

import java.util.List;

public interface LogService {
    Log createLog(String action, String details, String ipAddress, String logType, Long userId);
    List<Log> getUserLogs(Long userId);
    List<Log> getLogsByActionAndAfterDate(String action, java.util.Date date);
    List<Log> getAllLogs();
}