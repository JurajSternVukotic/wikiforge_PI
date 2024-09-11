<template>
  <div class="wikis-container">
    <!-- Banner -->
    <h1>Your Wikis</h1>

    <!-- If the user is not logged in, show the message -->
    <div v-if="!isUserLoggedIn">
      <p>
        Unfortunately, Wikiforge requires users to log in before creating wikis.
      </p>
    </div>

    <!-- If the user is logged in, show the wiki creation form and list -->
    <div v-else>
      <!-- New Wiki Card -->
      <div class="new-wiki-card">
        <h2>Create a New Wiki</h2>
        <input
          v-model="newWikiTitle"
          type="text"
          placeholder="Enter wiki title"
        />
        <button @click="createWiki">Create Wiki</button>
      </div>

      <!-- List of Wikis -->
      <div class="wiki-list">
        <h2>Your Wikis</h2>

        <div v-if="wikis.length > 0">
          <div v-for="wiki in wikis" :key="wiki.id" class="wiki-card">
            <h3>{{ wiki.title }}</h3>
            <button @click="editWikiTitle(wiki)">Edit Title</button>
            <button @click="deleteWiki(wiki.id)" class="danger">
              Delete Wiki
            </button>
            <button @click="shareWiki(wiki)">Share</button>
          </div>
        </div>

        <div v-else>
          <p>No wikis found. Start by creating a new one!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase"; // Import Firebase auth

export default {
  name: "WikisPage",
  data() {
    return {
      newWikiTitle: "", // Title for new wikis
      wikis: [], // List of user's wikis
      isUserLoggedIn: false, // Track user login status
      displayName: "Guest", // Display user's name, default to Guest
    };
  },
  mounted() {
    this.checkUserStatus(); // Check if the user is logged in
  },
  methods: {
    // Check if the user is logged in
    checkUserStatus() {
      // Initial check if the user is already logged in
      const user = auth.currentUser;
      if (user) {
        this.isUserLoggedIn = true;
        this.loadWikis(); // Load wikis if the user is logged in
        this.displayName = user.displayName || "User"; // Set the user's display name if available
      }

      // Listen for changes in the authentication state
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.isUserLoggedIn = true;
          this.displayName = user.displayName || "User"; // Update display name
          this.loadWikis(); // Load wikis if user is logged in
        } else {
          this.isUserLoggedIn = false;
          this.displayName = "Guest";
        }
      });
    },
    // Load user's wikis from Firestore
    async loadWikis() {
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, "wikis"));

      // Filter wikis where the user is the owner
      this.wikis = querySnapshot.docs
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }))
        .filter((wiki) => wiki.owner === auth.currentUser.uid);
    },

    // Create a new wiki
    async createWiki() {
      if (!this.newWikiTitle) {
        alert("Please enter a wiki title.");
        return;
      }

      try {
        const db = getFirestore();
        await addDoc(collection(db, "wikis"), {
          title: this.newWikiTitle,
          owner: auth.currentUser.uid, // Set the owner as the current user
          permissions: {
            [auth.currentUser.uid]: "owner", // Set the creator as the owner
          },
          createdAt: new Date(),
        });

        this.newWikiTitle = ""; // Clear input after creating
        this.loadWikis(); // Refresh the list of wikis
      } catch (error) {
        alert("Failed to create a new wiki. Please try again.");
      }
    },

    // Edit wiki title
    async editWikiTitle(wiki) {
      const newTitle = prompt("Enter new title", wiki.title);
      if (newTitle && newTitle !== wiki.title) {
        try {
          const db = getFirestore();
          const wikiDoc = doc(db, "wikis", wiki.id);
          await updateDoc(wikiDoc, {
            title: newTitle,
          });
          this.loadWikis(); // Refresh the list after updating
        } catch (error) {
          alert("Failed to update wiki title.");
        }
      }
    },

    // Delete wiki (with confirmation)
    async deleteWiki(wikiId) {
      if (
        confirm(
          "Are you sure you want to delete this wiki? This cannot be undone."
        )
      ) {
        try {
          const db = getFirestore();
          await deleteDoc(doc(db, "wikis", wikiId));
          this.loadWikis(); // Refresh the list after deletion
        } catch (error) {
          alert("Failed to delete the wiki.");
        }
      }
    },

    // Share wiki (placeholder for now)
    shareWiki(wiki) {
      console.log(wiki);
      alert("Sharing feature is coming soon!");
    },
  },
};
</script>

<style scoped>
.wikis-container {
  padding: 20px;
}

h1 {
  text-align: center;
}

.new-wiki-card {
  background-color: #f4f4f4;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.wiki-list {
  margin-top: 20px;
}

.wiki-card {
  padding: 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  border-radius: 4px;
}

button {
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #333;
  color: white;
  border: none;
  cursor: pointer;
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
