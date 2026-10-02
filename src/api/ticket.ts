import http, { unwrapResponse } from '@/api/http'
import type {
  MetroLine,
  Station,
  Ticket,
  TicketDirection,
} from '@/types/ticket'

export interface TicketSearchApiParams {
  startStationId?: number | null
  endStationId?: number | null
  travelDate?: string | null
  direction?: TicketDirection | null
}

export async function getMetroLinesApi(): Promise<MetroLine[]> {
  const response = await http.get('/metro/lines')
  return unwrapResponse<MetroLine[]>(response)
}

export async function getStationsApi(): Promise<Station[]> {
  const response = await http.get('/metro/stations')
  return unwrapResponse<Station[]>(response)
}

export async function searchTicketsApi(params: TicketSearchApiParams): Promise<Ticket[]> {
  const response = await http.get('/tickets', {
    params,
  })

  return unwrapResponse<Ticket[]>(response)
}
