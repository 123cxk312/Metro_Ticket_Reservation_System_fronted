export type TicketStatus = 'DRAFT' | 'ON_SALE' | 'SOLD_OUT' | 'CLOSED'
export type TicketDirection = 'UP' | 'DOWN'

export interface MetroLine {
  id: number
  lineCode: string
  lineName: string
  city: string
}

export interface Station {
  id: number
  stationCode: string
  stationName: string
  city: string
}

export interface Ticket {
  id: number
  ticketNo: string
  lineId: number
  lineName: string
  startStationId: number
  startStationName: string
  endStationId: number
  endStationName: string
  direction: TicketDirection
  travelDate: string
  departureTime: string
  arrivalTime: string
  price: number
  totalStock: number
  remainingStock: number
  status: TicketStatus
}

export interface TicketSearchParams {
  startStationId: number | null
  endStationId: number | null
  travelDate: string
  direction: TicketDirection | ''
}

export interface TicketCreateInput {
  lineId: number
  startStationId: number
  endStationId: number
  direction: TicketDirection
  travelDate: string
  departureTime: string
  arrivalTime: string
  price: number
  totalStock: number
}
