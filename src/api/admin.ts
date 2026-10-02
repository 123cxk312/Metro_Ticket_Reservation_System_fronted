import http, { unwrapResponse } from '@/api/http'
import type { Ticket, TicketCreateInput, TicketStatus } from '@/types/ticket'

export interface AdminTicketQuery {
  status?: TicketStatus | null
  keyword?: string | null
}

export async function getAdminTicketsApi(params: AdminTicketQuery): Promise<Ticket[]> {
  const response = await http.get('/admin/tickets', {
    params,
  })

  return unwrapResponse<Ticket[]>(response)
}

export async function createTicketApi(payload: TicketCreateInput): Promise<Ticket> {
  const response = await http.post('/admin/tickets', payload)
  return unwrapResponse<Ticket>(response)
}

export async function updateTicketStatusApi(
  ticketId: number,
  status: TicketStatus,
): Promise<Ticket> {
  const response = await http.put(`/admin/tickets/${ticketId}/status`, {
    status,
  })

  return unwrapResponse<Ticket>(response)
}
