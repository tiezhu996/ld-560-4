import type { AlertLevel, PileStatus, PileType } from '@/constants/enums';

export interface ChargingPileLive {
  id: string;
  code: string;
  lat: number;
  lng: number;
  type: PileType;
  status: PileStatus;
  currentPower: number;
  todayUsage: number;
  queueCount: number;
}

export interface ChargingAlert {
  id: string;
  pileCode: string;
  message: string;
  level: AlertLevel;
  time: string;
  date: string;
  confirmed: boolean;
}

export interface TrendPoint {
  label: string;
  value: number;
}
