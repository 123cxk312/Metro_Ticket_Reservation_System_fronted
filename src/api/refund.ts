import http, { unwrapResponse } from '@/api/http'
import type { RefundRequest, RefundStatus } from '@/types/refund'

export interface CreateRefundApiPayload {
  orderId: number
  reason: string
}

export type RefundDecision = 'APPROVE' | 'REJECT'

export async function createRefundApi(
  payload: CreateRefundApiPayload,
): Promise<RefundRequest> {
  const response = await http.post('/refunds', payload)
  return unwrapResponse<RefundRequest>(response)
}

export async function getMyRefundsApi(): Promise<RefundRequest[]> {
  const response = await http.get('/refunds/my')
  return unwrapResponse<RefundRequest[]>(response)
}

export async function getAdminRefundsApi(
  status?: RefundStatus | null,
): Promise<RefundRequest[]> {
  const response = await http.get('/admin/refunds', {
    params: {
      status: status || undefined,
    },
  })

  return unwrapResponse<RefundRequest[]>(response)
}

export async function processRefundApi(
  refundId: number,
  decision: RefundDecision,
  remark: string,
): Promise<RefundRequest> {
  const action = decision === 'APPROVE' ? 'approve' : 'reject'
  const response = await http.put(`/admin/refunds/${refundId}/${action}`, {
    remark,
  })

  return unwrapResponse<RefundRequest>(response)
}
