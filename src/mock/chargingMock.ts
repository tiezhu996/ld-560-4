import { AlertLevel, PileStatus, PileType } from '@/constants/enums';
import type { ChargingAlert, ChargingPileLive, TrendPoint } from '@/types/charging';

const pileTypes = Object.values(PileType);
const statuses = Object.values(PileStatus);

export function createChargingPiles(count = 54): ChargingPileLive[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `pile-${index + 1}`,
    code: `CHG-${(1000 + index).toString()}`,
    lat: 31.13 + Math.random() * 0.22,
    lng: 121.33 + Math.random() * 0.34,
    type: pileTypes[index % pileTypes.length],
    status: statuses[index % statuses.length],
    currentPower: Math.round(15 + Math.random() * 150),
    todayUsage: Math.round(80 + Math.random() * 460),
    queueCount: Math.floor(Math.random() * 9)
  }));
}

export function updateChargingPiles(source: ChargingPileLive[]): ChargingPileLive[] {
  return source.map((item) => {
    const status = Math.random() > 0.88 ? statuses[Math.floor(Math.random() * statuses.length)] : item.status;
    return {
      ...item,
      status,
      currentPower: status === PileStatus.CHARGING ? Math.round(40 + Math.random() * 140) : 0,
      todayUsage: item.todayUsage + Math.round(Math.random() * 8),
      queueCount: status === PileStatus.CHARGING ? Math.floor(Math.random() * 12) : Math.floor(Math.random() * 3)
    };
  });
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createChargingAlerts(piles: ChargingPileLive[]): ChargingAlert[] {
  const now = new Date();
  return piles
    .filter((pile) => pile.status === PileStatus.FAULTY || pile.status === PileStatus.MAINTENANCE)
    .slice(0, 8)
    .map((pile, idx) => ({
      id: `alert-${pile.id}-${idx}`,
      pileCode: pile.code,
      message: pile.status === PileStatus.FAULTY ? '输出电流异常，已派发检修' : '计划维护中，暂停接单',
      level: pile.status === PileStatus.FAULTY ? AlertLevel.CRITICAL : AlertLevel.WARNING,
      time: now.toLocaleTimeString(),
      date: formatDate(now),
      confirmed: false
    }));
}

const alertMessages = [
  '输出电流异常，已派发检修',
  '连接器温度过高，自动降功率',
  '通讯中断，等待重连',
  '电压波动超出阈值',
  '接地异常，请检查线路',
  '计划维护中，暂停接单',
  '充电桩离线超过 30 分钟',
  '计费模块异常，请核查'
];

export function createHistoryAlerts(count = 120): ChargingAlert[] {
  const levels = Object.values(AlertLevel);
  const results: ChargingAlert[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getTime() - i * 1000 * 60 * Math.floor(20 + Math.random() * 180));
    const pileIdx = Math.floor(Math.random() * 54) + 1;
    const level = levels[Math.floor(Math.random() * levels.length)];
    results.push({
      id: `hist-alert-${i}`,
      pileCode: `CHG-${(1000 + pileIdx).toString()}`,
      message: alertMessages[Math.floor(Math.random() * alertMessages.length)],
      level,
      time: d.toLocaleTimeString(),
      date: formatDate(d),
      confirmed: Math.random() > 0.3
    });
  }
  return results;
}

export function createQueueTrend(): TrendPoint[] {
  return Array.from({ length: 12 }, (_, index) => ({
    label: `${index * 2}:00`,
    value: Math.round(18 + Math.sin(index) * 8 + Math.random() * 12)
  }));
}
