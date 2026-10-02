import http, { unwrapResponse } from '@/api/http'
import type { Ticket } from '@/types/ticket'

export interface AiChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AiChatApiPayload {
  message: string
  history: AiChatHistoryMessage[]
}

export interface AiChatApiResult {
  answer: string
  tickets: Ticket[]
  needsClarification: boolean
}

export async function sendAiMessageApi(payload: AiChatApiPayload): Promise<AiChatApiResult> {
  const response = await http.post('/ai/chat', payload)
  return unwrapResponse<AiChatApiResult>(response)
}
