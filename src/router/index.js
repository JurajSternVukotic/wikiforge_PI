import { createRouter, createWebHistory } from 'vue-router'
import landing_page from '@/components/landing_page.vue'
import register from '@/components/register.vue'
import login from '@/components/login.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: landing_page,
  },
  {
    path: '/login',
    name: 'login',
    component: login,
  },
  {
    path: '/register',
    name: 'Register',
    component: register,
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ '../views/AboutView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
