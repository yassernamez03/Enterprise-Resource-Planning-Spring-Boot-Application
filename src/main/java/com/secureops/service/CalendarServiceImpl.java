package com.secureops.service;

import com.secureops.dto.CalendarDto;
import com.secureops.entity.Calendar;
import com.secureops.entity.User;
import com.secureops.exception.BadRequestException;
import com.secureops.exception.ResourceNotFoundException;
import com.secureops.exception.UnauthorizedException;
import com.secureops.repository.CalendarRepository;
import com.secureops.repository.UserRepository;
import com.secureops.util.AppConstants;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@Service
public class CalendarServiceImpl implements CalendarService {

    private final CalendarRepository calendarRepository;
    private final UserRepository userRepository;
    private final LogService logService;

    public CalendarServiceImpl(CalendarRepository calendarRepository,
            UserRepository userRepository,
            LogService logService) {
        this.calendarRepository = calendarRepository;
        this.userRepository = userRepository;
        this.logService = logService;
    }

    @Override
    @Transactional
    public Calendar createCalendar(CalendarDto calendarDto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Calendar calendar = new Calendar();
        calendar.setName(calendarDto.getName());
        calendar.setColor(calendarDto.getColor());
        calendar.setPrimary(calendarDto.isPrimary());
        calendar.setOwner(user);

        // If this calendar is set as primary, update any existing primary calendar
        if (calendar.isPrimary()) {
            calendarRepository.findByOwnerIdAndPrimaryTrue(userId)
                    .ifPresent(existingPrimary -> {
                        existingPrimary.setPrimary(false);
                        calendarRepository.save(existingPrimary);
                    });
        }

        Calendar savedCalendar = calendarRepository.save(calendar);

        // Log calendar creation
        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "Calendar created: " + calendar.getName(),
                getClientIp(),
                AppConstants.LOG_TYPE_CALENDAR,
                userId);

        return savedCalendar;
    }

    @Override
    public List<Calendar> getUserCalendars(Long userId) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return calendarRepository.findByOwnerId(userId);
    }

    @Override
    public Calendar getCalendarById(Long id) {
        Calendar calendar = calendarRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Calendar", "id", id));

        // Check if current user is the owner
        Long currentUserId = getCurrentUserId();
        if (!calendar.getOwner().getId().equals(currentUserId)) {
            throw new UnauthorizedException("You don't have permission to access this calendar");
        }

        return calendar;
    }

    @Override
    @Transactional
    public Calendar updateCalendar(Long id, CalendarDto calendarDto) {
        Calendar calendar = getCalendarById(id);

        calendar.setName(calendarDto.getName());
        calendar.setColor(calendarDto.getColor());

        // Handle primary calendar logic
        if (calendarDto.isPrimary() && !calendar.isPrimary()) {
            // If setting this as primary, update any existing primary calendar
            calendarRepository.findByOwnerIdAndPrimaryTrue(calendar.getOwner().getId())
                    .ifPresent(existingPrimary -> {
                        existingPrimary.setPrimary(false);
                        calendarRepository.save(existingPrimary);
                    });
            calendar.setPrimary(true);
        } else if (!calendarDto.isPrimary() && calendar.isPrimary()) {
            // Cannot unset the primary calendar without setting another as primary
            throw new BadRequestException(
                    "Cannot unset the primary calendar. Please set another calendar as primary first.");
        }

        Calendar updatedCalendar = calendarRepository.save(calendar);

        // Log calendar update
        logService.createLog(
                AppConstants.LOG_ACTION_UPDATE,
                "Calendar updated: " + calendar.getName(),
                getClientIp(),
                AppConstants.LOG_TYPE_CALENDAR,
                calendar.getOwner().getId());

        return updatedCalendar;
    }

    @Override
    @Transactional
    public void deleteCalendar(Long id) {
        Calendar calendar = getCalendarById(id);

        // Cannot delete the primary calendar
        if (calendar.isPrimary()) {
            throw new BadRequestException("Cannot delete the primary calendar");
        }

        Long ownerId = calendar.getOwner().getId();
        String calendarName = calendar.getName();

        calendarRepository.delete(calendar);

        // Log calendar deletion
        logService.createLog(
                AppConstants.LOG_ACTION_DELETE,
                "Calendar deleted: " + calendarName,
                getClientIp(),
                AppConstants.LOG_TYPE_CALENDAR,
                ownerId);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            return userRepository.findByEmail(email)
                    .map(User::getId)
                    .orElseThrow(() -> new UnauthorizedException("User not found"));
        }
        throw new UnauthorizedException("Not authenticated");
    }

    private String getClientIp() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                .getRequest();
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