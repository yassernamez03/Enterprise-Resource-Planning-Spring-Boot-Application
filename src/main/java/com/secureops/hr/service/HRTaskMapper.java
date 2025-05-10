package com.secureops.hr.service;


import com.secureops.hr.dto.HRTaskDTO;
import com.secureops.hr.entity.HRTask;
import org.springframework.stereotype.Component;

@Component
public class HRTaskMapper {

    public HRTaskDTO toDto(HRTask task) {
        if (task == null) {
            return null;
        }

        HRTaskDTO dto = new HRTaskDTO();
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

    public HRTask toEntity(HRTaskDTO dto) {
        if (dto == null) {
            return null;
        }

        HRTask task = new HRTask();
        task.setId(dto.getId());
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setDueDate(dto.getDueDate());
        task.setCompletedDate(dto.getCompletedDate());
        task.setStatus(dto.getStatus());
        task.setPriority(dto.getPriority());

        return task;
    }

    public HRTask updateEntityFromDto(HRTaskDTO dto, HRTask task) {
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