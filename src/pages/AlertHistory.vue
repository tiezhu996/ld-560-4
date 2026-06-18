<template>
  <section class="dashboard">
    <header class="page-head">
      <h1>历史告警查询</h1>
      <span>共 {{ filteredAlerts.length }} 条记录</span>
    </header>

    <div class="panel filter-panel">
      <div class="filter-row">
        <div class="filter-item">
          <label>开始日期</label>
          <input type="date" v-model="filter.startDate" />
        </div>
        <div class="filter-item">
          <label>结束日期</label>
          <input type="date" v-model="filter.endDate" />
        </div>
        <div class="filter-item">
          <label>告警级别</label>
          <select v-model="filter.level">
            <option value="">全部</option>
            <option v-for="lvl in levelOptions" :key="lvl.value" :value="lvl.value">{{ lvl.label }}</option>
          </select>
        </div>
        <div class="filter-actions">
          <button @click="resetFilter">重置</button>
          <button class="active" @click="exportCSV">导出 CSV</button>
        </div>
      </div>
    </div>

    <div class="panel">
      <h2>告警记录</h2>
      <div class="table-wrap">
        <table class="alert-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>时间</th>
              <th>充电桩编号</th>
              <th>告警级别</th>
              <th>告警内容</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alert in pagedAlerts" :key="alert.id">
              <td>{{ alert.date }}</td>
              <td>{{ alert.time }}</td>
              <td><code>{{ alert.pileCode }}</code></td>
              <td>
                <span :class="['level-tag', alert.level.toLowerCase()]">
                  {{ alertLevelLabels[alert.level] }}
                </span>
              </td>
              <td class="msg-cell">{{ alert.message }}</td>
              <td>{{ alert.confirmed ? '已确认' : '待确认' }}</td>
            </tr>
            <tr v-if="!filteredAlerts.length">
              <td colspan="6" class="empty-cell">暂无符合条件的告警记录</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button :disabled="currentPage <= 1" @click="currentPage--">上一页</button>
        <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button :disabled="currentPage >= totalPages" @click="currentPage++">下一页</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { alertLevelLabels, AlertLevel } from '@/constants/enums';
import { useChargingStore, type AlertFilter } from '@/stores/chargingStore';
import type { ChargingAlert } from '@/types/charging';
import { recordAuditLog } from '@/utils/audit-log';

const charging = useChargingStore();
const PAGE_SIZE = 20;

const levelOptions = [
  { value: AlertLevel.WARNING, label: alertLevelLabels[AlertLevel.WARNING] },
  { value: AlertLevel.CRITICAL, label: alertLevelLabels[AlertLevel.CRITICAL] }
];

function getDefaultFilter(): AlertFilter {
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  return {
    startDate: fmt(sevenDaysAgo),
    endDate: fmt(today),
    level: ''
  };
}

const filter = reactive<AlertFilter>(getDefaultFilter());
const currentPage = ref(1);

const filteredAlerts = computed<ChargingAlert[]>(() => {
  const result = charging.filterHistoryAlerts(filter);
  result.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.time.localeCompare(a.time);
  });
  return result;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredAlerts.value.length / PAGE_SIZE)));

const pagedAlerts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredAlerts.value.slice(start, start + PAGE_SIZE);
});

function resetFilter() {
  Object.assign(filter, getDefaultFilter());
  currentPage.value = 1;
}

function exportCSV() {
  const headers = ['日期', '时间', '充电桩编号', '告警级别', '告警内容', '状态'];
  const rows = filteredAlerts.value.map((item) => [
    item.date,
    item.time,
    item.pileCode,
    alertLevelLabels[item.level],
    item.message,
    item.confirmed ? '已确认' : '待确认'
  ]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const ts = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `alert-history-${ts}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  recordAuditLog('export', `导出告警记录 ${filteredAlerts.value.length} 条`);
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.filter-panel { margin-bottom: 16px; }
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-end;
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  label {
    color: $muted;
    font-size: 13px;
  }
  input, select {
    color: $text;
    background: rgba(64, 198, 164, .06);
    border: 1px solid $line;
    border-radius: 6px;
    padding: 8px 10px;
    min-width: 160px;
  }
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1) brightness(0.8);
    cursor: pointer;
  }
}
.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid $line;
  border-radius: 6px;
}
.alert-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  th, td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid $line;
  }
  th {
    color: $muted;
    font-weight: 600;
    background: rgba(64, 198, 164, .04);
    position: sticky;
    top: 0;
  }
  tbody tr:hover { background: rgba(64, 198, 164, .03); }
  code {
    color: $green;
    background: rgba(64, 198, 164, .08);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }
  .msg-cell { color: #d5e9dc; }
  .empty-cell {
    text-align: center;
    color: $muted;
    padding: 40px 0;
  }
}

.level-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  &.warning {
    color: $gold;
    background: rgba(242, 193, 78, .14);
    border: 1px solid rgba(242, 193, 78, .3);
  }
  &.critical {
    color: $red;
    background: rgba(244, 109, 117, .14);
    border: 1px solid rgba(244, 109, 117, .3);
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 16px;
  span { color: $muted; font-size: 13px; }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
