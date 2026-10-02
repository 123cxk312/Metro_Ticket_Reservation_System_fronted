<template>
  <section class="orders-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">我的订单</h1>
        <p class="page-subtitle">查看当前账号的预约记录和订单状态。</p>
      </div>
    </header>

    <section class="order-summary">
      <div class="summary-item">
        <span>全部订单</span>
        <strong>{{ statusCounts.total }}</strong>
      </div>
      <div class="summary-item">
        <span>已预约</span>
        <strong>{{ statusCounts.BOOKED }}</strong>
      </div>
      <div class="summary-item">
        <span>退票处理中</span>
        <strong>{{ statusCounts.REFUND_PENDING }}</strong>
      </div>
      <div class="summary-item">
        <span>已退票</span>
        <strong>{{ statusCounts.REFUNDED }}</strong>
      </div>
    </section>

    <section class="order-toolbar">
      <span>订单状态</span>
      <el-radio-group v-model="selectedStatus">
        <el-radio-button value="ALL">全部</el-radio-button>
        <el-radio-button value="BOOKED">已预约</el-radio-button>
        <el-radio-button value="REFUND_PENDING">处理中</el-radio-button>
        <el-radio-button value="REFUNDED">已退票</el-radio-button>
        <el-radio-button value="CANCELLED">已取消</el-radio-button>
      </el-radio-group>
    </section>

    <div v-if="filteredOrders.length > 0" class="order-list">
      <article v-for="order in filteredOrders" :key="order.id" class="order-card">
        <header class="order-card-header">
          <div>
            <strong>{{ order.orderNo }}</strong>
            <span>{{ formatDateTime(order.createdAt) }}</span>
          </div>
          <el-tag :type="statusMeta(order.status).type" effect="plain">
            {{ statusMeta(order.status).label }}
          </el-tag>
        </header>

        <div class="order-route">
          <div class="route-station">
            <strong>{{ order.departureTime }}</strong>
            <span>{{ order.startStationName }}</span>
          </div>

          <div class="route-track" aria-hidden="true">
            <span></span>
            <TrainFront :size="18" />
            <span></span>
          </div>

          <div class="route-station route-station-end">
            <strong>{{ order.travelDate }}</strong>
            <span>{{ order.endStationName }}</span>
          </div>
        </div>

        <footer class="order-card-footer">
          <div class="order-meta">
            <span>{{ order.lineName }}</span>
            <span>车票编号 {{ order.ticketNo }}</span>
            <span>数量 {{ order.quantity }} 张</span>
          </div>
          <div class="order-actions">
            <div class="order-amount">
              <span>订单金额</span>
              <strong>¥{{ order.totalAmount.toFixed(2) }}</strong>
            </div>
            <el-button
              v-if="order.status === 'BOOKED'"
              plain
              type="warning"
              @click="openRefundDialog(order)"
            >
              申请退票
            </el-button>
          </div>
        </footer>
      </article>
    </div>

    <div v-else class="empty-panel">
      <el-empty description="当前筛选条件下没有订单" />
    </div>

    <el-dialog v-model="refundDialogVisible" title="申请退票" width="520px">
      <div v-if="selectedOrder" class="refund-order">
        <span>{{ selectedOrder.orderNo }}</span>
        <strong>
          {{ selectedOrder.startStationName }} -> {{ selectedOrder.endStationName }}
        </strong>
        <small>{{ selectedOrder.travelDate }} {{ selectedOrder.departureTime }}</small>
      </div>

      <el-input
        v-model="refundReason"
        type="textarea"
        :rows="4"
        maxlength="255"
        show-word-limit
        placeholder="请填写退票原因"
      />

      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="refundSubmitting" @click="submitRefund">
          提交申请
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { TrainFront } from '@lucide/vue'

import { useAuthStore } from '@/stores/auth'
import { useTicketStore } from '@/stores/ticket'
import type { OrderStatus } from '@/types/order'
import type { TicketOrder } from '@/types/order'

type OrderFilter = OrderStatus | 'ALL'

const authStore = useAuthStore()
const ticketStore = useTicketStore()
const selectedStatus = ref<OrderFilter>('ALL')
const refundDialogVisible = ref(false)
const refundSubmitting = ref(false)
const refundReason = ref('')
const selectedOrder = ref<TicketOrder | null>(null)

const currentUserOrders = computed(() => {
  if (!authStore.user) {
    return []
  }

  return ticketStore.orders
    .filter((order) => order.userId === authStore.user?.id)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
})

const filteredOrders = computed(() => {
  if (selectedStatus.value === 'ALL') {
    return currentUserOrders.value
  }

  return currentUserOrders.value.filter((order) => order.status === selectedStatus.value)
})

