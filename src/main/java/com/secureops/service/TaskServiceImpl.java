package com.secureops.service;

import com.secureops.dto.TaskDto;
import com.secureops.entity.Task;
import com.secureops.entity.User;
import com.secureops.exception.BadRequestException;
import com.secureops.exception.ResourceNotFoundException;
import com.secureops.exception.UnauthorizedException;
import com.secureops.repository.TaskRepository;
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
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final LogService logService;

    public TaskServiceImpl(TaskRepository taskRepository,
                           UserRepository userRepository,
                           LogService logService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.logService = logService;
    }

    @Override
    @Transactional
    public Task createTask(TaskDto taskDto) {
        // Only admin can create tasks
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Only administrators can create tasks");
        }
        
        // Get current user (admin)
        Long currentUserId = getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        
        Task task = new Task();
        task.setTitle(taskDto.getTitle());
        task.setDescription(taskDto.getDescription());
        task.setDueDate(taskDto.getDueDate());
        task.setCompleted(taskDto.isCompleted());
        task.setPriority(taskDto.getPriority());
        task.setColor(taskDto.getColor());
        task.setGlobal(taskDto.isGlobal());
        task.setCreatedBy(currentUser);
        
        // If not global, add assigned users
        if (!task.isGlobal() && taskDto.getAssignedUserIds() != null && !taskDto.getAssignedUserIds().isEmpty()) {
            Set<User> assignedUsers = taskDto.getAssignedUserIds().stream()
                    .map(userId -> userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId)))
                    .collect(Collectors.toSet());
            task.setAssignedUsers(assignedUsers);
        }
        
        Task savedTask = taskRepository.save(task);
        
        // Log task creation
        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "Task created: " + task.getTitle(),
                getClientIp(),
                "TASK",
                currentUserId
        );
        
        return savedTask;
    }

    @Override
    public List<Task> getAllTasks() {
        // Only admins can see all tasks
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Admin privileges required to view all tasks");
        }
        
        return taskRepository.findAll();
    }

    @Override
    public List<Task> getAllTasksByDateRange(Date start, Date end) {
        // Only admins can see all tasks
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Admin privileges required to view all tasks");
        }
        
        return taskRepository.findByDueDateBetween(start, end);
    }

    @Override
    public List<Task> getUserAssignedTasks(Long userId) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Check permissions
        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();
        
        if (!currentUserId.equals(userId) && !isAdmin) {
            throw new UnauthorizedException("You don't have permission to view these tasks");
        }
        
        return taskRepository.findByAssignedUserId(userId);
    }

    @Override
    public List<Task> getUserAssignedTasksByDateRange(Long userId, Date start, Date end) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Check permissions
        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();
        
        if (!currentUserId.equals(userId) && !isAdmin) {
            throw new UnauthorizedException("You don't have permission to view these tasks");
        }
        
        return taskRepository.findByAssignedUserIdAndDateRange(userId, start, end);
    }

    @Override
    public List<Task> getAllVisibleTasks(Long userId) {
        // Return all global tasks and tasks assigned to the user
        return taskRepository.findAllVisibleTasks(userId);
    }

    @Override
    public List<Task> getAllVisibleTasksByDateRange(Long userId, Date start, Date end) {
        // Return all global tasks and tasks assigned to the user within the date range
        return taskRepository.findAllVisibleTasksBetween(userId, start, end);
    }

    @Override
    public Task getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));
        
        // Check if user can view this task
        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();
        
        // Check if the user has access to this task
        boolean hasAccess = task.isGlobal() || 
                            isAdmin || 
                            task.getAssignedUsers().stream()
                                .anyMatch(user -> user.getId().equals(currentUserId));
        
        if (!hasAccess) {
            throw new UnauthorizedException("You don't have permission to view this task");
        }
        
        return task;
    }
    
    @Override
    @Transactional
    public Task updateTask(Long id, TaskDto taskDto) {
        // Only admin can update tasks
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Only administrators can update tasks");
        }
        
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));
        
        task.setTitle(taskDto.getTitle());
        task.setDescription(taskDto.getDescription());
        task.setDueDate(taskDto.getDueDate());
        task.setCompleted(taskDto.isCompleted());
        task.setPriority(taskDto.getPriority());
        task.setColor(taskDto.getColor());
        task.setGlobal(taskDto.isGlobal());
        
        // Update assigned users if not global
        if (!task.isGlobal()) {
            // Clear existing assignments
            task.getAssignedUsers().clear();
            
            // Add new assignments if provided
            if (taskDto.getAssignedUserIds() != null && !taskDto.getAssignedUserIds().isEmpty()) {
                Set<User> assignedUsers = taskDto.getAssignedUserIds().stream()
                        .map(userId -> userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId)))
                        .collect(Collectors.toSet());
                task.setAssignedUsers(assignedUsers);
            }
        } else {
            // If global, clear assigned users
            task.getAssignedUsers().clear();
        }
        
        Task updatedTask = taskRepository.save(task);
        
        // Log task update
        logService.createLog(
                AppConstants.LOG_ACTION_UPDATE,
                "Task updated: " + task.getTitle(),
                getClientIp(),
                "TASK",
                getCurrentUserId()
        );
        
        return updatedTask;
    }

    @Override
    @Transactional
    public void deleteTask(Long id) {
        // Only admin can delete tasks
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Only administrators can delete tasks");
        }
        
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));
        
        taskRepository.delete(task);
        
        // Log task deletion
        logService.createLog(
                AppConstants.LOG_ACTION_DELETE,
                "Task deleted: " + task.getTitle(),
                getClientIp(),
                "TASK",
                getCurrentUserId()
        );
    }

    @Override
    @Transactional
    public Task toggleTaskCompletion(Long id) {
        Task task = getTaskById(id);
        
        // Get current user
        Long currentUserId = getCurrentUserId();
        
        // Only users assigned to the task or admins can toggle completion
        boolean isAdmin = checkIfAdmin();
        boolean isAssigned = task.getAssignedUsers().stream()
                .anyMatch(user -> user.getId().equals(currentUserId));
        
        if (!isAssigned && !isAdmin) {
            throw new UnauthorizedException("You don't have permission to update this task");
        }
        
        task.setCompleted(!task.isCompleted());
        
        Task updatedTask = taskRepository.save(task);
        
        // Log task update
        logService.createLog(
                AppConstants.LOG_ACTION_UPDATE,
                "Task completion toggled: " + task.getTitle(),
                getClientIp(),
                "TASK",
                currentUserId
        );
        
        return updatedTask;
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