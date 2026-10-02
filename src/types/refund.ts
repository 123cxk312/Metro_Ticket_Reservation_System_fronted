export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface RefundRequest {
  id: number
  orderId: number
  orderNo: string
  userId: number
  userName: string
  reason: string
  status: RefundStatus
  lineName: string
  startStationName: string
  endStationName: string
  travelDate: string
  departureTime: string
  totalAmount: number
  handledBy: number | null
  handledByName: string | null
  handledAt: string | null
  handleRemark: string | null
  createdAt: string
}
