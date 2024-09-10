<template>
  <nav class="navbar">
    <div class="navbar-content">
      <!-- Logo with a home link -->
      <div class="logo">
        <router-link to="/">
          <img src="path-to-logo" alt="Wikiforge Logo" />
        </router-link>
      </div>

      <!-- Navigation items with icons -->
      <div class="nav-items">
        <router-link v-for="item in navItems" :key="item.name" :to="item.link">
          <img :src="item.icon" :alt="item.name" />
        </router-link>
      </div>

      <!-- Right side with login/status and language select -->
      <div class="user-settings">
        <div v-if="!isLoggedIn">
          <router-link to="/login">LOG IN</router-link>
        </div>
        <div v-else>Welcome, {{ user.name }}!</div>

        <!-- Language and theme icons -->
        <img
          src="path-to-croatian-flag"
          alt="Language Toggle"
          @click="toggleLanguage"
        />
        <img src="path-to-theme-icon" alt="Theme Toggle" @click="toggleTheme" />
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      isLoggedIn: false, // You can fetch this from Firebase Auth later
      user: {}, // User details from Firebase
      navItems: [
        { name: "Option 1", link: "/option1", icon: "path-to-icon1" },
        { name: "Option 2", link: "/option2", icon: "path-to-icon2" },
        // Add more options as needed
      ],
    };
  },
  methods: {
    toggleLanguage() {
      // Functionality to toggle between languages
    },
    toggleTheme() {
      // Functionality to toggle between dark/light theme
    },
  },
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f8f8f8;
}

.navbar-content {
  display: flex;
  align-items: center;
}

.logo img {
  height: 50px;
}

.nav-items img {
  height: 30px;
  margin: 0 10px;
}

.user-settings img {
  height: 30px;
  cursor: pointer;
}

.user-settings a {
  margin-right: 10px;
}
</style>
