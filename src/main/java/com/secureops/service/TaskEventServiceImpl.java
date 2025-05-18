package com.secureops.service;

import com.secureops.dto.TaskEventDto;
import com.secureops.entity.TaskEvent;
import com.secureops.entity.User;
import com.secureops.exception.BadRequestException;
import com.secureops.exception.ResourceNotFoundException;
import com.secureops.exception.UnauthorizedException;
import com.secureops.repository.TaskEventRepository;
import com.secureops.repository.UserRepository;
import com.secureops.util.AppConstants;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TaskEventServiceImpl implements TaskEventService {

    private final TaskEventRepository taskEventRepository;
    private final UserRepository userRepository;
    private final LogService logService;

    public TaskEventServiceImpl(TaskEventRepository taskEventRepository,
            UserRepository userRepository,
            LogService logService) {
        this.taskEventRepository = taskEventRepository;
        this.userRepository = userRepository;
        this.logService = logService;
    }

    @Override
    @Transactional
    public TaskEvent createTaskEvent(TaskEventDto taskEventDto) {
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Only administrators can create task events");
        }

        Long currentUserId = getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        // Validate based on type
        if (taskEventDto.getType() == TaskEvent.TaskEventType.EVENT) {
            if (taskEventDto.getStartTime() == null) {
                throw new BadRequestException("Start time is required for events");
            }
        } else {
            if (taskEventDto.getDueDate() == null) {
                throw new BadRequestException("Due date is required for tasks");
            }
        }

        TaskEvent taskEvent = new TaskEvent();
        taskEvent.setTitle(taskEventDto.getTitle());
        taskEvent.setDescription(taskEventDto.getDescription());
        taskEvent.setStatus(taskEventDto.getStatus());
        taskEvent.setType(taskEventDto.getType());
        taskEvent.setStartTime(taskEventDto.getStartTime());
        taskEvent.setDueDate(taskEventDto.getDueDate());
        taskEvent.setLocation(taskEventDto.getLocation());
        taskEvent.setGlobal(taskEventDto.isGlobal());
        taskEvent.setUser(currentUser);

        // Set type-specific fields
        if (taskEventDto.getType() == TaskEvent.TaskEventType.EVENT) {
            // Event specific fields
        } else {
            // Task specific fields
            if (taskEventDto.getStatus() == TaskEvent.TaskEventStatus.COMPLETED) {
                taskEvent.setCompletedDate(new Date());
            }
        }

        // If not global, add assigned users
        if (!taskEvent.isGlobal() && taskEventDto.getAssignedUserIds() != null
                && !taskEventDto.getAssignedUserIds().isEmpty()) {
            Set<User> assignedUsers = taskEventDto.getAssignedUserIds().stream()
                    .map(userId -> userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId)))
                    .collect(Collectors.toSet());
            taskEvent.setAssignedUsers(assignedUsers);
        }

        TaskEvent savedTaskEvent = taskEventRepository.save(taskEvent);

        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "TaskEvent created: " + taskEvent.getTitle(),
                getClientIp(),
                taskEvent.getType().name(),
                currentUserId);

        return savedTaskEvent;
    }

    @Override
    @Transactional
    public TaskEvent updateTaskEvent(Long id, TaskEventDto taskEventDto) {
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Only administrators can update task events");
        }

        TaskEvent taskEvent = taskEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaskEvent", "id", id));

        // Validate based on type
        if (taskEventDto.getType() == TaskEvent.TaskEventType.EVENT) {
            if (taskEventDto.getStartTime() == null) {
                throw new BadRequestException("Start time is required for events");
            }
        } else {
            if (taskEventDto.getDueDate() == null) {
                throw new BadRequestException("Due date is required for tasks");
            }
        }

        taskEvent.setTitle(taskEventDto.getTitle());
        taskEvent.setDescription(taskEventDto.getDescription());
        taskEvent.setStatus(taskEventDto.getStatus());
        taskEvent.setStartTime(taskEventDto.getStartTime());
        taskEvent.setDueDate(taskEventDto.getDueDate());
        taskEvent.setLocation(taskEventDto.getLocation());
        taskEvent.setGlobal(taskEventDto.isGlobal());

        // Update completed date if status changed to COMPLETED
        if (taskEventDto.getType() == TaskEvent.TaskEventType.TASK &&
                taskEventDto.getStatus() == TaskEvent.TaskEventStatus.COMPLETED) {
            taskEvent.setCompletedDate(new Date());
        }

        // Update assigned users if not global
        if (!taskEvent.isGlobal()) {
            taskEvent.getAssignedUsers().clear();
            if (taskEventDto.getAssignedUserIds() != null && !taskEventDto.getAssignedUserIds().isEmpty()) {
                Set<User> assignedUsers = taskEventDto.getAssignedUserIds().stream()
                        .map(userId -> userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId)))
                        .collect(Collectors.toSet());
                taskEvent.setAssignedUsers(assignedUsers);
            }
        } else {
            taskEvent.getAssignedUsers().clear();
        }

        TaskEvent updatedTaskEvent = taskEventRepository.save(taskEvent);

        logService.createLog(
                AppConstants.LOG_ACTION_UPDATE,
                "TaskEvent updated: " + taskEvent.getTitle(),
                getClientIp(),
                taskEvent.getType().name(),
                getCurrentUserId());

        return updatedTaskEvent;
    }

    @Override
    @Transactional
    public void deleteTaskEvent(Long id) {
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Only administrators can delete task events");
        }

        TaskEvent taskEvent = taskEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaskEvent", "id", id));

        taskEventRepository.delete(taskEvent);

        logService.createLog(
                AppConstants.LOG_ACTION_DELETE,
                "TaskEvent deleted: " + taskEvent.getTitle(),
                getClientIp(),
                taskEvent.getType().name(),
                getCurrentUserId());
    }

    // Task specific methods
    @Override
    public List<TaskEvent> getAllTasks() {
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Admin privileges required to view all tasks");
        }
        return taskEventRepository.findByType(TaskEvent.TaskEventType.TASK);
    }

    @Override
    public List<TaskEvent> getAllTasksByDateRange(Date start, Date end) {
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Admin privileges required to view all tasks");
        }
        return taskEventRepository.findByTypeAndDueDateBetween(TaskEvent.TaskEventType.TASK, start, end);
    }

    @Override
    public List<TaskEvent> getUserAssignedTasks(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();

        if (!currentUserId.equals(userId) && !isAdmin) {
            throw new UnauthorizedException("You don't have permission to view these tasks");
        }

        return taskEventRepository.findAssignedTasksByUserIdAndDateRange(userId, null, null);
    }

    @Override
    public List<TaskEvent> getUserAssignedTasksByDateRange(Long userId, Date start, Date end) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();

        if (!currentUserId.equals(userId) && !isAdmin) {
            throw new UnauthorizedException("You don't have permission to view these tasks");
        }

        return taskEventRepository.findAssignedTasksByUserIdAndDateRange(userId, start, end);
    }

    @Override
    public List<TaskEvent> getAllVisibleTasks(Long userId) {
        return taskEventRepository.findAllVisibleTasksBetween(userId, null, null);
    }

    @Override
    public List<TaskEvent> getAllVisibleTasksByDateRange(Long userId, Date start, Date end) {
        return taskEventRepository.findAllVisibleTasksBetween(userId, start, end);
    }

    @Override
    public TaskEvent getTaskById(Long id) {
        TaskEvent taskEvent = taskEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaskEvent", "id", id));

        if (taskEvent.getType() != TaskEvent.TaskEventType.TASK) {
            throw new ResourceNotFoundException("Task", "id", id);
        }

        checkAccessPermissions(taskEvent);
        return taskEvent;
    }

    @Override
    @Transactional
    public TaskEvent toggleTaskCompletion(Long id) {
        TaskEvent taskEvent = getTaskById(id);

        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();
        boolean isAssigned = taskEvent.getAssignedUsers().stream()
                .anyMatch(user -> user.getId().equals(currentUserId));

        if (!isAssigned && !isAdmin) {
            throw new UnauthorizedException("You don't have permission to update this task");
        }

        if (taskEvent.getStatus() == TaskEvent.TaskEventStatus.COMPLETED) {
            taskEvent.setStatus(TaskEvent.TaskEventStatus.PENDING);
            taskEvent.setCompletedDate(null);
        } else {
            taskEvent.setStatus(TaskEvent.TaskEventStatus.COMPLETED);
            taskEvent.setCompletedDate(new Date());
        }

        TaskEvent updatedTask = taskEventRepository.save(taskEvent);

        logService.createLog(
                AppConstants.LOG_ACTION_UPDATE,
                "Task completion toggled: " + taskEvent.getTitle(),
                getClientIp(),
                "TASK",
                currentUserId);

        return updatedTask;
    }

    // Event specific methods
    @Override
    public List<TaskEvent> getAllEvents() {
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Admin privileges required to view all events");
        }
        return taskEventRepository.findByType(TaskEvent.TaskEventType.EVENT);
    }

    @Override
    public List<TaskEvent> getAllEventsByDateRange(Date start, Date end) {
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Admin privileges required to view all events");
        }
        return taskEventRepository.findByTypeAndStartTimeBetween(TaskEvent.TaskEventType.EVENT, start, end);
    }

    @Override
    public List<TaskEvent> getUserAssignedEvents(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();

        if (!currentUserId.equals(userId) && !isAdmin) {
            throw new UnauthorizedException("You don't have permission to view these events");
        }

        return taskEventRepository.findAssignedEventsByUserIdAndDateRange(userId, null, null);
    }

    @Override
    public List<TaskEvent> getUserAssignedEventsByDateRange(Long userId, Date start, Date end) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();

        if (!currentUserId.equals(userId) && !isAdmin) {
            throw new UnauthorizedException("You don't have permission to view these events");
        }

        return taskEventRepository.findAssignedEventsByUserIdAndDateRange(userId, start, end);
    }

    @Override
    public List<TaskEvent> getAllVisibleEvents(Long userId) {
        return taskEventRepository.findAllVisibleEventsBetween(userId, null, null);
    }

    @Override
    public List<TaskEvent> getAllVisibleEventsByDateRange(Long userId, Date start, Date end) {
        return taskEventRepository.findAllVisibleEventsBetween(userId, start, end);
    }

    @Override
    public TaskEvent getEventById(Long id) {
        TaskEvent taskEvent = taskEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaskEvent", "id", id));

        if (taskEvent.getType() != TaskEvent.TaskEventType.EVENT) {
            throw new ResourceNotFoundException("Event", "id", id);
        }

        checkAccessPermissions(taskEvent);
        return taskEvent;
    }

    @Override
    public TaskEvent getTaskEventById(Long id) {
        TaskEvent taskEvent = taskEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaskEvent", "id", id));

        checkAccessPermissions(taskEvent);
        return taskEvent;
    }

    @Override
    public List<TaskEvent> getAllTaskEvents() {
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Admin privileges required to view all task events");
        }
        return taskEventRepository.findAll();
    }

    // Helper methods
    private void checkAccessPermissions(TaskEvent taskEvent) {
        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();

        boolean hasAccess = taskEvent.isGlobal() ||
                isAdmin ||
                taskEvent.getAssignedUsers().stream()
                        .anyMatch(user -> user.getId().equals(currentUserId));

        if (!hasAccess) {
            throw new UnauthorizedException("You don't have permission to view this item");
        }
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

    private boolean checkIfAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
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