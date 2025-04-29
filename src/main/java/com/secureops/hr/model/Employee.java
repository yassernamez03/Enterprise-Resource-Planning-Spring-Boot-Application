package com.secureops.hr.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.context.annotation.Primary;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "HREmployee")
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Primary
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private LocalDate hireDate;
    private String position;
    private Double salary;

    @Enumerated(EnumType.STRING)
    private EmployeeStatus status;

    @OneToOne(cascade = CascadeType.ALL)
    private Address address;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks = new ArrayList<>();

    private String role;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }


    @Transient
    public Integer getAge() {
        return calculateAge();
    }

    public Integer calculateAge() {
        if (dateOfBirth != null) {
            return Period.between(dateOfBirth, LocalDate.now()).getYears();
        }
        return 0;
    }

    public void addTask(Task task) {
        tasks.add(task);
        task.setEmployee(this);
    }

    public void removeTask(Task task) {
        tasks.remove(task);
        task.setEmployee(null);
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

}
