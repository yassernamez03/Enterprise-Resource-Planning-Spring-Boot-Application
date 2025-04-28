package com.secureops.hr.service;

import com.secureops.hr.dto.TaskDTO;
import com.secureops.hr.model.Employee;
import com.secureops.hr.model.Task;
import com.secureops.hr.repository.EmployeeRepository;
import com.secureops.hr.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final TaskMapper taskMapper;

    @Autowired
    public TaskService(TaskRepository taskRepository, EmployeeRepository employeeRepository, TaskMapper taskMapper) {
        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
        this.taskMapper = taskMapper;
    }

    @Transactional
    public TaskDTO createTask(TaskDTO taskDTO) {
        Task task = taskMapper.toEntity(taskDTO);

        // Set employee if employeeId is provided
        if (taskDTO.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(taskDTO.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found with id: " + taskDTO.getEmployeeId()));
            task.setEmployee(employee);
        }

        Task savedTask = taskRepository.save(task);
        return taskMapper.toDto(savedTask);
    }

    public List<TaskDTO> getTasksByEmployeeId(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new RuntimeException("Employee not found with id: " + employeeId);
        }

        List<Task> tasks = taskRepository.findByEmployeeId(employeeId);
        return tasks.stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskDTO updateTask(Long id, TaskDTO taskDTO) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));

        // Update task properties
        Task updatedTask = taskMapper.updateEntityFromDto(taskDTO, existingTask);

        // Update employee if employeeId changed
        if (taskDTO.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(taskDTO.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found with id: " + taskDTO.getEmployeeId()));
            updatedTask.setEmployee(employee);
        }

        Task savedTask = taskRepository.save(updatedTask);
        return taskMapper.toDto(savedTask);
    }

    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new RuntimeException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
    }

    public List<TaskDTO> getOverdueTasks() {
        List<Task> tasks = taskRepository.findByDueDateBefore(LocalDate.now());
        return tasks.stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }
}