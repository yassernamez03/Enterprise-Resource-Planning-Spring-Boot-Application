package com.secureops.hr.controller;


import com.secureops.hr.dto.HRTaskDTO;
import com.secureops.hr.service.HRTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/tasks")
public class HRTaskController {

    private final HRTaskService taskService;

    @Autowired
    public HRTaskController(HRTaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/create")
    public ResponseEntity<HRTaskDTO> createTask(@RequestBody HRTaskDTO taskDTO) {
        HRTaskDTO createdTask = taskService.createTask(taskDTO);
        return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<HRTaskDTO>> getTasksByEmployeeId(@PathVariable Long employeeId) {
        List<HRTaskDTO> tasks = taskService.getTasksByEmployeeId(employeeId);
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<HRTaskDTO> updateTask(
            @PathVariable Long id,
            @RequestBody HRTaskDTO taskDTO) {
        HRTaskDTO updatedTask = taskService.updateTask(id, taskDTO);
        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<HRTaskDTO>> getOverdueTasks() {
        List<HRTaskDTO> tasks = taskService.getOverdueTasks();
        return ResponseEntity.ok(tasks);
    }
}