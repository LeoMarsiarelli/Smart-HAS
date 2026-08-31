package com.smarthas.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "blood_pressure_reading")
public class BloodPressureReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int systolic;

    @Column(nullable = false)
    private int diastolic;

    private Integer pulse;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private Instant measuredAt = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BpClassification classification;

    protected BloodPressureReading() {
    }

    public BloodPressureReading(User user, int systolic, int diastolic, Integer pulse, String notes, Instant measuredAt) {
        this.user = user;
        this.systolic = systolic;
        this.diastolic = diastolic;
        this.pulse = pulse;
        this.notes = notes;
        this.measuredAt = measuredAt != null ? measuredAt : Instant.now();
        this.classification = BpClassification.classify(systolic, diastolic);
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public int getSystolic() {
        return systolic;
    }

    public int getDiastolic() {
        return diastolic;
    }

    public Integer getPulse() {
        return pulse;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getMeasuredAt() {
        return measuredAt;
    }

    public BpClassification getClassification() {
        return classification;
    }

    public void update(int systolic, int diastolic, Integer pulse, String notes, Instant measuredAt) {
        this.systolic = systolic;
        this.diastolic = diastolic;
        this.pulse = pulse;
        this.notes = notes;
        if (measuredAt != null) {
            this.measuredAt = measuredAt;
        }
        this.classification = BpClassification.classify(systolic, diastolic);
    }
}
