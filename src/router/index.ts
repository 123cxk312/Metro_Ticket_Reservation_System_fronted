import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'home',
        redirect: () => {
          const authStore = useAuthStore()
          return {
            name: authStore.isAdmin ? 'admin-tickets' : 'tickets',
          }
        },
      },
      {
        path: 'tickets',
        name: 'tickets',
        component: () => import('@/views/tickets/TicketSearchView.vue'),
        meta: {
          title: '车票查询',
          subtitle: '按线路、起点站、终点站和日期查询可预约车票。',
          emptyText: '暂无可用车票',
          iconKey: 'ticket',
        },
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('@/views/orders/OrderListView.vue'),
        meta: {
          title: '我的订单',
          subtitle: '查看预约记录并提交退票申请。',
          emptyText: '暂无订单',
          iconKey: 'orders',
        },
      },
      {
        path: 'assistant',
        name: 'assistant',
        component: () => import('@/views/assistant/AiAssistantView.vue'),
        meta: {
          title: 'AI 票务助手',
          subtitle: '通过自然语言查询车票和处理常见票务问题。',
          emptyText: '对话功能准备中',
          iconKey: 'assistant',
        },
      },
      {
        path: 'admin/tickets',
        name: 'admin-tickets',
        component: () => import('@/views/admin/AdminTicketView.vue'),
        meta: {
          title: '车票管理',
          subtitle: '发布车票、调整库存并管理销售状态。',
          emptyText: '暂无车票数据',
          iconKey: 'adminTickets',
          roles: ['ADMIN'] satisfies UserRole[],
        },
      },
      {
        path: 'admin/refunds',
        name: 'admin-refunds',
        component: () => import('@/views/admin/AdminRefundView.vue'),
        meta: {
          title: '退票处理',
          subtitle: '审核用户提交的退票申请。',
          emptyText: '暂无退票申请',
          iconKey: 'refunds',
          roles: ['ADMIN'] satisfies UserRole[],
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    return {
      name: 'home',
    }
  }

  const requiredRoles = to.meta.roles as UserRole[] | undefined

  if (requiredRoles && (!authStore.user || !requiredRoles.includes(authStore.user.role))) {
    return {
      name: authStore.isAdmin ? 'admin-tickets' : 'tickets',
    }
  }

  return true
})

export default router
