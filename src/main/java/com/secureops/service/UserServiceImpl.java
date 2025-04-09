package com.secureops.service;

import com.secureops.dto.UserDto;
import com.secureops.dto.UserRegistrationDto;
import com.secureops.entity.User;
import com.secureops.entity.Calendar;
import com.secureops.exception.BadRequestException;
import com.secureops.exception.ResourceNotFoundException;
import com.secureops.repository.UserRepository;
import com.secureops.repository.CalendarRepository;
import com.secureops.util.AppConstants;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CalendarRepository calendarRepository;
    private final PasswordEncoder passwordEncoder;
    private final LogService logService;

    public UserServiceImpl(UserRepository userRepository, 
                          CalendarRepository calendarRepository,
                          PasswordEncoder passwordEncoder,
                          LogService logService) {
        this.userRepository = userRepository;
        this.calendarRepository = calendarRepository;
        this.passwordEncoder = passwordEncoder;
        this.logService = logService;
    }

    @Override
    @Transactional
    public User register(UserRegistrationDto registrationDto) {
        // Check if email already exists
        if (userRepository.existsByEmail(registrationDto.getEmail())) {
            throw new BadRequestException("Email is already taken!");
        }

        // Create new user
        User user = new User();
        user.setFullName(registrationDto.getFullName());
        user.setEmail(registrationDto.getEmail());
        user.setPassword(passwordEncoder.encode(registrationDto.getPassword()));
        user.setApprovalStatus(User.ApprovalStatus.PENDING);
        user.setActive(false);
        user.setRole(User.UserRole.USER);

        User savedUser = userRepository.save(user);
        
        // Create a default calendar for the user
        Calendar defaultCalendar = new Calendar();
        defaultCalendar.setName("Default Calendar");
        defaultCalendar.setColor("#3788d8");
        defaultCalendar.setPrimary(true);
        defaultCalendar.setOwner(savedUser);
        calendarRepository.save(defaultCalendar);
        
        // Log the registration
        logService.createLog(
            AppConstants.LOG_ACTION_REGISTER,
            "User registered: " + user.getEmail(),
            getClientIp(),
            AppConstants.LOG_TYPE_USER,
            null
        );
        
        return savedUser;
    }

    @Override
    @Transactional
    public User approveUser(Long userId) {
        User user = getUserById(userId);
        
        if (user.getApprovalStatus() == User.ApprovalStatus.APPROVED) {
            throw new BadRequestException("User is already approved");
        }
        
        user.setApprovalStatus(User.ApprovalStatus.APPROVED);
        user.setActive(true);
        
        User savedUser = userRepository.save(user);
        
        // Log the approval
        logService.createLog(
            AppConstants.LOG_ACTION_APPROVE,
            "User approved: " + user.getEmail(),
            getClientIp(),
            AppConstants.LOG_TYPE_USER,
            getCurrentUserId()
        );
        
        return savedUser;
    }

    @Override
    @Transactional
    public User rejectUser(Long userId) {
        User user = getUserById(userId);
        
        if (user.getApprovalStatus() == User.ApprovalStatus.REJECTED) {
            throw new BadRequestException("User is already rejected");
        }
        
        user.setApprovalStatus(User.ApprovalStatus.REJECTED);
        user.setActive(false);
        
        User savedUser = userRepository.save(user);
        
        // Log the rejection
        logService.createLog(
            AppConstants.LOG_ACTION_REJECT,
            "User rejected: " + user.getEmail(),
            getClientIp(),
            AppConstants.LOG_TYPE_USER,
            getCurrentUserId()
        );
        
        return savedUser;
    }

    @Override
    public List<User> getPendingApprovals() {
        return userRepository.findByApprovalStatus(User.ApprovalStatus.PENDING);
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @Override
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    @Override
    public UserDto getUserDtoById(Long id) {
        User user = getUserById(id);
        return mapToDto(user);
    }

    @Override
    public UserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = getUserByEmail(email);
        return mapToDto(user);
    }
    
    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    private UserDto mapToDto(User user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setActive(user.isActive());
        userDto.setRole(user.getRole());
        userDto.setApprovalStatus(user.getApprovalStatus());
        return userDto;
    }
    
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            try {
                User user = getUserByEmail(email);
                return user.getId();
            } catch (ResourceNotFoundException e) {
                return null;
            }
        }
        return null;
    }
    
    private String getClientIp() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress;
    }
}