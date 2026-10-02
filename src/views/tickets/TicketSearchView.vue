<template>
  <section class="ticket-search-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">车票查询</h1>
        <p class="page-subtitle">选择出发站、到达站、日期和方向，查看当前可预约的地铁车票。</p>
      </div>
    </header>

    <section class="search-panel">
      <div class="search-grid">
        <label class="field">
          <span>出发站</span>
          <el-select v-model="form.startStationId" filterable clearable placeholder="请选择出发站">
            <el-option
              v-for="station in ticketStore.stations"
              :key="station.id"
              :label="station.stationName"
              :value="station.id"
            />
          </el-select>
        </label>

        <button class="swap-button" type="button" title="交换出发站和到达站" @click="swapStations">
          <ArrowLeftRight :size="18" />
        </button>

        <label class="field">
          <span>到达站</span>
          <el-select v-model="form.endStationId" filterable clearable placeholder="请选择到达站">
            <el-option
              v-for="station in ticketStore.stations"
              :key="station.id"
              :label="station.stationName"
              :value="station.id"
            />
          </el-select>
        </label>

        <label class="field">
          <span>乘车日期</span>
          <el-date-picker
            v-model="form.travelDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
            :clearable="false"
          />
        </label>

        <div class="field direction-field">
          <span>行驶方向</span>
          <el-radio-group v-model="form.direction" size="large">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="UP">上行</el-radio-button>
            <el-radio-button value="DOWN">下行</el-radio-button>
          </el-radio-group>
        </div>

        <el-button
          class="search-button"
          type="primary"
          size="large"
          :loading="ticketStore.searching"
          @click="search"
        >
          <Search :size="18" />
          查询车票
        </el-button>
      </div>
    </section>

    <section class="results-section">
      <header class="results-header">
        <div>
          <strong>查询结果</strong>
          <span>{{ resultSummary }}</span>
        </div>
      </header>

      <div v-if="ticketStore.searching" class="skeleton-list">
        <el-skeleton v-for="index in 3" :key="index" animated :rows="3" />
      </div>

      <el-empty
        v-else-if="ticketStore.hasSearched && ticketStore.searchResults.length === 0"
        description="没有找到符合条件的地铁车票"
      />

      <div v-else class="ticket-list">
        <article v-for="ticket in ticketStore.searchResults" :key="ticket.id" class="ticket-card">
          <div class="line-column">
            <span class="line-badge">{{ ticket.lineName }}</span>
            <span class="ticket-number">{{ ticket.ticketNo }}</span>
          </div>

          <div class="journey-column">
            <div class="station-block">
              <strong>{{ ticket.departureTime }}</strong>
              <span>{{ ticket.startStationName }}</span>
            </div>

            <div class="journey-line" aria-hidden="true">
              <span></span>
              <small>{{ ticket.direction === 'UP' ? '上行' : '下行' }}</small>
              <span></span>
            </div>

            <div class="station-block station-block-end">
              <strong>{{ ticket.arrivalTime }}</strong>
              <span>{{ ticket.endStationName }}</span>
            </div>
          </div>

          <div class="stock-column">
            <el-tag :type="statusMeta(ticket).type" effect="plain">
              {{ statusMeta(ticket).label }}
            </el-tag>
            <span>余票 {{ ticket.remainingStock }} / {{ ticket.totalStock }}</span>
          </div>

          <div class="price-column">
            <strong>¥{{ ticket.price.toFixed(2) }}</strong>
            <el-button
              type="primary"
              :loading="bookingTicketId === ticket.id"
              :disabled="ticket.status !== 'ON_SALE' || ticket.remainingStock <= 0"
              @click="prepareBooking(ticket)"
            >
              立即预约
            </el-button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeftRight, Search } from '@lucide/vue'

import { useAuthStore } from '@/stores/auth'
import { useTicketStore } from '@/stores/ticket'
import type { Ticket, TicketSearchParams, TicketStatus } from '@/types/ticket'

const authStore = useAuthStore()
const ticketStore = useTicketStore()
const bookingTicketId = ref<number | null>(null)

