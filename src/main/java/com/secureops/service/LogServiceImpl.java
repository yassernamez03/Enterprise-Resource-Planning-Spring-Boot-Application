package com.secureops.service;

import com.secureops.entity.Log;
import com.secureops.entity.User;
import com.secureops.repository.LogRepository;
import com.secureops.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class LogServiceImpl implements LogService {

    private final LogRepository logRepository;
    private final UserRepository userRepository;

    public LogServiceImpl(LogRepository logRepository, UserRepository userRepository) {
        this.logRepository = logRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Log createLog(String action, String details, String ipAddress, String logType, Long userId) {
        Log log = new Log();
        log.setAction(action);
        log.setDetails(details);
        log.setIpAddress(ipAddress);
        log.setLogType(logType);
        log.setTimestamp(new Date());
        
        if (userId != null) {
            Optional<User> userOptional = userRepository.findById(userId);
            userOptional.ifPresent(log::setUser);
        }
        
        return logRepository.save(log);
    }

    @Override
    public List<Log> getUserLogs(Long userId) {
        return logRepository.findByUserId(userId);
    }

    @Override
    public List<Log> getLogsByActionAndAfterDate(String action, Date date) {
        return logRepository.findByActionAndTimestampAfter(action, date);
    }

    @Override
    public List<Log> getAllLogs() {
        return logRepository.findAll();
    }
}