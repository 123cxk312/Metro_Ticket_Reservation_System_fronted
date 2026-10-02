<template>
  <section class="assistant-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">AI 票务助手</h1>
        <p class="page-subtitle">用自然语言询问从哪里到哪里有哪些车票。</p>
      </div>
      <el-tag type="success" effect="plain">
        <Bot :size="15" />
        在线
      </el-tag>
    </header>

    <div ref="chatContainer" class="chat-panel">
      <div class="message-list">
        <article
          v-for="message in messages"
          :key="message.id"
          class="message-row"
          :class="{ 'is-user': message.role === 'USER' }"
        >
          <span class="message-avatar">
            <UserRound v-if="message.role === 'USER'" :size="18" />
            <Bot v-else :size="18" />
          </span>

          <div class="message-content">
            <div class="message-bubble">
              <p>{{ message.content }}</p>
            </div>

            <div v-if="message.tickets.length > 0" class="assistant-tickets">
              <article
                v-for="ticket in message.tickets"
                :key="ticket.id"
                class="assistant-ticket"
              >
                <div>
                  <strong>{{ ticket.lineName }}</strong>
                  <span>{{ ticket.travelDate }} {{ ticket.departureTime }}</span>
                </div>
                <div>
                  <strong>
                    {{ ticket.startStationName }} -> {{ ticket.endStationName }}
                  </strong>
                  <span>余票 {{ ticket.remainingStock }} · ¥{{ ticket.price.toFixed(2) }}</span>
                </div>
                <el-tag :type="ticket.status === 'ON_SALE' ? 'success' : 'warning'" effect="plain">
                  {{ ticket.status === 'ON_SALE' ? '可预约' : '已售罄' }}
                </el-tag>
              </article>
            </div>
          </div>
        </article>

        <article v-if="sending" class="message-row">
          <span class="message-avatar">
            <Bot :size="18" />
          </span>
          <div class="message-bubble typing-bubble">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </article>
      </div>

      <div class="suggestion-list">
        <button
          v-for="suggestion in suggestions"
          :key="suggestion"
          type="button"
          @click="sendMessage(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>

      <div class="composer">
        <el-input
          v-model="input"
          type="textarea"
          :rows="2"
          maxlength="500"
          resize="none"
          placeholder="例如：明天从人民广场到城市机场有哪些票？"
          @keydown.enter.exact.prevent="sendMessage()"
        />
        <el-button
          type="primary"
          size="large"
          :disabled="!input.trim() || sending"
          :loading="sending"
          @click="sendMessage()"
        >
          <Send :size="18" />
          发送
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { Bot, Send, UserRound } from '@lucide/vue'

import { useAuthStore } from '@/stores/auth'
import { useTicketStore } from '@/stores/ticket'
import type { Ticket } from '@/types/ticket'
import { answerTicketQuestion } from '@/utils/ticketAssistant'

interface ChatMessage {
  id: number
  role: 'USER' | 'ASSISTANT'
  content: string
  tickets: Ticket[]
}

const authStore = useAuthStore()
const ticketStore = useTicketStore()
const chatContainer = ref<HTMLElement>()
const input = ref('')
const sending = ref(false)
const messages = ref<ChatMessage[]>([
  {
    id: Date.now(),
    role: 'ASSISTANT',
    content: `${authStore.displayName}，你好。告诉我出发站、到达站和日期，我可以帮你查询车票。`,
    tickets: [],
  },
])

const suggestions = [
  '明天从人民广场到城市机场有哪些票？',
  '中央火车站到城市机场有哪些车次？',
  '后天从大学城到体育中心有哪些票？',
]

onMounted(async () => {
  await ticketStore.loadReferenceData()
  await ticketStore.loadTicketsForAssistant()
})

async function sendMessage(content = input.value): Promise<void> {
  const message = content.trim()

  if (!message || sending.value) {
    return
  }

  messages.value.push({
    id: Date.now(),
    role: 'USER',
    content: message,
    tickets: [],
  })

  input.value = ''
  sending.value = true
  await scrollToBottom()

  window.setTimeout(() => {
    const result = answerTicketQuestion(message, ticketStore.tickets, ticketStore.stations)

    messages.value.push({
      id: Date.now() + 1,
      role: 'ASSISTANT',
      content: result.content,
      tickets: result.tickets,
    })

    sending.value = false
    void scrollToBottom()
  }, 420)
}

async function scrollToBottom(): Promise<void> {
  await nextTick()
  chatContainer.value?.scrollTo({
    top: chatContainer.value.scrollHeight,
    behavior: 'smooth',
  })
}
</script>

<style scoped>
.page-header :deep(.el-tag) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chat-panel {
  display: grid;
  min-height: 620px;
  max-height: calc(100vh - 220px);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  overflow: hidden;
  grid-template-rows: minmax(0, 1fr) auto auto;
  background: #ffffff;
  box-shadow: var(--app-shadow);
}

.message-list {
  overflow-y: auto;
  padding: 26px;
}

.message-row {
  display: flex;
  max-width: 84%;
  margin-bottom: 22px;
  align-items: flex-start;
  gap: 11px;
}

.message-row.is-user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-avatar {
  display: grid;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex: 0 0 auto;
  place-items: center;
  background: #e7f3f3;
  color: var(--app-primary-dark);
}

.is-user .message-avatar {
  background: #fff1df;
  color: #9b5600;
}

.message-content {
  min-width: 0;
}

.message-bubble {
  padding: 13px 16px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: #f9fbfa;
}

.is-user .message-bubble {
  border-color: #bfe0df;
  background: #e7f3f3;
}

.message-bubble p {
  margin: 0;
  line-height: 1.75;
  white-space: pre-wrap;
}

.assistant-tickets {
  display: grid;
  margin-top: 10px;
  gap: 8px;
}

.assistant-ticket {
  display: grid;
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 7px;
  grid-template-columns: minmax(130px, 0.8fr) minmax(240px, 1.3fr) auto;
  align-items: center;
  gap: 14px;
  background: #ffffff;
}

.assistant-ticket > div {
  display: grid;
  gap: 4px;
}

.assistant-ticket strong {
  font-size: 13px;
}

.assistant-ticket span {
  color: var(--app-text-secondary);
  font-size: 11px;
}

.typing-bubble {
  display: flex;
  min-width: 62px;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.typing-bubble span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--app-primary);
  animation: typing 900ms infinite ease-in-out;
}

.typing-bubble span:nth-child(2) {
  animation-delay: 120ms;
}

.typing-bubble span:nth-child(3) {
  animation-delay: 240ms;
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.suggestion-list {
  display: flex;
  padding: 12px 18px;
  border-top: 1px solid var(--app-border);
  overflow-x: auto;
  gap: 8px;
  background: #fafcfb;
}

.suggestion-list button {
  padding: 7px 11px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  flex: 0 0 auto;
  background: #ffffff;
  color: var(--app-text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.suggestion-list button:hover {
  border-color: var(--app-primary);
  color: var(--app-primary);
}

.composer {
  display: grid;
  padding: 16px 18px;
  border-top: 1px solid var(--app-border);
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
  background: #ffffff;
}

.composer :deep(.el-button) {
  gap: 7px;
}

@media (max-width: 760px) {
  .chat-panel {
    max-height: none;
  }

  .message-list {
    padding: 18px;
  }

  .message-row {
    max-width: 94%;
  }

  .assistant-ticket {
    grid-template-columns: 1fr;
  }

  .composer {
    grid-template-columns: 1fr;
  }

  .composer :deep(.el-button) {
    width: 100%;
  }
}
</style>
