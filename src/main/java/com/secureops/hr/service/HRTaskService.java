package com.secureops.hr.service;

import com.secureops.hr.dto.HRTaskDTO;
import com.secureops.hr.entity.Employee;
import com.secureops.hr.entity.HRTask;
import com.secureops.hr.repository.EmployeeRepository;
import com.secureops.hr.repository.HRTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HRTaskService {

    private final HRTaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final HRTaskMapper taskMapper;

    @Autowired
    public HRTaskService(HRTaskRepository taskRepository, EmployeeRepository employeeRepository, HRTaskMapper taskMapper) {
        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
        this.taskMapper = taskMapper;
    }

    @Transactional
    public HRTaskDTO createTask(HRTaskDTO taskDTO) {
        HRTask task = taskMapper.toEntity(taskDTO);

        // Set employee if employeeId is provided
        if (taskDTO.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(taskDTO.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found with id: " + taskDTO.getEmployeeId()));
            task.setEmployee(employee);
        }

        HRTask savedTask = taskRepository.save(task);
        return taskMapper.toDto(savedTask);
    }

    public List<HRTaskDTO> getTasksByEmployeeId(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new RuntimeException("Employee not found with id: " + employeeId);
        }

        List<HRTask> tasks = taskRepository.findByEmployeeId(employeeId);
        return tasks.stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public HRTaskDTO updateTask(Long id, HRTaskDTO taskDTO) {
        HRTask existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));

        // Update task properties
        HRTask updatedTask = taskMapper.updateEntityFromDto(taskDTO, existingTask);

        // Update employee if employeeId changed
        if (taskDTO.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(taskDTO.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found with id: " + taskDTO.getEmployeeId()));
            updatedTask.setEmployee(employee);
        }

        HRTask savedTask = taskRepository.save(updatedTask);
        return taskMapper.toDto(savedTask);
    }

    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new RuntimeException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
    }

    public List<HRTaskDTO> getOverdueTasks() {
        List<HRTask> tasks = taskRepository.findByDueDateBefore(LocalDate.now());
        return tasks.stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }

    public HRTaskDTO getTaskById(Long id) {
        HRTask task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
        return taskMapper.toDto(task);
    }
}