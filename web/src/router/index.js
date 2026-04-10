import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/throw', name: 'Throw', component: () => import('../views/Throw.vue') },
  { path: '/discover', name: 'Discover', component: () => import('../views/Discover.vue') },
  { path: '/trending', name: 'Trending', component: () => import('../views/Trending.vue') },
  { path: '/mine', name: 'Mine', component: () => import('../views/Mine.vue') },
  { path: '/plane/:id', name: 'PlaneDetail', component: () => import('../views/PlaneDetail.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
