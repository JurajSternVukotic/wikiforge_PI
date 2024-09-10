<template>
  <nav class="navbar">
    <!-- Left Menu -->
    <ul class="navbar-menu">
      <li class="menu-item">
        <router-link to="/">
          <font-awesome-icon :icon="['fas', 'home']" /> Home
        </router-link>
      </li>
      <li class="menu-item">
        <router-link to="/wikis">
          <font-awesome-icon :icon="['fas', 'book']" /> Wikis
        </router-link>
      </li>
      <li class="menu-item">
        <router-link to="/social">
          <font-awesome-icon :icon="['fas', 'users']" /> Social
        </router-link>
      </li>
      <li class="menu-item">
        <router-link to="/bookmarks">
          <font-awesome-icon :icon="['fas', 'bookmark']" /> Bookmarks
        </router-link>
      </li>
    </ul>

    <!-- Center Brand -->
    <div class="navbar-brand">
      <router-link to="/">
        <h1>Wikiforge</h1>
        <p>Your custom wiki creator</p>
      </router-link>
    </div>

    <!-- Right Menu -->
    <ul class="navbar-menu right">
      <li class="menu-item">
        <router-link to="/support">
          <font-awesome-icon :icon="['fas', 'life-ring']" /> Support
        </router-link>
      </li>
      <li class="menu-item">
        <router-link to="/profile">
          <font-awesome-icon :icon="['fas', 'user']" /> Profile
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faHome,
  faBook,
  faUsers,
  faBookmark,
  faLifeRing,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

// Add icons to the library
library.add(faHome, faBook, faUsers, faBookmark, faLifeRing, faUser);

export default {
  name: "NavBar",
  components: {
    FontAwesomeIcon,
  },
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  padding: 10px;
  position: relative;
  overflow: hidden;
}

.navbar-menu {
  list-style: none;
  display: flex;
  align-items: center;
}

.menu-item {
  margin: 0 15px;
  position: relative;
}

.menu-item router-link {
  color: white;
  text-decoration: none;
  font-size: 16px;
  padding: 10px;
  position: relative;
  display: block;
  transition: all 0.3s ease;
}

.menu-item router-link:hover {
  background-color: #555;
}

.menu-item::before,
.menu-item::after {
  content: "";
  position: absolute;
  width: 20px;
  height: 100%;
  background-color: #333;
  top: 0;
  z-index: -1;
  transform: skewX(45deg);
}

.menu-item::before {
  left: -20px;
}

.menu-item::after {
  right: -20px;
}

.navbar-brand {
  text-align: center;
}

.navbar-brand h1 {
  color: white;
  font-size: 24px;
}

.navbar-brand p {
  color: #ccc;
  font-size: 12px;
}

.right {
  display: flex;
}

.right .menu-item {
  margin-left: 15px;
}

.menu-item a,
.menu-item navbar-brand {
  color: white;
  text-decoration: none;
  font-size: 16px;
  padding: 10px;
  position: relative;
  display: block;
  transition: all 0.3s ease;
}

.menu-item a i {
  margin-right: 8px;
}
</style>
