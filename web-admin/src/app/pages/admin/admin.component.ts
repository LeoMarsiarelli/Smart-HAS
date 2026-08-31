import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ReadingService } from '../../services/reading.service';
import { DeliveryService } from '../../services/delivery.service';
import { AuthService } from '../../services/auth.service';
import { BloodPressureReading, Classification } from '../../models/reading.model';
import {
  CreateDeliveryRequest,
  DeliveryPriority,
  DeliveryStatus,
  MedicationDeliveryRequest
} from '../../models/delivery.model';

const CLASSIFICATIONS: Classification[] = [
  'NORMAL',
  'ELEVADA',
  'HAS_ESTAGIO_1',
  'HAS_ESTAGIO_2',
  'CRISE_HIPERTENSIVA'
];

const PRIORITIES: DeliveryPriority[] = ['URGENTE', 'ALTA', 'MEDIA', 'BAIXA'];
const STATUSES: DeliveryStatus[] = ['PENDENTE', 'EM_ROTA', 'ENTREGUE', 'CANCELADO'];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  readonly classifications = CLASSIFICATIONS;
  readonly priorities = PRIORITIES;
  readonly statuses = STATUSES;

  loading = true;
  loadError = '';

  readings: BloodPressureReading[] = [];
  deliveries: MedicationDeliveryRequest[] = [];

  // Filters (data-bound to <select> via [(ngModel)]).
  classificationFilter: Classification | 'ALL' = 'ALL';
  priorityFilter: DeliveryPriority | 'ALL' = 'ALL';
  statusFilter: DeliveryStatus | 'ALL' = 'ALL';

  // Draft status per delivery row, keyed by delivery id, for the inline
  // status-update control.
  statusDrafts: Record<number, DeliveryStatus> = {};
  statusUpdatingId: number | null = null;
  statusUpdateError = '';
  statusUpdateSuccess = '';

  // New delivery request form model, bound with [(ngModel)].
  newDelivery: CreateDeliveryRequest = {
    medicationName: '',
    quantity: 1,
    deliveryAddress: ''
  };
  createLoading = false;
  createError = '';
  createSuccess = '';

  deleteError = '';

  constructor(
    public auth: AuthService,
    private readingService: ReadingService,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.loadError = '';

    forkJoin({
      readings: this.readingService.getReadings(),
      deliveries: this.deliveryService.getDeliveries()
    }).subscribe({
      next: ({ readings, deliveries }) => {
        this.readings = readings;
        this.deliveries = deliveries;
        this.statusDrafts = {};
        for (const delivery of deliveries) {
          this.statusDrafts[delivery.id] = delivery.status;
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError =
          err?.error?.message || 'Não foi possível carregar leituras e entregas.';
      }
    });
  }

  get filteredReadings(): BloodPressureReading[] {
    if (this.classificationFilter === 'ALL') {
      return this.readings;
    }
    return this.readings.filter((r) => r.classification === this.classificationFilter);
  }

  get filteredDeliveries(): MedicationDeliveryRequest[] {
    return this.deliveries.filter((d) => {
      const priorityOk = this.priorityFilter === 'ALL' || d.priority === this.priorityFilter;
      const statusOk = this.statusFilter === 'ALL' || d.status === this.statusFilter;
      return priorityOk && statusOk;
    });
  }

  submitDelivery(form: NgForm): void {
    this.createError = '';
    this.createSuccess = '';

    if (form.invalid) {
      this.createError = 'Preencha medicamento, quantidade e endereço corretamente.';
      return;
    }

    this.createLoading = true;
    this.deliveryService.createDelivery(this.newDelivery).subscribe({
      next: (created) => {
        this.createLoading = false;
        this.createSuccess = `Solicitação #${created.id} criada com prioridade ${created.priority}.`;
        this.deliveries = [created, ...this.deliveries];
        this.statusDrafts[created.id] = created.status;
        form.resetForm({ medicationName: '', quantity: 1, deliveryAddress: '' });
        this.newDelivery = { medicationName: '', quantity: 1, deliveryAddress: '' };
      },
      error: (err) => {
        this.createLoading = false;
        this.createError =
          err?.error?.message || 'Não foi possível criar a solicitação de entrega.';
      }
    });
  }

  updateStatus(delivery: MedicationDeliveryRequest): void {
    this.statusUpdateError = '';
    this.statusUpdateSuccess = '';
    const nextStatus = this.statusDrafts[delivery.id];

    if (!nextStatus || nextStatus === delivery.status) {
      return;
    }

    this.statusUpdatingId = delivery.id;
    this.deliveryService.updateStatus(delivery.id, nextStatus).subscribe({
      next: (updated) => {
        this.statusUpdatingId = null;
        this.statusUpdateSuccess = `Entrega #${updated.id} agora está ${updated.status}.`;
        const idx = this.deliveries.findIndex((d) => d.id === updated.id);
        if (idx > -1) {
          this.deliveries[idx] = updated;
        }
        this.statusDrafts[updated.id] = updated.status;
      },
      error: (err) => {
        this.statusUpdatingId = null;
        this.statusUpdateError =
          err?.error?.message || `Não foi possível atualizar o status da entrega #${delivery.id}.`;
      }
    });
  }

  deleteDelivery(delivery: MedicationDeliveryRequest): void {
    this.deleteError = '';
    this.deliveryService.deleteDelivery(delivery.id).subscribe({
      next: () => {
        this.deliveries = this.deliveries.filter((d) => d.id !== delivery.id);
        delete this.statusDrafts[delivery.id];
      },
      error: (err) => {
        this.deleteError =
          err?.error?.message || `Não foi possível excluir a entrega #${delivery.id}.`;
      }
    });
  }

  deleteReading(reading: BloodPressureReading): void {
    this.deleteError = '';
    this.readingService.deleteReading(reading.id).subscribe({
      next: () => {
        this.readings = this.readings.filter((r) => r.id !== reading.id);
      },
      error: (err) => {
        this.deleteError =
          err?.error?.message || `Não foi possível excluir a leitura #${reading.id}.`;
      }
    });
  }
}
