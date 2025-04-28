package com.secureops.hr.service;


import com.secureops.hr.dto.TaskDTO;
import com.secureops.hr.model.Task;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {

    public TaskDTO toDto(Task task) {
        if (task == null) {
            return null;
        }

        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setDueDate(task.getDueDate());
        dto.setCompletedDate(task.getCompletedDate());
        dto.setStatus(task.getStatus());
        dto.setPriority(task.getPriority());

        if (task.getEmployee() != null) {
            dto.setEmployeeId(task.getEmployee().getId());
        }

        return dto;
    }

    public Task toEntity(TaskDTO dto) {
        if (dto == null) {
            return null;
        }

        Task task = new Task();
        task.setId(dto.getId());
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setDueDate(dto.getDueDate());
        task.setCompletedDate(dto.getCompletedDate());
        task.setStatus(dto.getStatus());
        task.setPriority(dto.getPriority());

        return task;
    }

    public Task updateEntityFromDto(TaskDTO dto, Task task) {
        if (dto == null) {
            return task;
        }

        // Only update fields that are not null
        if (dto.getTitle() != null) {
            task.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            task.setDescription(dto.getDescription());
        }
        if (dto.getDueDate() != null) {
            task.setDueDate(dto.getDueDate());
        }
        if (dto.getCompletedDate() != null) {
            task.setCompletedDate(dto.getCompletedDate());
        }
        if (dto.getStatus() != null) {
            task.setStatus(dto.getStatus());
        }
        if (dto.getPriority() != null) {
            task.setPriority(dto.getPriority());
        }

        return task;
    }
}