const statusCounts = computed(() => {
  return currentUserOrders.value.reduce(
    (counts, order) => {
      counts.total += 1
      counts[order.status] += 1
      return counts
    },
    {
      total: 0,
      BOOKED: 0,
      REFUND_PENDING: 0,
      REFUNDED: 0,
      CANCELLED: 0,
    },
  )
})

function statusMeta(status: OrderStatus): {
  label: string
  type: 'success' | 'warning' | 'info' | 'danger'
} {
  const statusMap: Record<
    OrderStatus,
    { label: string; type: 'success' | 'warning' | 'info' | 'danger' }
  > = {
    BOOKED: { label: '已预约', type: 'success' },
    REFUND_PENDING: { label: '退票处理中', type: 'warning' },
    REFUNDED: { label: '已退票', type: 'info' },
    CANCELLED: { label: '已取消', type: 'danger' },
  }

  return statusMap[status]
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function openRefundDialog(order: TicketOrder): void {
  selectedOrder.value = order
  refundReason.value = ''
  refundDialogVisible.value = true
}

async function submitRefund(): Promise<void> {
  if (!selectedOrder.value || !authStore.user) {
    return
  }

  if (refundReason.value.trim().length < 2) {
    ElMessage.warning('请填写至少 2 个字的退票原因')
    return
  }

  refundSubmitting.value = true

  try {
    await ticketStore.createRefund(selectedOrder.value.id, refundReason.value)
    refundDialogVisible.value = false
    ElMessage.success('退票申请已提交，等待管理员处理')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '退票申请提交失败')
  } finally {
    refundSubmitting.value = false
  }
}

onMounted(() => {
  void ticketStore.loadOrders()
})

</script>

<style scoped>
.order-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  overflow: hidden;
  background: #ffffff;
  box-shadow: var(--app-shadow);
}

.summary-item {
  display: grid;
  min-height: 96px;
  padding: 18px 22px;
  align-content: center;
  gap: 8px;
}

.summary-item + .summary-item {
  border-left: 1px solid var(--app-border);
}

.summary-item span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.summary-item strong {
  font-size: 28px;
  line-height: 1;
}

.order-toolbar {
  display: flex;
  margin: 22px 0 14px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.order-toolbar > span {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.order-list {
  display: grid;
  gap: 12px;
}

.order-card {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 6px 18px rgb(22 48 54 / 5%);
}

.order-card-header {
  display: flex;
  min-height: 68px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--app-border);
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: #fafcfb;
}

.order-card-header > div {
  display: grid;
  gap: 5px;
}

.order-card-header strong {
  font-size: 14px;
}

.order-card-header span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.order-route {
  display: grid;
  min-height: 132px;
  padding: 24px 28px;
  grid-template-columns: minmax(130px, 1fr) minmax(160px, 1.5fr) minmax(130px, 1fr);
  align-items: center;
  gap: 24px;
}

.route-station {
  display: grid;
  gap: 6px;
}

.route-station strong {
  font-size: 22px;
}

.route-station span {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.route-station-end {
  text-align: right;
}

.route-track {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 9px;
  color: var(--app-primary);
}

.route-track span {
  height: 1px;
  background: linear-gradient(90deg, transparent, #9fc9c8, transparent);
}

.order-card-footer {
  display: flex;
  min-height: 76px;
  padding: 14px 20px;
  border-top: 1px solid var(--app-border);
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: #fafcfb;
}

.order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.order-amount {
  display: flex;
  align-items: baseline;
  gap: 9px;
}

.order-amount span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.order-amount strong {
  color: var(--app-accent);
  font-size: 23px;
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.refund-order {
  display: grid;
  margin-bottom: 18px;
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  gap: 6px;
  background: #fafcfb;
}

.refund-order span,
.refund-order small {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.refund-order strong {
  font-size: 15px;
}

.empty-panel {
  display: grid;
  min-height: 360px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  place-items: center;
  background: #ffffff;
}

@media (max-width: 900px) {
  .order-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-item:nth-child(3) {
    border-left: 0;
    border-top: 1px solid var(--app-border);
  }

  .summary-item:nth-child(4) {
    border-top: 1px solid var(--app-border);
  }

  .order-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .order-toolbar :deep(.el-radio-group) {
    display: flex;
    width: 100%;
    overflow-x: auto;
  }

  .order-route {
    grid-template-columns: 1fr;
  }

  .route-station-end {
    text-align: left;
  }

  .route-track {
    grid-template-columns: auto 1fr auto;
  }

  .route-track span {
    background: linear-gradient(90deg, #9fc9c8, transparent);
  }
}

@media (max-width: 620px) {
  .order-summary {
    grid-template-columns: 1fr 1fr;
  }

  .summary-item {
    min-height: 82px;
    padding: 14px 16px;
  }

  .order-card-header,
  .order-card-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .order-actions {
    width: 100%;
    align-items: flex-start;
    flex-direction: column;
  }

  .order-route {
    padding: 20px;
  }
}
</style>
