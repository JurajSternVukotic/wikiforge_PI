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

export default {
  components: {
    Navbar,
  },
};
</script>

<style>
body {
  margin: 0;
}
</style>
