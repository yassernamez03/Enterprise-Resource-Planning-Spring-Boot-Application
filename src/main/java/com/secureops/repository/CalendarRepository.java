package com.secureops.repository;

import com.secureops.entity.Calendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarRepository extends JpaRepository<Calendar, Long> {
    List<Calendar> findByOwnerId(Long ownerId);
    Optional<Calendar> findByOwnerIdAndPrimaryTrue(Long ownerId);
}