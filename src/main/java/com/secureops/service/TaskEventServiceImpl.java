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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(TaskEventServiceImpl.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final TaskEventRepository taskEventRepository;
    private final UserRepository userRepository;
    private final LogService logService;

    public TaskEventServiceImpl(TaskEventRepository taskEventRepository,
            UserRepository userRepository,
            LogService logService) {
        this.taskEventRepository = taskEventRepository;
        this.userRepository = userRepository;
        this.logService = logService;
        logger.info("TaskEventServiceImpl initialized");
    }

    @Override
    @Transactional
    public TaskEvent createTaskEvent(TaskEventDto taskEventDto) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Attempting to create task/event by userId: {}, type: {}", currentUserId, taskEventDto.getType());

        try {
            if (!checkIfAdmin()) {
                logger.warn("Non-admin user {} attempted to create task/event", currentUserId);
                securityLogger.warn("Unauthorized task/event creation attempt by userId: {} from IP: {}", currentUserId, clientIp);
                throw new UnauthorizedException("Only administrators can create task events");
            }

            User currentUser = userRepository.findById(currentUserId)
                    .orElseThrow(() -> {
                        logger.warn("User not found: {}", currentUserId);
                        securityLogger.warn("Task/event creation attempt by non-existent userId: {} from IP: {}", currentUserId, clientIp);
                        return new UnauthorizedException("User not found");
                    });

            // Validate based on type
            if (taskEventDto.getType() == TaskEvent.TaskEventType.EVENT) {
                if (taskEventDto.getStartTime() == null) {
                    logger.warn("Missing start time for event creation by userId: {}", currentUserId);
                    throw new BadRequestException("Start time is required for events");
                }
            } else {
                if (taskEventDto.getDueDate() == null) {
                    logger.warn("Missing due date for task creation by userId: {}", currentUserId);
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
            if (taskEventDto.getType() == TaskEvent.TaskEventType.TASK &&
                    taskEventDto.getStatus() == TaskEvent.TaskEventStatus.COMPLETED) {
                taskEvent.setCompletedDate(new Date());
                logger.debug("Setting completed date for task: {}", taskEventDto.getTitle());
            }

            // If not global, add assigned users
            if (!taskEvent.isGlobal() && taskEventDto.getAssignedUserIds() != null
                    && !taskEventDto.getAssignedUserIds().isEmpty()) {
                Set<User> assignedUsers = taskEventDto.getAssignedUserIds().stream()
                        .map(userId -> userRepository.findById(userId)
                                .orElseThrow(() -> {
                                    logger.warn("Assigned user not found: {}", userId);
                                    return new ResourceNotFoundException("User", "id", userId);
                                }))
                        .collect(Collectors.toSet());
                taskEvent.setAssignedUsers(assignedUsers);
                logger.debug("Assigned {} users to task/event: {}", assignedUsers.size(), taskEventDto.getTitle());
            }

            TaskEvent savedTaskEvent = taskEventRepository.save(taskEvent);
            logger.info("Task/event created successfully: {} (ID: {}) by userId: {}", 
                    taskEvent.getTitle(), savedTaskEvent.getId(), currentUserId);

            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "TaskEvent created: " + taskEvent.getTitle(),
                    clientIp,
                    taskEvent.getType().name(),
                    currentUserId);

            return savedTaskEvent;

        } catch (UnauthorizedException | BadRequestException | ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error creating task/event by userId: {}", currentUserId, ex);
            securityLogger.error("Error creating task/event - userId: {}, IP: {}, Error: {}", 
                    currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public TaskEvent updateTaskEvent(Long id, TaskEventDto taskEventDto) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Attempting to update task/event ID: {} by userId: {}", id, currentUserId);

        try {
            if (!checkIfAdmin()) {
                logger.warn("Non-admin user {} attempted to update task/event ID: {}", currentUserId, id);
                securityLogger.warn("Unauthorized task/event update attempt by userId: {} for ID: {} from IP: {}", 
                        currentUserId, id, clientIp);
                throw new UnauthorizedException("Only administrators can update task events");
            }

            TaskEvent taskEvent = taskEventRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.warn("Task/event not found: {}", id);
                        securityLogger.warn("Attempt to update non-existent task/event ID: {} by userId: {} from IP: {}", 
                                id, currentUserId, clientIp);
                        return new ResourceNotFoundException("TaskEvent", "id", id);
                    });

            // Validate based on type
            if (taskEventDto.getType() == TaskEvent.TaskEventType.EVENT) {
                if (taskEventDto.getStartTime() == null) {
                    logger.warn("Missing start time for event update ID: {} by userId: {}", id, currentUserId);
                    throw new BadRequestException("Start time is required for events");
                }
            } else {
                if (taskEventDto.getDueDate() == null) {
                    logger.warn("Missing due date for task update ID: {} by userId: {}", id, currentUserId);
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
                logger.debug("Updating completed date for task: {}", taskEventDto.getTitle());
            }

            // Update assigned users if not global
            if (!taskEvent.isGlobal()) {
                taskEvent.getAssignedUsers().clear();
                if (taskEventDto.getAssignedUserIds() != null && !taskEventDto.getAssignedUserIds().isEmpty()) {
                    Set<User> assignedUsers = taskEventDto.getAssignedUserIds().stream()
                            .map(userId -> userRepository.findById(userId)
                                    .orElseThrow(() -> {
                                        logger.warn("Assigned user not found: {}", userId);
                                        return new ResourceNotFoundException("User", "id", userId);
                                    }))
                            .collect(Collectors.toSet());
                    taskEvent.setAssignedUsers(assignedUsers);
                    logger.debug("Updated assigned users (count: {}) for task/event: {}", assignedUsers.size(), taskEventDto.getTitle());
                }
            } else {
                taskEvent.getAssignedUsers().clear();
                logger.debug("Cleared assigned users for global task/event: {}", taskEventDto.getTitle());
            }

            TaskEvent updatedTaskEvent = taskEventRepository.save(taskEvent);
            logger.info("Task/event updated successfully: {} (ID: {}) by userId: {}", 
                    taskEvent.getTitle(), id, currentUserId);

            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "TaskEvent updated: " + taskEvent.getTitle(),
                    clientIp,
                    taskEvent.getType().name(),
                    currentUserId);

            return updatedTaskEvent;

        } catch (UnauthorizedException | BadRequestException | ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error updating task/event ID: {} by userId: {}", id, currentUserId, ex);
            securityLogger.error("Error updating task/event - ID: {}, userId: {}, IP: {}, Error: {}", 
                    id, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public void deleteTaskEvent(Long id) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Attempting to delete task/event ID: {} by userId: {}", id, currentUserId);

        try {
            if (!checkIfAdmin()) {
                logger.warn("Non-admin user {} attempted to delete task/event ID: {}", currentUserId, id);
                securityLogger.warn("Unauthorized task/event deletion attempt by userId: {} for ID: {} from IP: {}", 
                        currentUserId, id, clientIp);
                throw new UnauthorizedException("Only administrators can delete task events");
            }

            TaskEvent taskEvent = taskEventRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.warn("Task/event not found: {}", id);
                        securityLogger.warn("Attempt to delete non-existent task/event ID: {} by userId: {} from IP: {}", 
                                id, currentUserId, clientIp);
                        return new ResourceNotFoundException("TaskEvent", "id", id);
                    });

            taskEventRepository.delete(taskEvent);
            logger.info("Task/event deleted successfully: {} (ID: {}) by userId: {}", 
                    taskEvent.getTitle(), id, currentUserId);

            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "TaskEvent deleted: " + taskEvent.getTitle(),
                    clientIp,
                    taskEvent.getType().name(),
                    currentUserId);

        } catch (UnauthorizedException | ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error deleting task/event ID: {} by userId: {}", id, currentUserId, ex);
            securityLogger.error("Error deleting task/event - ID: {}, userId: {}, IP: {}, Error: {}", 
                    id, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getAllTasks() {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving all tasks by userId: {}", currentUserId);

        try {
            if (!checkIfAdmin()) {
                logger.warn("Non-admin user {} attempted to view all tasks", currentUserId);
                securityLogger.warn("Unauthorized attempt to view all tasks by userId: {} from IP: {}", currentUserId, clientIp);
                throw new UnauthorizedException("Admin privileges required to view all tasks");
            }

            List<TaskEvent> tasks = taskEventRepository.findByType(TaskEvent.TaskEventType.TASK);
            logger.info("Retrieved {} tasks for userId: {}", tasks.size(), currentUserId);
            return tasks;

        } catch (UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving all tasks for userId: {}", currentUserId, ex);
            securityLogger.error("Error retrieving all tasks - userId: {}, IP: {}, Error: {}", 
                    currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getAllTasksByDateRange(Date start, Date end) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving tasks by date range for userId: {}, start: {}, end: {}", currentUserId, start, end);

        try {
            if (!checkIfAdmin()) {
                logger.warn("Non-admin user {} attempted to view tasks by date range", currentUserId);
                securityLogger.warn("Unauthorized attempt to view tasks by date range by userId: {} from IP: {}", currentUserId, clientIp);
                throw new UnauthorizedException("Admin privileges required to view all tasks");
            }

            List<TaskEvent> tasks = taskEventRepository.findByTypeAndDueDateBetween(TaskEvent.TaskEventType.TASK, start, end);
            logger.info("Retrieved {} tasks by date range for userId: {}", tasks.size(), currentUserId);
            return tasks;

        } catch (UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving tasks by date range for userId: {}", currentUserId, ex);
            securityLogger.error("Error retrieving tasks by date range - userId: {}, IP: {}, Error: {}", 
                    currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getUserAssignedTasks(Long userId) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving assigned tasks for userId: {} by currentUserId: {}", userId, currentUserId);

        try {
            userRepository.findById(userId)
                    .orElseThrow(() -> {
                        logger.warn("User not found: {}", userId);
                        securityLogger.warn("Attempt to retrieve tasks for non-existent userId: {} by currentUserId: {} from IP: {}", 
                                userId, currentUserId, clientIp);
                        return new ResourceNotFoundException("User", "id", userId);
                    });

            boolean isAdmin = checkIfAdmin();
            if (!currentUserId.equals(userId) && !isAdmin) {
                logger.warn("User {} attempted to view tasks of user {}", currentUserId, userId);
                securityLogger.warn("Unauthorized attempt to view tasks by userId: {} for userId: {} from IP: {}", 
                        currentUserId, userId, clientIp);
                throw new UnauthorizedException("You don't have permission to view these tasks");
            }

            List<TaskEvent> tasks = taskEventRepository.findAssignedTasksByUserIdAndDateRange(userId, null, null);
            logger.info("Retrieved {} assigned tasks for userId: {} by currentUserId: {}", tasks.size(), userId, currentUserId);
            return tasks;

        } catch (ResourceNotFoundException | UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving assigned tasks for userId: {} by currentUserId: {}", userId, currentUserId, ex);
            securityLogger.error("Error retrieving assigned tasks - userId: {}, currentUserId: {}, IP: {}, Error: {}", 
                    userId, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getUserAssignedTasksByDateRange(Long userId, Date start, Date end) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving assigned tasks by date range for userId: {} by currentUserId: {}, start: {}, end: {}", 
                userId, currentUserId, start, end);

        try {
            userRepository.findById(userId)
                    .orElseThrow(() -> {
                        logger.warn("User not found: {}", userId);
                        securityLogger.warn("Attempt to retrieve tasks by date range for non-existent userId: {} by currentUserId: {} from IP: {}", 
                                userId, currentUserId, clientIp);
                        return new ResourceNotFoundException("User", "id", userId);
                    });

            boolean isAdmin = checkIfAdmin();
            if (!currentUserId.equals(userId) && !isAdmin) {
                logger.warn("User {} attempted to view tasks by date range of user {}", currentUserId, userId);
                securityLogger.warn("Unauthorized attempt to view tasks by date range by userId: {} for userId: {} from IP: {}", 
                        currentUserId, userId, clientIp);
                throw new UnauthorizedException("You don't have permission to view these tasks");
            }

            List<TaskEvent> tasks = taskEventRepository.findAssignedTasksByUserIdAndDateRange(userId, start, end);
            logger.info("Retrieved {} assigned tasks by date range for userId: {} by currentUserId: {}", 
                    tasks.size(), userId, currentUserId);
            return tasks;

        } catch (ResourceNotFoundException | UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving assigned tasks by date range for userId: {} by currentUserId: {}", 
                    userId, currentUserId, ex);
            securityLogger.error("Error retrieving assigned tasks by date range - userId: {}, currentUserId: {}, IP: {}, Error: {}", 
                    userId, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getAllVisibleTasks(Long userId) {
        String clientIp = getClientIp();
        logger.debug("Retrieving all visible tasks for userId: {}", userId);

        try {
            List<TaskEvent> tasks = taskEventRepository.findAllVisibleTasksBetween(userId, null, null);
            logger.info("Retrieved {} visible tasks for userId: {}", tasks.size(), userId);
            return tasks;

        } catch (Exception ex) {
            logger.error("Unexpected error retrieving visible tasks for userId: {}", userId, ex);
            securityLogger.error("Error retrieving visible tasks - userId: {}, IP: {}, Error: {}", 
                    userId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getAllVisibleTasksByDateRange(Long userId, Date start, Date end) {
        String clientIp = getClientIp();
        logger.debug("Retrieving visible tasks by date range for userId: {}, start: {}, end: {}", userId, start, end);

        try {
            List<TaskEvent> tasks = taskEventRepository.findAllVisibleTasksBetween(userId, start, end);
            logger.info("Retrieved {} visible tasks by date range for userId: {}", tasks.size(), userId);
            return tasks;

        } catch (Exception ex) {
            logger.error("Unexpected error retrieving visible tasks by date range for userId: {}", userId, ex);
            securityLogger.error("Error retrieving visible tasks by date range - userId: {}, IP: {}, Error: {}", 
                    userId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public TaskEvent getTaskById(Long id) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving task ID: {} by userId: {}", id, currentUserId);

        try {
            TaskEvent taskEvent = taskEventRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.warn("Task not found: {}", id);
                        securityLogger.warn("Attempt to retrieve non-existent task ID: {} by userId: {} from IP: {}", 
                                id, currentUserId, clientIp);
                        return new ResourceNotFoundException("TaskEvent", "id", id);
                    });

            if (taskEvent.getType() != TaskEvent.TaskEventType.TASK) {
                logger.warn("Requested ID: {} is not a task", id);
                throw new ResourceNotFoundException("Task", "id", id);
            }

            checkAccessPermissions(taskEvent);
            logger.info("Task retrieved successfully: {} (ID: {}) by userId: {}", taskEvent.getTitle(), id, currentUserId);
            return taskEvent;

        } catch (ResourceNotFoundException | UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving task ID: {} by userId: {}", id, currentUserId, ex);
            securityLogger.error("Error retrieving task - ID: {}, userId: {}, IP: {}, Error: {}", 
                    id, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public TaskEvent toggleTaskCompletion(Long id) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Attempting to toggle completion for task ID: {} by userId: {}", id, currentUserId);

        try {
            TaskEvent taskEvent = getTaskById(id);

            boolean isAdmin = checkIfAdmin();
            boolean isAssigned = taskEvent.getAssignedUsers().stream()
                    .anyMatch(user -> user.getId().equals(currentUserId));

            if (!isAssigned && !isAdmin) {
                logger.warn("User {} not assigned or admin for task ID: {}", currentUserId, id);
                securityLogger.warn("Unauthorized attempt to toggle task completion by userId: {} for task ID: {} from IP: {}", 
                        currentUserId, id, clientIp);
                throw new UnauthorizedException("You don't have permission to update this task");
            }

            if (taskEvent.getStatus() == TaskEvent.TaskEventStatus.COMPLETED) {
                taskEvent.setStatus(TaskEvent.TaskEventStatus.PENDING);
                taskEvent.setCompletedDate(null);
                logger.debug("Task ID: {} set to PENDING by userId: {}", id, currentUserId);
            } else {
                taskEvent.setStatus(TaskEvent.TaskEventStatus.COMPLETED);
                taskEvent.setCompletedDate(new Date());
                logger.debug("Task ID: {} set to COMPLETED by userId: {}", id, currentUserId);
            }

            TaskEvent updatedTask = taskEventRepository.save(taskEvent);
            logger.info("Task completion toggled successfully: {} (ID: {}) by userId: {}", 
                    taskEvent.getTitle(), id, currentUserId);

            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Task completion toggled: " + taskEvent.getTitle(),
                    clientIp,
                    "TASK",
                    currentUserId);

            return updatedTask;

        } catch (ResourceNotFoundException | UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error toggling task completion for ID: {} by userId: {}", id, currentUserId, ex);
            securityLogger.error("Error toggling task completion - ID: {}, userId: {}, IP: {}, Error: {}", 
                    id, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getAllEvents() {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving all events by userId: {}", currentUserId);

        try {
            if (!checkIfAdmin()) {
                logger.warn("Non-admin user {} attempted to view all events", currentUserId);
                securityLogger.warn("Unauthorized attempt to view all events by userId: {} from IP: {}", currentUserId, clientIp);
                throw new UnauthorizedException("Admin privileges required to view all events");
            }

            List<TaskEvent> events = taskEventRepository.findByType(TaskEvent.TaskEventType.EVENT);
            logger.info("Retrieved {} events for userId: {}", events.size(), currentUserId);
            return events;

        } catch (UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving all events for userId: {}", currentUserId, ex);
            securityLogger.error("Error retrieving all events - userId: {}, IP: {}, Error: {}", 
                    currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getAllEventsByDateRange(Date start, Date end) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving events by date range for userId: {}, start: {}, end: {}", currentUserId, start, end);

        try {
            if (!checkIfAdmin()) {
                logger.warn("Non-admin user {} attempted to view events by date range", currentUserId);
                securityLogger.warn("Unauthorized attempt to view events by date range by userId: {} from IP: {}", currentUserId, clientIp);
                throw new UnauthorizedException("Admin privileges required to view all events");
            }

            List<TaskEvent> events = taskEventRepository.findByTypeAndStartTimeBetween(TaskEvent.TaskEventType.EVENT, start, end);
            logger.info("Retrieved {} events by date range for userId: {}", events.size(), currentUserId);
            return events;

        } catch (UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving events by date range for userId: {}", currentUserId, ex);
            securityLogger.error("Error retrieving events by date range - userId: {}, IP: {}, Error: {}", 
                    currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getUserAssignedEvents(Long userId) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving assigned events for userId: {} by currentUserId: {}", userId, currentUserId);

        try {
            userRepository.findById(userId)
                    .orElseThrow(() -> {
                        logger.warn("User not found: {}", userId);
                        securityLogger.warn("Attempt to retrieve events for non-existent userId: {} by currentUserId: {} from IP: {}", 
                                userId, currentUserId, clientIp);
                        return new ResourceNotFoundException("User", "id", userId);
                    });

            boolean isAdmin = checkIfAdmin();
            if (!currentUserId.equals(userId) && !isAdmin) {
                logger.warn("User {} attempted to view events of user {}", currentUserId, userId);
                securityLogger.warn("Unauthorized attempt to view events by userId: {} for userId: {} from IP: {}", 
                        currentUserId, userId, clientIp);
                throw new UnauthorizedException("You don't have permission to view these events");
            }

            List<TaskEvent> events = taskEventRepository.findAssignedEventsByUserIdAndDateRange(userId, null, null);
            logger.info("Retrieved {} assigned events for userId: {} by currentUserId: {}", events.size(), userId, currentUserId);
            return events;

        } catch (ResourceNotFoundException | UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving assigned events for userId: {} by currentUserId: {}", userId, currentUserId, ex);
            securityLogger.error("Error retrieving assigned events - userId: {}, currentUserId: {}, IP: {}, Error: {}", 
                    userId, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getUserAssignedEventsByDateRange(Long userId, Date start, Date end) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving assigned events by date range for userId: {} by currentUserId: {}, start: {}, end: {}", 
                userId, currentUserId, start, end);

        try {
            userRepository.findById(userId)
                    .orElseThrow(() -> {
                        logger.warn("User not found: {}", userId);
                        securityLogger.warn("Attempt to retrieve events by date range for non-existent userId: {} by currentUserId: {} from IP: {}", 
                                userId, currentUserId, clientIp);
                        return new ResourceNotFoundException("User", "id", userId);
                    });

            boolean isAdmin = checkIfAdmin();
            if (!currentUserId.equals(userId) && !isAdmin) {
                logger.warn("User {} attempted to view events by date range of user {}", currentUserId, userId);
                securityLogger.warn("Unauthorized attempt to view events by date range by userId: {} for userId: {} from IP: {}", 
                        currentUserId, userId, clientIp);
                throw new UnauthorizedException("You don't have permission to view these events");
            }

            List<TaskEvent> events = taskEventRepository.findAssignedEventsByUserIdAndDateRange(userId, start, end);
            logger.info("Retrieved {} assigned events by date range for userId: {} by currentUserId: {}", 
                    events.size(), userId, currentUserId);
            return events;

        } catch (ResourceNotFoundException | UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving assigned events by date range for userId: {} by currentUserId: {}", 
                    userId, currentUserId, ex);
            securityLogger.error("Error retrieving assigned events by date range - userId: {}, currentUserId: {}, IP: {}, Error: {}", 
                    userId, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getAllVisibleEvents(Long userId) {
        String clientIp = getClientIp();
        logger.debug("Retrieving all visible events for userId: {}", userId);

        try {
            List<TaskEvent> events = taskEventRepository.findAllVisibleEventsBetween(userId, null, null);
            logger.info("Retrieved {} visible events for userId: {}", events.size(), userId);
            return events;

        } catch (Exception ex) {
            logger.error("Unexpected error retrieving visible events for userId: {}", userId, ex);
            securityLogger.error("Error retrieving visible events - userId: {}, IP: {}, Error: {}", 
                    userId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getAllVisibleEventsByDateRange(Long userId, Date start, Date end) {
        String clientIp = getClientIp();
        logger.debug("Retrieving visible events by date range for userId: {}, start: {}, end: {}", userId, start, end);

        try {
            List<TaskEvent> events = taskEventRepository.findAllVisibleEventsBetween(userId, start, end);
            logger.info("Retrieved {} visible events by date range for userId: {}", events.size(), userId);
            return events;

        } catch (Exception ex) {
            logger.error("Unexpected error retrieving visible events by date range for userId: {}", userId, ex);
            securityLogger.error("Error retrieving visible events by date range - userId: {}, IP: {}, Error: {}", 
                    userId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public TaskEvent getEventById(Long id) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving event ID: {} by userId: {}", id, currentUserId);

        try {
            TaskEvent taskEvent = taskEventRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.warn("Event not found: {}", id);
                        securityLogger.warn("Attempt to retrieve non-existent event ID: {} by userId: {} from IP: {}", 
                                id, currentUserId, clientIp);
                        return new ResourceNotFoundException("TaskEvent", "id", id);
                    });

            if (taskEvent.getType() != TaskEvent.TaskEventType.EVENT) {
                logger.warn("Requested ID: {} is not an event", id);
                throw new ResourceNotFoundException("Event", "id", id);
            }

            checkAccessPermissions(taskEvent);
            logger.info("Event retrieved successfully: {} (ID: {}) by userId: {}", taskEvent.getTitle(), id, currentUserId);
            return taskEvent;

        } catch (ResourceNotFoundException | UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving event ID: {} by userId: {}", id, currentUserId, ex);
            securityLogger.error("Error retrieving event - ID: {}, userId: {}, IP: {}, Error: {}", 
                    id, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public TaskEvent getTaskEventById(Long id) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving task/event ID: {} by userId: {}", id, currentUserId);

        try {
            TaskEvent taskEvent = taskEventRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.warn("Task/event not found: {}", id);
                        securityLogger.warn("Attempt to retrieve non-existent task/event ID: {} by userId: {} from IP: {}", 
                                id, currentUserId, clientIp);
                        return new ResourceNotFoundException("TaskEvent", "id", id);
                    });

            checkAccessPermissions(taskEvent);
            logger.info("Task/event retrieved successfully: {} (ID: {}) by userId: {}", taskEvent.getTitle(), id, currentUserId);
            return taskEvent;

        } catch (ResourceNotFoundException | UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving task/event ID: {} by userId: {}", id, currentUserId, ex);
            securityLogger.error("Error retrieving task/event - ID: {}, userId: {}, IP: {}, Error: {}", 
                    id, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<TaskEvent> getAllTaskEvents() {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Retrieving all task/events by userId: {}", currentUserId);

        try {
            if (!checkIfAdmin()) {
                logger.warn("Non-admin user {} attempted to view all task/events", currentUserId);
                securityLogger.warn("Unauthorized attempt to view all task/events by userId: {} from IP: {}", currentUserId, clientIp);
                throw new UnauthorizedException("Admin privileges required to view all task events");
            }

            List<TaskEvent> taskEvents = taskEventRepository.findAll();
            logger.info("Retrieved {} task/events for userId: {}", taskEvents.size(), currentUserId);
            return taskEvents;

        } catch (UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving all task/events for userId: {}", currentUserId, ex);
            securityLogger.error("Error retrieving all task/events - userId: {}, IP: {}, Error: {}", 
                    currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    private void checkAccessPermissions(TaskEvent taskEvent) {
        Long currentUserId = getCurrentUserId();
        logger.debug("Checking access permissions for task/event ID: {} by userId: {}", taskEvent.getId(), currentUserId);

        try {
            boolean isAdmin = checkIfAdmin();
            boolean hasAccess = taskEvent.isGlobal() ||
                    isAdmin ||
                    taskEvent.getAssignedUsers().stream()
                            .anyMatch(user -> user.getId().equals(currentUserId));

            if (!hasAccess) {
                logger.warn("User {} has no access to task/event ID: {}", currentUserId, taskEvent.getId());
                securityLogger.warn("Unauthorized access attempt to task/event ID: {} by userId: {} from IP: {}", 
                        taskEvent.getId(), currentUserId, getClientIp());
                throw new UnauthorizedException("You don't have permission to view this item");
            }
            logger.debug("Access granted for task/event ID: {} to userId: {}", taskEvent.getId(), currentUserId);

        } catch (UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error checking access for task/event ID: {} by userId: {}", taskEvent.getId(), currentUserId, ex);
            securityLogger.error("Error checking access - task/event ID: {}, userId: {}, IP: {}, Error: {}", 
                    taskEvent.getId(), currentUserId, getClientIp(), ex.getMessage());
            throw ex;
        }
    }

    private Long getCurrentUserId() {
        logger.debug("Retrieving current user ID");
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                Long userId = userRepository.findByEmail(email)
                        .map(User::getId)
                        .orElseThrow(() -> {
                            logger.warn("Authenticated user not found: {}", maskEmail(email));
                            securityLogger.warn("Authenticated user not found: {} from IP: {}", maskEmail(email), getClientIp());
                            return new UnauthorizedException("User not found");
                        });
                logger.debug("Current user ID retrieved: {}", userId);
                return userId;
            }
            logger.warn("No authenticated user found");
            securityLogger.warn("No authenticated user - IP: {}", getClientIp());
            throw new UnauthorizedException("Not authenticated");
        } catch (Exception ex) {
            logger.error("Error retrieving current user ID", ex);
            throw ex;
        }
    }

    private boolean checkIfAdmin() {
        logger.debug("Checking if current user is admin");
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            logger.debug("Admin check result: {}", isAdmin);
            return isAdmin;
        } catch (Exception ex) {
            logger.error("Error checking admin status", ex);
            return false;
        }
    }

    private String getClientIp() {
        try {
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
            logger.debug("Client IP retrieved: {}", ipAddress);
            return ipAddress;
        } catch (IllegalStateException e) {
            logger.debug("No HTTP request context available, returning unknown IP");
            return "unknown";
        } catch (Exception ex) {
            logger.error("Error retrieving client IP", ex);
            return "unknown";
        }
    }

    /**
     * Masks an email address for privacy in logs
     * Converts user@example.com to u***@e***.com
     */
    private String maskEmail(String email) {
        if (email == null || email.isEmpty() || !email.contains("@")) {
            return email;
        }

        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];

        String maskedUsername = username.substring(0, 1) + "***";

        String[] domainParts = domain.split("\\.");
        String domainName = domainParts[0];
        String tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : "";

        String maskedDomain = domainName.substring(0, 1) + "***";

        return maskedUsername + "@" + maskedDomain + "." + tld;
    }
}