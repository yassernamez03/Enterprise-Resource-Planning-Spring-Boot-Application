package com.secureops.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "email" })
})
@EqualsAndHashCode(of = "id") // Only use ID for equals/hashCode
@ToString(exclude = { "calendars", "messages", "logs" }) // Exclude collections from toString to prevent circular
                                                         // references
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

    
    @Column(name = "reset_code")
private String resetCode;

@Column(name = "reset_code_expiry")
private LocalDateTime resetCodeExpiry;

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

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Calendar> calendars = new HashSet<>();

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Message> messages = new HashSet<>();

    // Make sure Chat relationship also cascades
    @ManyToMany(mappedBy = "participants", cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    private Set<Chat> chats = new HashSet<>();

    // For logs, keep them when user is deleted - no cascade
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