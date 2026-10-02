import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  createTicketApi,
  getAdminTicketsApi,
  updateTicketStatusApi,
  type AdminTicketQuery,
} from '@/api/admin'
import { createOrderApi, getMyOrdersApi } from '@/api/order'
import {
  createRefundApi,
  getAdminRefundsApi,
  getMyRefundsApi,
  processRefundApi,
  type RefundDecision,
} from '@/api/refund'
import {
  getMetroLinesApi,
  getStationsApi,
  searchTicketsApi,
  type TicketSearchApiParams,
} from '@/api/ticket'
import type { TicketOrder } from '@/types/order'
import type { RefundRequest, RefundStatus } from '@/types/refund'
import type { MetroLine, Station, Ticket, TicketCreateInput, TicketSearchParams, TicketStatus } from '@/types/ticket'

export const useTicketStore = defineStore('ticket', () => {
  const lines = ref<MetroLine[]>([])
  const stations = ref<Station[]>([])
  const tickets = ref<Ticket[]>([])
  const searchResults = ref<Ticket[]>([])
  const orders = ref<TicketOrder[]>([])
  const refundRequests = ref<RefundRequest[]>([])

  const referenceLoaded = ref(false)
  const referenceLoading = ref(false)
  const searching = ref(false)
  const hasSearched = ref(false)
  const ordersLoading = ref(false)
  const refundsLoading = ref(false)
  const adminLoading = ref(false)

  const hasReferenceData = computed(() => lines.value.length > 0 && stations.value.length > 0)

  async function loadReferenceData(force = false): Promise<void> {
    if (referenceLoading.value || (!force && referenceLoaded.value)) {
      return
    }

    referenceLoading.value = true

    try {
      const [lineList, stationList] = await Promise.all([
        getMetroLinesApi(),
        getStationsApi(),
      ])

      lines.value = lineList
      stations.value = stationList
      referenceLoaded.value = true
    } finally {
      referenceLoading.value = false
    }
  }

  async function searchTickets(params: TicketSearchParams): Promise<void> {
    searching.value = true

    try {
      const apiParams: TicketSearchApiParams = {
        startStationId: params.startStationId || undefined,
        endStationId: params.endStationId || undefined,
        travelDate: params.travelDate || undefined,
        direction: params.direction || undefined,
      }

      searchResults.value = await searchTicketsApi(apiParams)
      hasSearched.value = true
    } finally {
      searching.value = false
    }
  }

  async function loadTicketsForAssistant(): Promise<void> {
    tickets.value = await searchTicketsApi({})
  }

  async function bookTicket(ticketId: number): Promise<TicketOrder> {
    const order = await createOrderApi({
      ticketId,
      quantity: 1,
    })

    orders.value.unshift(order)
    updateTicketStockAfterOrder(ticketId, order.quantity)
    return order
  }

  async function loadOrders(): Promise<void> {
    ordersLoading.value = true

    try {
      orders.value = await getMyOrdersApi()
    } finally {
      ordersLoading.value = false
    }
  }

  async function createRefund(orderId: number, reason: string): Promise<RefundRequest> {
    const refundRequest = await createRefundApi({
      orderId,
      reason,
    })

    refundRequests.value.unshift(refundRequest)
    updateOrderStatus(orderId, 'REFUND_PENDING')
    return refundRequest
  }

  async function loadMyRefunds(): Promise<void> {
    refundsLoading.value = true

    try {
      refundRequests.value = await getMyRefundsApi()
    } finally {
      refundsLoading.value = false
    }
  }

  async function loadAdminRefunds(status?: RefundStatus | null): Promise<void> {
    refundsLoading.value = true

    try {
      refundRequests.value = await getAdminRefundsApi(status)
    } finally {
      refundsLoading.value = false
    }
  }

  async function processRefund(
    refundId: number,
    decision: RefundDecision,
    remark: string,
  ): Promise<RefundRequest> {
    const updatedRequest = await processRefundApi(refundId, decision, remark)
    replaceRefundRequest(updatedRequest)
    return updatedRequest
  }

  async function loadAdminTickets(params: AdminTicketQuery = {}): Promise<void> {
    adminLoading.value = true

    try {
      tickets.value = await getAdminTicketsApi(params)
    } finally {
      adminLoading.value = false
    }
  }

  async function createTicket(input: TicketCreateInput): Promise<Ticket> {
    const ticket = await createTicketApi(input)
    tickets.value.unshift(ticket)
    return ticket
  }

  async function setTicketStatus(ticketId: number, status: TicketStatus): Promise<Ticket> {
    const updatedTicket = await updateTicketStatusApi(ticketId, status)
    replaceTicket(updatedTicket)
    return updatedTicket
  }

  function updateTicketStockAfterOrder(ticketId: number, quantity: number): void {
    const ticket = findTicket(ticketId)

    if (!ticket) {
      return
    }

    ticket.remainingStock = Math.max(0, ticket.remainingStock - quantity)

    if (ticket.remainingStock === 0) {
      ticket.status = 'SOLD_OUT'
    }
  }

  function updateOrderStatus(orderId: number, status: TicketOrder['status']): void {
    const order = orders.value.find((item) => item.id === orderId)

    if (order) {
      order.status = status
    }
  }

  function replaceTicket(updatedTicket: Ticket): void {
    replaceInList(tickets.value, updatedTicket)
    replaceInList(searchResults.value, updatedTicket)
  }

  function replaceRefundRequest(updatedRequest: RefundRequest): void {
    const index = refundRequests.value.findIndex((item) => item.id === updatedRequest.id)

    if (index >= 0) {
      refundRequests.value[index] = updatedRequest
    } else {
      refundRequests.value.unshift(updatedRequest)
    }

    if (updatedRequest.status === 'APPROVED') {
      updateOrderStatus(updatedRequest.orderId, 'REFUNDED')
    }

    if (updatedRequest.status === 'REJECTED') {
      updateOrderStatus(updatedRequest.orderId, 'BOOKED')
    }
  }

  function findTicket(ticketId: number): Ticket | undefined {
    return tickets.value.find((item) => item.id === ticketId)
      ?? searchResults.value.find((item) => item.id === ticketId)
  }

  function replaceInList(list: Ticket[], updatedTicket: Ticket): void {
    const index = list.findIndex((item) => item.id === updatedTicket.id)

    if (index >= 0) {
      list[index] = updatedTicket
    }
  }

  return {
    lines,
    stations,
    tickets,
    searchResults,
    orders,
    refundRequests,
    referenceLoading,
    hasReferenceData,
    searching,
    hasSearched,
    ordersLoading,
    refundsLoading,
    adminLoading,
    loadReferenceData,
    searchTickets,
    loadTicketsForAssistant,
    bookTicket,
    loadOrders,
    createRefund,
    loadMyRefunds,
    loadAdminRefunds,
    processRefund,
    loadAdminTickets,
    createTicket,
    setTicketStatus,
  }
})
