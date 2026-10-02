<template>
  <section class="refund-admin-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">退票处理</h1>
        <p class="page-subtitle">审核用户提交的退票申请，并决定是否返还车票库存。</p>
      </div>
    </header>

    <section class="refund-summary">
      <div class="summary-item">
        <span>全部申请</span>
        <strong>{{ statusCounts.total }}</strong>
      </div>
      <div class="summary-item">
        <span>待处理</span>
        <strong>{{ statusCounts.PENDING }}</strong>
      </div>
      <div class="summary-item">
        <span>已同意</span>
        <strong>{{ statusCounts.APPROVED }}</strong>
      </div>
      <div class="summary-item">
        <span>已拒绝</span>
        <strong>{{ statusCounts.REJECTED }}</strong>
      </div>
    </section>

    <section class="refund-toolbar">
      <span>申请状态</span>
      <el-radio-group v-model="selectedStatus">
        <el-radio-button value="ALL">全部</el-radio-button>
        <el-radio-button value="PENDING">待处理</el-radio-button>
        <el-radio-button value="APPROVED">已同意</el-radio-button>
        <el-radio-button value="REJECTED">已拒绝</el-radio-button>
      </el-radio-group>
    </section>

    <div v-if="filteredRequests.length > 0" class="refund-list">
      <article v-for="request in filteredRequests" :key="request.id" class="refund-card">
        <header class="refund-card-header">
          <div>
            <strong>{{ request.orderNo }}</strong>
            <span>申请人：{{ request.userName }} · {{ formatDateTime(request.createdAt) }}</span>
          </div>
          <el-tag :type="statusMeta(request.status).type" effect="plain">
            {{ statusMeta(request.status).label }}
          </el-tag>
        </header>

        <div class="refund-content">
          <div class="refund-route">
            <span>{{ request.lineName }}</span>
            <strong>
              {{ request.startStationName }} -> {{ request.endStationName }}
            </strong>
            <small>{{ request.travelDate }} {{ request.departureTime }}</small>
          </div>

          <div class="refund-reason">
            <span>退票原因</span>
            <p>{{ request.reason }}</p>
          </div>
        </div>

        <footer class="refund-card-footer">
          <div class="refund-result">
            <span v-if="request.handledByName">
              处理人：{{ request.handledByName }}
              <template v-if="request.handledAt">
                · {{ formatDateTime(request.handledAt) }}
              </template>
            </span>
            <span v-if="request.handleRemark">备注：{{ request.handleRemark }}</span>
            <span v-if="request.status === 'PENDING'">等待管理员处理</span>
          </div>

          <div v-if="request.status === 'PENDING'" class="refund-actions">
            <el-button type="danger" plain @click="openProcessDialog(request, 'REJECT')">
              拒绝
            </el-button>
            <el-button type="primary" @click="openProcessDialog(request, 'APPROVE')">
              同意退票
            </el-button>
          </div>
        </footer>
      </article>
    </div>

    <div v-else class="empty-panel">
      <el-empty description="当前筛选条件下没有退票申请" />
    </div>

    <el-dialog
      v-model="processDialogVisible"
      :title="decision === 'APPROVE' ? '同意退票' : '拒绝退票'"
      width="520px"
    >
      <div v-if="selectedRequest" class="process-summary">
        <strong>{{ selectedRequest.orderNo }}</strong>
        <span>{{ selectedRequest.userName }} · {{ selectedRequest.reason }}</span>
      </div>

      <el-input
        v-model="handleRemark"
        type="textarea"
        :rows="4"
        maxlength="255"
        show-word-limit
        :placeholder="decision === 'APPROVE' ? '可填写同意说明' : '请填写拒绝原因'"
      />

      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button
          :type="decision === 'APPROVE' ? 'primary' : 'danger'"
          :loading="processing"
          @click="submitProcess"
        >
          {{ decision === 'APPROVE' ? '确认同意' : '确认拒绝' }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { useAuthStore } from '@/stores/auth'
import { useTicketStore } from '@/stores/ticket'
import type { RefundRequest, RefundStatus } from '@/types/refund'

type RefundFilter = RefundStatus | 'ALL'
type RefundDecision = 'APPROVE' | 'REJECT'

const authStore = useAuthStore()
const ticketStore = useTicketStore()
const selectedStatus = ref<RefundFilter>('ALL')
const processDialogVisible = ref(false)
const processing = ref(false)
const decision = ref<RefundDecision>('APPROVE')
const selectedRequest = ref<RefundRequest | null>(null)
const handleRemark = ref('')

const filteredRequests = computed(() => {
  const requests = [...ticketStore.refundRequests].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  )

  if (selectedStatus.value === 'ALL') {
    return requests
  }

  return requests.filter((request) => request.status === selectedStatus.value)
})

