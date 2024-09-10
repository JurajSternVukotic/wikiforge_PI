<template>
  <div class="homepage">
    <!-- If not logged in, show prompt -->
    <div v-if="!isLoggedIn" class="not-logged-in">
      <p>
        You are not logged in, to get all the awesome benefits of this website,
        please <router-link to="/login">LOG IN</router-link>.
      </p>
      <p>
        Our website lets you browse, create, and share amazing custom wikis on
        any topic you like!
      </p>
    </div>

    <!-- If logged in, show personalized greeting and options -->
    <div v-else class="welcome">
      <h1>Welcome, {{ user.name }}!</h1>
      <div class="updates-section">
        <div class="news">
          <h2>News</h2>
          <div v-for="news in newsItems" :key="news.id" class="news-card">
            <h3>{{ news.title }}</h3>
            <p>{{ news.content }}</p>
          </div>
        </div>
        <div class="personalized-updates">
          <h2>Personalized Updates</h2>
          <!-- Dynamic personalized content goes here -->
          <p>{{ personalizedUpdates }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isLoggedIn: false, // This can come from Firebase Auth
      user: {}, // User details from Firebase
      newsItems: [
        {
          id: 1,
          title: "New Feature!",
          content: "We just released a new feature...",
        },
        {
          id: 2,
          title: "Update!",
          content: "Here is another important update...",
        },
      ],
      personalizedUpdates: "Here are your personalized updates.",
    };
  },
  mounted() {
    // Check Firebase for logged-in state
    // Example: Firebase.auth().onAuthStateChanged((user) => { ... });
  },
};
</script>

<style scoped>
.homepage {
  padding: 20px;
  text-align: center;
}

.not-logged-in {
  background-color: #e0e0e0;
  padding: 20px;
  margin-bottom: 20px;
}

.welcome {
  text-align: left;
}

.news-card {
  background-color: #f0f0f0;
  padding: 15px;
  margin: 10px 0;
  border-radius: 5px;
}
</style>
