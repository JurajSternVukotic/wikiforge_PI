<template>
  <div class="landing-page">
    <nav class="navbar"></nav>
    <div class="content">
      <h1>Welcome to WikiForge</h1>
      <p v-if="!isLoggedIn">
        You are not logged in. To get all the awesome benefits of this website,
        please
        <router-link to="/login">LOG IN</router-link>.
      </p>
      <p v-else>Welcome back, {{ username }}!</p>
      <p>
        Our website lets you browse, create and share amazing custom wikis on
        any topic you like! You can also follow, rate or comment on your
        favorite wikis or articles. However, this is not just a wiki, but also a
        social club, don't forget to make friends and enjoy creating together!
      </p>
      <div v-if="isLoggedIn">
        <h2>Updates</h2>
        <div class="tabs">
          <button
            @click="activeTab = 'news'"
            :class="{ active: activeTab === 'news' }"
          >
            News
          </button>
          <button
            @click="activeTab = 'personal'"
            :class="{ active: activeTab === 'personal' }"
          >
            Personal Updates
          </button>
        </div>
        <div v-if="activeTab === 'news'"></div>
        <div v-if="activeTab === 'personal'"></div>
      </div>
    </div>
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
      activeTab: 'news',
    }
  },
  async created() {
    const user = await authService.getCurrentUser()
    if (user) {
      this.isLoggedIn = true
      this.username = user.displayName
    }
  },
}
</script>

<style scoped></style>
