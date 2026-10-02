export type OrderStatus = 'BOOKED' | 'REFUND_PENDING' | 'REFUNDED' | 'CANCELLED'

export interface TicketOrder {
  id: number
  orderNo: string
  userId: number
  ticketId: number
  ticketNo: string
  lineName: string
  startStationName: string
  endStationName: string
  travelDate: string
  departureTime: string
  quantity: number
  unitPrice: number
  totalAmount: number
  status: OrderStatus
  createdAt: string
}
