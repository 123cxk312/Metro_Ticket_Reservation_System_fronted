import http, { unwrapResponse } from '@/api/http'
import type { TicketOrder } from '@/types/order'

export interface CreateOrderApiPayload {
  ticketId: number
  quantity: number
}

export async function createOrderApi(payload: CreateOrderApiPayload): Promise<TicketOrder> {
  const response = await http.post('/orders', payload)
  return unwrapResponse<TicketOrder>(response)
}

export async function getMyOrdersApi(): Promise<TicketOrder[]> {
  const response = await http.get('/orders')
  return unwrapResponse<TicketOrder[]>(response)
}

export async function getOrderDetailApi(orderId: number): Promise<TicketOrder> {
  const response = await http.get(`/orders/${orderId}`)
  return unwrapResponse<TicketOrder>(response)
}