function formatDateOffset(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const form = reactive<TicketSearchParams>({
  startStationId: 1,
  endStationId: 4,
  travelDate: formatDateOffset(1),
  direction: 'UP',
})

const resultSummary = computed(() => {
  if (!ticketStore.hasSearched) {
    return '请输入查询条件'
  }

  return `共找到 ${ticketStore.searchResults.length} 个班次`
})

function statusMeta(ticket: Ticket): {
  label: string
  type: 'success' | 'info' | 'warning' | 'danger'
} {
  const statusMap: Record<
    TicketStatus,
    { label: string; type: 'success' | 'info' | 'warning' | 'danger' }
  > = {
    DRAFT: { label: '草稿', type: 'info' },
    ON_SALE: { label: '销售中', type: 'success' },
    SOLD_OUT: { label: '已售罄', type: 'warning' },
    CLOSED: { label: '已关闭', type: 'danger' },
  }

  return statusMap[ticket.status]
}

function swapStations(): void {
  const currentStart = form.startStationId
  form.startStationId = form.endStationId
  form.endStationId = currentStart
}

async function search(): Promise<void> {
  if (
    form.startStationId &&
    form.endStationId &&
    form.startStationId === form.endStationId
  ) {
    ElMessage.warning('出发站和到达站不能相同')
    return
  }

  await ticketStore.searchTickets({ ...form })
}

async function prepareBooking(ticket: Ticket): Promise<void> {
  if (!authStore.user) {
    ElMessage.error('登录状态已失效，请重新登录')
    return
  }

  bookingTicketId.value = ticket.id

  try {
    const order = await ticketStore.bookTicket(ticket.id)

    await ElMessageBox.alert(
      `订单号：${order.orderNo}\n行程：${order.startStationName} -> ${order.endStationName}\n金额：¥${order.totalAmount.toFixed(2)}`,
      '预约成功',
      {
        confirmButtonText: '知道了',
        type: 'success',
      },
    )
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '预约失败，请稍后重试')
  } finally {
    bookingTicketId.value = null
  }
}

onMounted(async () => {
  await ticketStore.loadReferenceData()
  await search()
})
</script>

<style scoped>
.search-panel {
  padding: 22px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  background: #ffffff;
  box-shadow: var(--app-shadow);
}

.search-grid {
  display: grid;
  grid-template-columns:
    minmax(170px, 1fr)
    42px
    minmax(170px, 1fr)
    minmax(170px, 0.9fr)
    minmax(250px, 1.35fr)
    auto;
  align-items: end;
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field > span {
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.field :deep(.el-select),
.field :deep(.el-date-editor) {
  width: 100%;
}

.direction-field :deep(.el-radio-group) {
  display: flex;
  width: 100%;
}

.direction-field :deep(.el-radio-button) {
  flex: 1;
}

.direction-field :deep(.el-radio-button__inner) {
  width: 100%;
}

.swap-button {
  display: grid;
  width: 42px;
  height: 40px;
  margin-bottom: 1px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  place-items: center;
  background: #ffffff;
  color: var(--app-text-secondary);
  cursor: pointer;
}

.swap-button:hover {
  border-color: var(--app-primary);
  color: var(--app-primary);
}

.search-button {
  min-width: 132px;
  gap: 7px;
}

.results-section {
  margin-top: 26px;
}

.results-header {
  display: flex;
  margin-bottom: 14px;
  align-items: center;
  justify-content: space-between;
}

.results-header div {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.results-header strong {
  font-size: 17px;
}

.results-header span {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.ticket-list,
.skeleton-list {
  display: grid;
  gap: 12px;
}

.skeleton-list {
  padding: 24px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  background: #ffffff;
}

.ticket-card {
  display: grid;
  min-height: 132px;
  padding: 20px 22px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  grid-template-columns: minmax(150px, 0.85fr) minmax(360px, 1.8fr) minmax(130px, 0.7fr) 150px;
  align-items: center;
  gap: 22px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgb(22 48 54 / 5%);
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.ticket-card:hover {
  border-color: #b7dcdb;
  transform: translateY(-1px);
}

.line-column,
.stock-column,
.price-column {
  display: grid;
  justify-items: start;
  gap: 9px;
}

.line-badge {
  padding: 5px 9px;
  border-radius: 5px;
  background: #e7f3f3;
  color: var(--app-primary-dark);
  font-size: 12px;
  font-weight: 700;
}

.ticket-number {
  color: #8a979c;
  font-size: 11px;
}

.journey-column {
  display: grid;
  grid-template-columns: minmax(100px, auto) minmax(100px, 1fr) minmax(100px, auto);
  align-items: center;
  gap: 18px;
}

.station-block {
  display: grid;
  gap: 5px;
}

.station-block strong {
  color: var(--app-text);
  font-size: 21px;
}

.station-block span {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.station-block-end {
  text-align: right;
}

.journey-line {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  color: #96a2a6;
}

.journey-line span {
  height: 1px;
  background: linear-gradient(90deg, transparent, #aab7ba, transparent);
}

.journey-line small {
  font-size: 11px;
}

.stock-column {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.price-column {
  justify-items: end;
}

.price-column strong {
  color: var(--app-accent);
  font-size: 24px;
}

@media (max-width: 1280px) {
  .search-grid {
    grid-template-columns: minmax(170px, 1fr) 42px minmax(170px, 1fr) minmax(170px, 1fr);
  }

  .direction-field,
  .search-button {
    grid-column: span 2;
  }

  .ticket-card {
    grid-template-columns: minmax(130px, 0.7fr) minmax(340px, 1.7fr) 150px;
  }

  .stock-column {
    display: none;
  }
}

@media (max-width: 860px) {
  .search-grid {
    grid-template-columns: 1fr;
  }

  .swap-button {
    width: 100%;
  }

  .direction-field,
  .search-button {
    grid-column: auto;
  }

  .ticket-card {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .journey-column {
    grid-template-columns: 1fr auto 1fr;
  }

  .stock-column {
    display: grid;
  }

  .price-column {
    justify-items: stretch;
  }
}
</style>
