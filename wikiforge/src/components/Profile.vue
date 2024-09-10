<template>
  <div v-if="user">
    <h1>Welcome, {{ user.displayName || user.email }}</h1>
    <button @click="logout">Logout</button>
  </div>
  <div v-else>
    <!-- Redirect to the login page if user is not logged in -->
    <h1>You are not logged in, redirecting to login...</h1>
  </div>
</template>

<script>
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

export default {
  name: "ProfilePage",
  data() {
    return {
      user: null,
    };
  },
  created() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.user = user;
      } else {
        this.$router.push("/login");
      }
    });
  },
  methods: {
    logout() {
      const auth = getAuth();
      signOut(auth).then(() => {
        this.$router.push("/login");
      });
    },
  },
};
</script>

<style scoped>
h1 {
  text-align: center;
}

button {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  background-color: #333;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #555;
}
</style>
