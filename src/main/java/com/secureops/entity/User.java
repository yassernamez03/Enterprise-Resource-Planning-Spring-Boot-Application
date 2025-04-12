package com.secureops.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"email"})
})
@EqualsAndHashCode(of = "id") // Only use ID for equals/hashCode
@ToString(exclude = {"calendars", "messages", "logs"}) // Exclude collections from toString to prevent circular references
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "avatar_file_name")
    private String avatarFileName = "default-avatar.png";

    private boolean isActive = false;

    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    @UpdateTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;
    
    @OneToMany(mappedBy = "owner", fetch = FetchType.LAZY)
    private Set<Calendar> calendars = new HashSet<>();

    // Removed bidirectional relationship with Chat

    @OneToMany(mappedBy = "sender", fetch = FetchType.LAZY)
    private Set<Message> messages = new HashSet<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private Set<Log> logs = new HashSet<>();

    public enum UserRole {
        USER,
        ADMIN
    }

    public enum ApprovalStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}