const statusCounts = computed(() => {
  return ticketStore.refundRequests.reduce(
    (counts, request) => {
      counts.total += 1
      counts[request.status] += 1
      return counts
    },
    {
      total: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    },
  )
})

function statusMeta(status: RefundStatus): {
  label: string
  type: 'success' | 'warning' | 'info' | 'danger'
} {
  const statusMap: Record<
    RefundStatus,
    { label: string; type: 'success' | 'warning' | 'info' | 'danger' }
  > = {
    PENDING: { label: '待处理', type: 'warning' },
    APPROVED: { label: '已同意', type: 'success' },
    REJECTED: { label: '已拒绝', type: 'danger' },
    CANCELLED: { label: '已取消', type: 'info' },
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

function openProcessDialog(request: RefundRequest, nextDecision: RefundDecision): void {
  selectedRequest.value = request
  decision.value = nextDecision
  handleRemark.value = ''
  processDialogVisible.value = true
}

async function submitProcess(): Promise<void> {
  if (!selectedRequest.value || !authStore.user) {
    return
  }

  if (decision.value === 'REJECT' && handleRemark.value.trim().length < 2) {
    ElMessage.warning('拒绝退票时请填写至少 2 个字的说明')
    return
  }

  processing.value = true

  try {
    await ticketStore.processRefund(selectedRequest.value.id, decision.value, handleRemark.value)
    processDialogVisible.value = false
    ElMessage.success(decision.value === 'APPROVE' ? '退票申请已同意' : '退票申请已拒绝')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '退票申请处理失败')
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  void ticketStore.loadAdminRefunds()
})
</script>

<style scoped>
.refund-summary {
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

.refund-toolbar {
  display: flex;
  margin: 22px 0 14px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.refund-toolbar > span {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.refund-list {
  display: grid;
  gap: 12px;
}

.refund-card {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 6px 18px rgb(22 48 54 / 5%);
}

.refund-card-header,
.refund-card-footer {
  display: flex;
  min-height: 68px;
  padding: 14px 20px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: #fafcfb;
}

.refund-card-header {
  border-bottom: 1px solid var(--app-border);
}

.refund-card-header > div {
  display: grid;
  gap: 5px;
}

.refund-card-header strong {
  font-size: 14px;
}

.refund-card-header span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.refund-content {
  display: grid;
  padding: 22px;
  grid-template-columns: minmax(260px, 0.9fr) minmax(320px, 1.1fr);
  gap: 28px;
}

.refund-route,
.refund-reason {
  display: grid;
  align-content: start;
  gap: 8px;
}

.refund-route > span,
.refund-reason > span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.refund-route strong {
  font-size: 17px;
}

.refund-route small {
  color: var(--app-text-secondary);
}

.refund-reason p {
  margin: 0;
  padding: 12px 14px;
  border-left: 3px solid var(--app-warning);
  border-radius: 0 6px 6px 0;
  background: #fff9eb;
  line-height: 1.7;
}

.refund-card-footer {
  border-top: 1px solid var(--app-border);
}

.refund-result {
  display: grid;
  gap: 5px;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.refund-actions {
  display: flex;
  gap: 10px;
}

.empty-panel {
  display: grid;
  min-height: 360px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  place-items: center;
  background: #ffffff;
}

.process-summary {
  display: grid;
  margin-bottom: 18px;
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  gap: 6px;
  background: #fafcfb;
}

.process-summary span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

@media (max-width: 900px) {
  .refund-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-item:nth-child(3) {
    border-left: 0;
    border-top: 1px solid var(--app-border);
  }

  .summary-item:nth-child(4) {
    border-top: 1px solid var(--app-border);
  }

  .refund-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .refund-toolbar,
  .refund-card-header,
  .refund-card-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .refund-toolbar :deep(.el-radio-group) {
    display: flex;
    width: 100%;
    overflow-x: auto;
  }

  .refund-actions {
    width: 100%;
  }

  .refund-actions :deep(.el-button) {
    flex: 1;
  }
}
</style>
