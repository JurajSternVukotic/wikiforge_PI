<template>
  <div class="landing-page">
    <h1>Welcome to WikiForge</h1>
    <div v-if="isLoggedIn">
      <p>Welcome back, {{ username }}!</p>
      <button @click="handleLogout">Logout</button>
    </div>
    <p v-else>
      You are not logged in. To get all the awesome benefits of this website,
      please
      <router-link to="/login">LOG IN</router-link>.
    </p>
    <p>
      Our website lets you browse, create and share amazing custom wikis on any
      topic you like! You can also follow, rate or comment on your favorite
      wikis or articles. However, this is not just a wiki, but also a social
      club, don't forget to make friends and enjoy creating together!
    </p>
  </div>
</template>

<script>
import { authService } from '@/services/auth.service'

export default {
  name: 'LandingPage',
  data() {
    return {
      isLoggedIn: false,
      username: '',
    }
  },
  methods: {
    async handleLogout() {
      try {
        await authService.logout()
        this.isLoggedIn = false
        this.username = ''
      } catch (error) {
        console.error('Logout failed:', error)
      }
    },
  },
  async created() {
    const user = await authService.getCurrentUser()
    if (user) {
      this.isLoggedIn = true
      this.username = user.displayName || user.email
    }
  },
}
</script>
