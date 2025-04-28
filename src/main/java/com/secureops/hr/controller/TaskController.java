package com.secureops.hr.controller;


import com.secureops.hr.dto.TaskDTO;
import com.secureops.hr.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/tasks")
public class TaskController {

    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/create")
    public ResponseEntity<TaskDTO> createTask(@RequestBody TaskDTO taskDTO) {
        TaskDTO createdTask = taskService.createTask(taskDTO);
        return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TaskDTO>> getTasksByEmployeeId(@PathVariable Long employeeId) {
        List<TaskDTO> tasks = taskService.getTasksByEmployeeId(employeeId);
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<TaskDTO> updateTask(
            @PathVariable Long id,
            @RequestBody TaskDTO taskDTO) {
        TaskDTO updatedTask = taskService.updateTask(id, taskDTO);
        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<TaskDTO>> getOverdueTasks() {
        List<TaskDTO> tasks = taskService.getOverdueTasks();
        return ResponseEntity.ok(tasks);
    }
}