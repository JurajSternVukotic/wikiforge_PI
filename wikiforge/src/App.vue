<template>
  <div id="app">
    <!-- Include the Navbar at the top -->
    <Navbar />

    <!-- This is where the routed views will be rendered -->
    <router-view />
  </div>
</template>

<script>
import Navbar from "./components/Navbar.vue";
import LoginPage from "./components/LoginPage.vue";
import HomePage from "./components/HomePage.vue";

export default {
  components: {
    Navbar,
  },
};
</script>

<style></style>
