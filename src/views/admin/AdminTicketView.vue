<template>
  <section class="admin-ticket-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">车票管理</h1>
        <p class="page-subtitle">发布车票、设置库存、管理销售状态并查看现有车票。</p>
      </div>
      <el-button type="primary" size="large" @click="openCreateDialog">
        <Plus :size="18" />
        发布车票
      </el-button>
    </header>

    <section class="ticket-summary">
      <div class="summary-item">
        <span>车票总数</span>
        <strong>{{ ticketStore.tickets.length }}</strong>
      </div>
      <div class="summary-item">
        <span>销售中</span>
        <strong>{{ summary.onSale }}</strong>
      </div>
      <div class="summary-item">
        <span>剩余总库存</span>
        <strong>{{ summary.remainingStock }}</strong>
      </div>
      <div class="summary-item">
        <span>已售罄</span>
        <strong>{{ summary.soldOut }}</strong>
      </div>
    </section>

    <section class="ticket-toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索车票编号、线路或站点">
        <template #prefix>
          <Search :size="17" />
        </template>
      </el-input>

      <el-select v-model="statusFilter" placeholder="全部状态">
        <el-option label="全部状态" value="ALL" />
        <el-option label="销售中" value="ON_SALE" />
        <el-option label="已售罄" value="SOLD_OUT" />
        <el-option label="已关闭" value="CLOSED" />
        <el-option label="草稿" value="DRAFT" />
      </el-select>
    </section>

    <div class="ticket-table-panel">
      <el-table v-loading="ticketStore.adminLoading" :data="filteredTickets" stripe>
        <el-table-column prop="ticketNo" label="车票编号" min-width="160" />
        <el-table-column prop="lineName" label="线路" min-width="120" />
        <el-table-column label="行程" min-width="190">
          <template #default="{ row }">
            {{ row.startStationName }} -> {{ row.endStationName }}
          </template>
        </el-table-column>
        <el-table-column label="乘车时间" min-width="180">
          <template #default="{ row }">
            <div class="table-time">
              <span>{{ row.travelDate }}</span>
              <strong>{{ row.departureTime }} - {{ row.arrivalTime }}</strong>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="库存" width="120">
          <template #default="{ row }">
            {{ row.remainingStock }} / {{ row.totalStock }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="105">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type" effect="plain">
              {{ statusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'ON_SALE'"
              link
              type="danger"
              @click="changeStatus(row.id, 'CLOSED')"
            >
              关闭销售
            </el-button>
            <el-button
              v-else-if="row.status === 'CLOSED' && row.remainingStock > 0"
              link
              type="primary"
              @click="changeStatus(row.id, 'ON_SALE')"
            >
              重新销售
            </el-button>
            <span v-else class="muted-action">不可操作</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="createDialogVisible" title="发布车票" width="680px">
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-position="top"
      >
        <div class="form-grid">
          <el-form-item label="地铁线路" prop="lineId">
            <el-select v-model="createForm.lineId">
              <el-option
                v-for="line in ticketStore.lines"
                :key="line.id"
                :label="line.lineName"
                :value="line.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="方向" prop="direction">
            <el-radio-group v-model="createForm.direction">
              <el-radio-button value="UP">上行</el-radio-button>
              <el-radio-button value="DOWN">下行</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="出发站" prop="startStationId">
            <el-select v-model="createForm.startStationId" filterable>
              <el-option
                v-for="station in ticketStore.stations"
                :key="station.id"
                :label="station.stationName"
                :value="station.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="到达站" prop="endStationId">
            <el-select v-model="createForm.endStationId" filterable>
              <el-option
                v-for="station in ticketStore.stations"
                :key="station.id"
                :label="station.stationName"
                :value="station.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="乘车日期" prop="travelDate">
            <el-date-picker
              v-model="createForm.travelDate"
              type="date"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item label="价格" prop="price">
            <el-input-number v-model="createForm.price" :min="0.01" :precision="2" :step="1" />
          </el-form-item>

          <el-form-item label="发车时间" prop="departureTime">
            <el-time-picker
              v-model="createForm.departureTime"
              value-format="HH:mm"
              format="HH:mm"
            />
          </el-form-item>

          <el-form-item label="到达时间" prop="arrivalTime">
            <el-time-picker
              v-model="createForm.arrivalTime"
              value-format="HH:mm"
              format="HH:mm"
            />
          </el-form-item>

          <el-form-item label="总库存" prop="totalStock">
            <el-input-number v-model="createForm.totalStock" :min="1" :step="10" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">
          确认发布
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@lucide/vue'

import { useTicketStore } from '@/stores/ticket'
import type { TicketCreateInput, TicketStatus } from '@/types/ticket'

const ticketStore = useTicketStore()
const createDialogVisible = ref(false)
const creating = ref(false)
const createFormRef = ref<FormInstance>()
const keyword = ref('')
const statusFilter = ref<TicketStatus | 'ALL'>('ALL')

function formatDateOffset(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const createForm = reactive<TicketCreateInput>({
  lineId: 1,
  startStationId: 1,
  endStationId: 4,
  direction: 'UP',
  travelDate: formatDateOffset(1),
  departureTime: '08:00',
  arrivalTime: '08:40',
  price: 5,
  totalStock: 100,
})

const validateStations = (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
  if (createForm.startStationId === createForm.endStationId) {
    callback(new Error('出发站和到达站不能相同'))
    return
  }

  callback()
}

const createRules: FormRules<typeof createForm> = {
  lineId: [{ required: true, message: '请选择线路', trigger: 'change' }],
  startStationId: [
    { required: true, message: '请选择出发站', trigger: 'change' },
    { validator: validateStations, trigger: 'change' },
  ],
  endStationId: [
    { required: true, message: '请选择到达站', trigger: 'change' },
    { validator: validateStations, trigger: 'change' },
  ],
  travelDate: [{ required: true, message: '请选择乘车日期', trigger: 'change' }],
  departureTime: [{ required: true, message: '请选择发车时间', trigger: 'change' }],
  arrivalTime: [{ required: true, message: '请选择到达时间', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'change' }],
  totalStock: [{ required: true, message: '请输入库存', trigger: 'change' }],
}

const summary = computed(() => {
  return ticketStore.tickets.reduce(
    (result, ticket) => {
      result.remainingStock += ticket.remainingStock

      if (ticket.status === 'ON_SALE') {
        result.onSale += 1
      }

      if (ticket.status === 'SOLD_OUT') {
        result.soldOut += 1
      }

      return result
    },
    {
      onSale: 0,
      soldOut: 0,
      remainingStock: 0,
    },
  )
})

const filteredTickets = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()

  return ticketStore.tickets.filter((ticket) => {
    if (statusFilter.value !== 'ALL' && ticket.status !== statusFilter.value) {
      return false
    }

    if (!normalizedKeyword) {
      return true
    }

    return [
      ticket.ticketNo,
      ticket.lineName,
      ticket.startStationName,
      ticket.endStationName,
    ].some((value) => value.toLowerCase().includes(normalizedKeyword))
  })
})

function statusMeta(status: TicketStatus): {
  label: string
  type: 'success' | 'warning' | 'info' | 'danger'
} {
  const statusMap: Record<
    TicketStatus,
    { label: string; type: 'success' | 'warning' | 'info' | 'danger' }
  > = {
    DRAFT: { label: '草稿', type: 'info' },
    ON_SALE: { label: '销售中', type: 'success' },
    SOLD_OUT: { label: '已售罄', type: 'warning' },
    CLOSED: { label: '已关闭', type: 'danger' },
  }

  return statusMap[status]
}

function openCreateDialog(): void {
  createDialogVisible.value = true
}

async function changeStatus(ticketId: number, status: TicketStatus): Promise<void> {
  try {
    await ticketStore.setTicketStatus(ticketId, status)
    ElMessage.success(status === 'CLOSED' ? '车票已关闭销售' : '车票已重新开始销售')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '状态更新失败')
  }
}

onMounted(() => {
  void ticketStore.loadAdminTickets()
})

async function submitCreate(): Promise<void> {
  if (!createFormRef.value) {
    return
  }

  const valid = await createFormRef.value.validate().catch(() => false)

  if (!valid) {
    return
  }

  creating.value = true

  try {
    const ticket = await ticketStore.createTicket({ ...createForm })
    createDialogVisible.value = false
    ElMessage.success(`车票 ${ticket.ticketNo} 已发布`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '车票发布失败')
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.ticket-summary {
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

.ticket-toolbar {
  display: grid;
  margin: 22px 0 14px;
  grid-template-columns: minmax(260px, 1fr) 190px;
  gap: 12px;
}

.ticket-table-panel {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  overflow: hidden;
  background: #ffffff;
  box-shadow: var(--app-shadow);
}

.table-time {
  display: grid;
  gap: 4px;
}

.table-time span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.muted-action {
  color: #9aa5a9;
  font-size: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.form-grid :deep(.el-select),
.form-grid :deep(.el-date-editor),
.form-grid :deep(.el-input-number) {
  width: 100%;
}

@media (max-width: 900px) {
  .ticket-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-item:nth-child(3) {
    border-left: 0;
    border-top: 1px solid var(--app-border);
  }

  .summary-item:nth-child(4) {
    border-top: 1px solid var(--app-border);
  }
}

@media (max-width: 640px) {
  .page-header :deep(.el-button) {
    width: 100%;
  }

  .ticket-toolbar,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
