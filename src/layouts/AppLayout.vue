<template>
  <div class="app-shell">
    <button
      v-if="mobileMenuOpen"
      class="sidebar-backdrop"
      type="button"
      aria-label="关闭导航"
      @click="mobileMenuOpen = false"
    />

    <aside class="app-sidebar" :class="{ 'is-open': mobileMenuOpen }">
      <div class="sidebar-brand">
        <span class="brand-icon">
          <TrainFront :size="24" />
        </span>
        <span class="brand-copy">
          <strong>地铁票务</strong>
          <small>预约管理系统</small>
        </span>
      </div>

      <nav class="sidebar-nav" aria-label="主导航">
        <section v-for="section in navigation" :key="section.title" class="nav-section">
          <p class="nav-section-title">{{ section.title }}</p>

          <RouterLink
            v-for="item in section.items"
            :key="item.routeName"
            class="nav-link"
            active-class="is-active"
            :to="{ name: item.routeName }"
            @click="mobileMenuOpen = false"
          >
            <component :is="item.icon" :size="18" />
            <span>{{ item.label }}</span>
            <ChevronRight class="nav-arrow" :size="16" />
          </RouterLink>
        </section>
      </nav>

      <div class="sidebar-account">
        <span class="user-avatar">{{ userInitial }}</span>
        <span class="account-copy">
          <strong>{{ authStore.displayName }}</strong>
          <small>{{ roleLabel }}</small>
        </span>
        <button class="logout-button" type="button" title="退出登录" @click="logout">
          <LogOut :size="18" />
        </button>
      </div>
    </aside>

    <section class="app-main">
      <header class="app-topbar">
        <button
          class="menu-trigger"
          type="button"
          title="打开导航"
          @click="mobileMenuOpen = true"
        >
          <Menu :size="20" />
        </button>

        <div class="topbar-heading">
          <span>{{ roleLabel }}</span>
          <h1>{{ currentTitle }}</h1>
        </div>

        <div class="topbar-user">
          <el-tag :type="authStore.isAdmin ? 'warning' : 'success'" effect="plain">
            {{ authStore.isAdmin ? '管理端' : '用户端' }}
          </el-tag>
          <span>{{ authStore.displayName }}</span>
        </div>
      </header>

      <main class="app-content">
        <RouterView />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bot,
  ChevronRight,
  ClipboardList,
  LogOut,
  Menu,
  RotateCcw,
  Settings2,
  Ticket,
  TrainFront,
} from '@lucide/vue'

import { useAuthStore } from '@/stores/auth'

interface NavigationItem {
  label: string
  routeName: string
  icon: Component
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const roleLabel = computed(() => (authStore.isAdmin ? '管理员' : '普通用户'))
const userInitial = computed(() => authStore.displayName.slice(0, 1).toUpperCase())
const currentTitle = computed(() => String(route.meta.title ?? '票务工作台'))

const navigation = computed<NavigationSection[]>(() => {
  const common: NavigationSection = {
    title: '票务中心',
    items: [
      {
        label: '车票查询',
        routeName: 'tickets',
        icon: Ticket,
      },
      {
        label: '我的订单',
        routeName: 'orders',
        icon: ClipboardList,
      },
      {
        label: 'AI 票务助手',
        routeName: 'assistant',
        icon: Bot,
      },
    ],
  }

  if (!authStore.isAdmin) {
    return [common]
  }

  return [
    common,
    {
      title: '管理后台',
      items: [
        {
          label: '车票管理',
          routeName: 'admin-tickets',
          icon: Settings2,
        },
        {
          label: '退票处理',
          routeName: 'admin-refunds',
          icon: RotateCcw,
        },
      ],
    },
  ]
})

async function logout(): Promise<void> {
  authStore.logout()
  await router.replace({ name: 'login' })
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--app-bg);
}

.app-sidebar {
  position: fixed;
  z-index: 20;
  inset: 0 auto 0 0;
  display: flex;
  width: 248px;
  border-right: 1px solid var(--app-border);
  flex-direction: column;
  background: #ffffff;
}

.sidebar-brand {
  display: flex;
  min-height: 82px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--app-border);
  align-items: center;
  gap: 12px;
}

.brand-icon {
  display: grid;
  width: 42px;
  height: 42px;
  border-radius: 7px;
  flex: 0 0 auto;
  place-items: center;
  background: var(--app-primary);
  color: #ffffff;
}

.brand-copy,
.account-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.brand-copy strong {
  font-size: 16px;
}

.brand-copy small,
.account-copy small {
  color: var(--app-text-secondary);
  font-size: 11px;
}

.sidebar-nav {
  overflow-y: auto;
  padding: 20px 12px;
  flex: 1;
}

.nav-section + .nav-section {
  margin-top: 24px;
}

.nav-section-title {
  margin: 0 10px 8px;
  color: #8a979c;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.nav-link {
  display: grid;
  min-height: 42px;
  padding: 0 11px;
  border-radius: 6px;
  grid-template-columns: 20px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 10px;
  color: var(--app-text-secondary);
  font-size: 14px;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.nav-link:hover {
  background: #f3f7f6;
  color: var(--app-text);
}

.nav-link.is-active {
  background: #e7f3f3;
  color: var(--app-primary-dark);
  font-weight: 700;
}

.nav-arrow {
  opacity: 0.45;
}

.sidebar-account {
  display: grid;
  min-height: 74px;
  padding: 14px 16px;
  border-top: 1px solid var(--app-border);
  grid-template-columns: 36px minmax(0, 1fr) 34px;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  display: grid;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  place-items: center;
  background: #f0b44c;
  color: #402b00;
  font-size: 14px;
  font-weight: 800;
}

.account-copy strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-button,
.menu-trigger {
  display: grid;
  border: 0;
  border-radius: 6px;
  place-items: center;
  background: transparent;
  color: var(--app-text-secondary);
  cursor: pointer;
}

.logout-button {
  width: 34px;
  height: 34px;
}

.logout-button:hover,
.menu-trigger:hover {
  background: #eef4f3;
  color: var(--app-primary);
}

.app-main {
  min-height: 100vh;
  margin-left: 248px;
}

.app-topbar {
  position: sticky;
  z-index: 10;
  top: 0;
  display: flex;
  min-height: 72px;
  padding: 0 28px;
  border-bottom: 1px solid var(--app-border);
  align-items: center;
  gap: 16px;
  background: rgb(255 255 255 / 94%);
  backdrop-filter: blur(12px);
}

.menu-trigger {
  display: none;
  width: 38px;
  height: 38px;
}

.topbar-heading {
  min-width: 0;
  flex: 1;
}

.topbar-heading span {
  display: block;
  margin-bottom: 3px;
  color: var(--app-text-secondary);
  font-size: 11px;
}

.topbar-heading h1 {
  overflow: hidden;
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.app-content {
  padding: 28px;
}

.sidebar-backdrop {
  position: fixed;
  z-index: 15;
  inset: 0;
  display: none;
  border: 0;
  background: rgb(18 38 44 / 34%);
}

@media (max-width: 900px) {
  .app-sidebar {
    transform: translateX(-100%);
    transition: transform 180ms ease;
  }

  .app-sidebar.is-open {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    display: block;
  }

  .app-main {
    margin-left: 0;
  }

  .menu-trigger {
    display: grid;
  }
}

@media (max-width: 640px) {
  .app-topbar {
    padding: 0 16px;
  }

  .topbar-user span {
    display: none;
  }

  .app-content {
    padding: 18px 16px 28px;
  }
}
</style>
