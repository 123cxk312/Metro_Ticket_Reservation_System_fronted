import type { Station, Ticket, TicketDirection } from '@/types/ticket'

export interface AssistantTicketResult {
  content: string
  tickets: Ticket[]
}

interface MatchedStation {
  station: Station
  position: number
}

const stationAliases: Record<string, string[]> = {
  城市机场: ['城市机场', '机场'],
  中央火车站: ['中央火车站', '火车站'],
  体育中心: ['体育中心', '体育馆'],
}

function formatDateOffset(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function extractDate(message: string): string | null {
  if (message.includes('今天')) {
    return formatDateOffset(0)
  }

  if (message.includes('明天')) {
    return formatDateOffset(1)
  }

  if (message.includes('后天')) {
    return formatDateOffset(2)
  }

  const isoDate = message.match(/\d{4}-\d{2}-\d{2}/)?.[0]

  if (isoDate) {
    return isoDate
  }

  const chineseDate = message.match(/(\d{1,2})月(\d{1,2})日/)

  if (chineseDate) {
    const month = chineseDate[1]?.padStart(2, '0')
    const day = chineseDate[2]?.padStart(2, '0')
    return `${new Date().getFullYear()}-${month}-${day}`
  }

  return null
}

function extractDirection(message: string): TicketDirection | null {
  if (message.includes('下行')) {
    return 'DOWN'
  }

  if (message.includes('上行')) {
    return 'UP'
  }

  return null
}

function extractStations(message: string, stations: Station[]): MatchedStation[] {
  return stations
    .map((station) => {
      const aliases = stationAliases[station.stationName] ?? [station.stationName]
      const positions = aliases
        .map((alias) => message.indexOf(alias))
        .filter((position) => position >= 0)

      return positions.length > 0
        ? {
            station,
            position: Math.min(...positions),
          }
        : null
    })
    .filter((item): item is MatchedStation => item !== null)
    .sort((left, right) => left.position - right.position)
}

export function answerTicketQuestion(
  message: string,
  tickets: Ticket[],
  stations: Station[],
): AssistantTicketResult {
  const matchedStations = extractStations(message, stations)
  const startStation = matchedStations[0]?.station
  const endStation = matchedStations[1]?.station

  if (!startStation || !endStation) {
    return {
      content: '请告诉我出发站和到达站，例如：明天从人民广场到城市机场有哪些票？',
      tickets: [],
    }
  }

  const travelDate = extractDate(message)
  const direction = extractDirection(message)

  const matchedTickets = tickets.filter((ticket) => {
    if (ticket.status === 'DRAFT') {
      return false
    }

    if (ticket.startStationId !== startStation.id || ticket.endStationId !== endStation.id) {
      return false
    }

    if (travelDate && ticket.travelDate !== travelDate) {
      return false
    }

    if (direction && ticket.direction !== direction) {
      return false
    }

    return true
  })

  if (matchedTickets.length === 0) {
    return {
      content: `暂时没有找到从${startStation.stationName}到${endStation.stationName}的可售车票。`,
      tickets: [],
    }
  }

  const dateText = travelDate ? `在 ${travelDate}` : ''
  const availableCount = matchedTickets.filter(
    (ticket) => ticket.status === 'ON_SALE' && ticket.remainingStock > 0,
  ).length

  return {
    content: `从${startStation.stationName}到${endStation.stationName}${dateText}共找到 ${matchedTickets.length} 个班次，其中 ${availableCount} 个班次仍可预约。`,
    tickets: matchedTickets,
  }
}
