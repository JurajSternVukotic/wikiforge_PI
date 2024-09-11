<template>
  <div class="homepage-container">
    <!-- Greeting -->
    <h1>Hello, {{ displayName || "Guest" }}!</h1>

    <!-- Tabs -->
    <div class="tabs">
      <button
        :class="{ active: activeTab === 'news' }"
        @click="activeTab = 'news'"
      >
        Wikiforge News
      </button>
      <button
        :class="{ active: activeTab === 'updates' }"
        @click="activeTab = 'updates'"
      >
        Personal Updates
      </button>
    </div>

    <!-- Wikiforge News Tab -->
    <div v-if="activeTab === 'news'" class="news-tab">
      <h2>Wikiforge News</h2>

      <!-- Display news articles -->
      <ul>
        <li v-for="news in newsList" :key="news.id">
          <h3>{{ news.title }}</h3>
          <p>{{ news.content }}</p>

          <!-- Admin controls -->
          <div v-if="isAdmin">
            <button @click="editNews(news)">Edit</button>
            <button @click="deleteNews(news.id)" class="danger">Delete</button>
          </div>
        </li>
      </ul>

      <!-- Add news button for admins -->
      <div v-if="isAdmin">
        <h3>Add New News</h3>
        <input v-model="newNewsTitle" type="text" placeholder="Title" />
        <textarea v-model="newNewsContent" placeholder="Content"></textarea>
        <button @click="addNews">Add News</button>
      </div>
    </div>

    <!-- Personal Updates Tab (for later) -->
    <div v-if="activeTab === 'updates'" class="updates-tab">
      <h2>Personal Updates</h2>
      <p>Your personal updates will appear here in the future.</p>
    </div>
  </div>
</template>

<script>
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase"; // Import Firebase auth

export default {
  name: "HomePage",
  data() {
    return {
      displayName: "", // User's display name
      activeTab: "news", // Active tab, defaults to 'news'
      newsList: [], // List of news articles
      newNewsTitle: "", // Title for new news
      newNewsContent: "", // Content for new news
      isAdmin: false, // Whether the user is an admin
    };
  },
  mounted() {
    this.checkUserStatus(); // Check user status on page load
    this.loadNews(); // Load news on page load
  },
  methods: {
    // Check if user is logged in and whether they are admin
    checkUserStatus() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.isUserLoggedIn = true;
          this.displayName = user.displayName || "User";
          this.checkIfAdmin(); // Check if the user is an admin
        } else {
          this.isUserLoggedIn = false;
          this.displayName = "Guest";
        }
      });
    },

    // Check if user is admin
    async checkIfAdmin() {
      const db = getFirestore();
      const userDoc = doc(db, "users", auth.currentUser.uid);
      const userSnapshot = await getDoc(userDoc);
      if (userSnapshot.exists()) {
        this.isAdmin = userSnapshot.data().isAdmin || false;
      }
    },

    // Real-time loading of news using onSnapshot
    loadNews() {
      const db = getFirestore();
      const newsCollection = collection(db, "wikiforgeNews");

      // Listen for real-time updates
      onSnapshot(newsCollection, (snapshot) => {
        this.newsList = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
      });
    },

    // Add new news (admin only)
    async addNews() {
      if (!this.newNewsTitle || !this.newNewsContent) {
        alert("Please fill out both the title and content.");
        return;
      }

      try {
        const db = getFirestore();
        await addDoc(collection(db, "wikiforgeNews"), {
          title: this.newNewsTitle,
          content: this.newNewsContent,
          createdAt: new Date(),
        });
        this.newNewsTitle = "";
        this.newNewsContent = "";
        this.loadNews(); // Refresh the news list
      } catch (error) {
        alert("Failed to add news. Please try again.");
      }
    },

    // Edit news (admin only)
    async editNews(news) {
      const newTitle = prompt("Enter new title", news.title);
      const newContent = prompt("Enter new content", news.content);

      if (newTitle && newContent) {
        try {
          const db = getFirestore();
          const newsDoc = doc(db, "wikiforgeNews", news.id);
          await updateDoc(newsDoc, {
            title: newTitle,
            content: newContent,
          });
          this.loadNews(); // Refresh the news list
        } catch (error) {
          alert("Failed to update news.");
        }
      }
    },

    // Delete news (admin only)
    async deleteNews(newsId) {
      if (confirm("Are you sure you want to delete this news?")) {
        try {
          const db = getFirestore();
          const newsDoc = doc(db, "wikiforgeNews", newsId);
          await deleteDoc(newsDoc);
          this.loadNews(); // Refresh the news list
        } catch (error) {
          alert("Failed to delete news.");
        }
      }
    },
  },
};
</script>

<style scoped>
.homepage-container {
  padding: 20px;
}

h1 {
  text-align: center;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px 20px;
  margin: 0 10px;
  background-color: #eee;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.tabs button.active {
  background-color: #333;
  color: white;
}

.news-tab ul {
  list-style-type: none;
  padding: 0;
}

.news-tab li {
  margin-bottom: 20px;
}

textarea,
input {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

button {
  padding: 10px 20px;
  background-color: #333;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #555;
}

button.danger {
  background-color: red;
}

button.danger:hover {
  background-color: darkred;
}
</style>
