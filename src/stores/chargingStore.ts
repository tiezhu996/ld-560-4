import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { AlertLevel, PileStatus } from '@/constants/enums';
import type { ChargingAlert, ChargingPileLive } from '@/types/charging';
import { createHistoryAlerts, createQueueTrend } from '@/mock/chargingMock';
import { recordAuditLog } from '@/utils/audit-log';

export interface AlertFilter {
  startDate: string;
  endDate: string;
  level: AlertLevel | '';
}

export const useChargingStore = defineStore('charging', () => {
  const piles = ref<ChargingPileLive[]>([]);
  const alerts = ref<ChargingAlert[]>([]);
  const historyAlerts = ref<ChargingAlert[]>(createHistoryAlerts(180));
  const queueTrend = ref(createQueueTrend());

  const byStatus = computed(() => Object.values(PileStatus).map((status) => ({
    status,
    count: piles.value.filter((item) => item.status === status).length
  })));

  const utilization = computed(() => {
    if (!piles.value.length) return 0;
    return Math.round((piles.value.filter((item) => item.status === PileStatus.CHARGING).length / piles.value.length) * 100);
  });

  const todayRevenue = computed(() => piles.value.reduce((sum, item) => sum + item.todayUsage * 1.18, 0));

  function setCharging(payload: { piles: ChargingPileLive[]; alerts: ChargingAlert[] }) {
    piles.value = payload.piles;
    alerts.value = payload.alerts;
    historyAlerts.value = [...payload.alerts, ...historyAlerts.value].slice(0, 500);
  }

  function confirmAlert(id: string) {
    alerts.value = alerts.value.map((item) => item.id === id ? { ...item, confirmed: true } : item);
    historyAlerts.value = historyAlerts.value.map((item) => item.id === id ? { ...item, confirmed: true } : item);
    recordAuditLog('alert', `确认告警 ${id}`);
  }

  function filterHistoryAlerts(filter: AlertFilter): ChargingAlert[] {
    return historyAlerts.value.filter((item) => {
      if (filter.startDate && item.date < filter.startDate) return false;
      if (filter.endDate && item.date > filter.endDate) return false;
      if (filter.level && item.level !== filter.level) return false;
      return true;
    });
  }

  return { piles, alerts, historyAlerts, queueTrend, byStatus, utilization, todayRevenue, setCharging, confirmAlert, filterHistoryAlerts };
});
