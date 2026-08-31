import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ReadingService } from '../../services/reading.service';
import { DeliveryService } from '../../services/delivery.service';
import { BloodPressureReading, Classification } from '../../models/reading.model';
import { DeliveryPriority, MedicationDeliveryRequest } from '../../models/delivery.model';

interface CountEntry<T extends string> {
  key: T;
  count: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  loading = true;
  errorMessage = '';

  readings: BloodPressureReading[] = [];
  deliveries: MedicationDeliveryRequest[] = [];

  classificationCounts: CountEntry<Classification>[] = [];
  priorityCounts: CountEntry<DeliveryPriority>[] = [];
  pendingDeliveries = 0;
  urgentDeliveries = 0;

  constructor(
    public auth: AuthService,
    private readingService: ReadingService,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      readings: this.readingService.getReadings(),
      deliveries: this.deliveryService.getDeliveries()
    }).subscribe({
      next: ({ readings, deliveries }) => {
        this.readings = readings;
        this.deliveries = deliveries;
        this.classificationCounts = this.countBy(readings, (r) => r.classification);
        this.priorityCounts = this.countBy(deliveries, (d) => d.priority);
        this.pendingDeliveries = deliveries.filter((d) => d.status === 'PENDENTE').length;
        this.urgentDeliveries = deliveries.filter((d) => d.priority === 'URGENTE').length;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message || 'Não foi possível carregar o resumo. Tente novamente.';
      }
    });
  }

  private countBy<T, K extends string>(items: T[], keyFn: (item: T) => K): CountEntry<K>[] {
    const map = new Map<K, number>();
    for (const item of items) {
      const key = keyFn(item);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
  }
}
