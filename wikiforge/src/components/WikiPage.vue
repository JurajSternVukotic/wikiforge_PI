<template>
  <div class="wiki-page">
    <h1>{{ wiki.title }}</h1>

    <!-- Back button to the list of wikis -->
    <button @click="$router.push('/wikis')" class="back-btn">
      Back to Wikis
    </button>

    <h2>Articles</h2>
    <button @click="createArticle" class="create-article-btn">
      Create Article
    </button>

    <div v-if="articles.length > 0">
      <ul class="article-list">
        <li v-for="article in articles" :key="article.id">
          <router-link
            :to="{
              name: 'ArticlePage',
              params: { wikiId: $route.params.id, id: article.id },
            }"
          >
            {{ article.title }}
          </router-link>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>No articles found. Start by creating a new one!</p>
    </div>

    <!-- Comments Section -->
    <h2>Comments</h2>

    <!-- Comment Form -->
    <div class="comment-form">
      <textarea
        v-model="newComment"
        placeholder="Write your comment..."
      ></textarea>
      <button @click="postComment">Post Comment</button>
    </div>

    <!-- Comment List -->
    <div v-if="comments.length > 0" class="comment-list">
      <div v-for="comment in comments" :key="comment.id" class="comment">
        <p>
          <strong>{{ comment.displayName }}</strong
          >: {{ comment.text }}
        </p>
      </div>
    </div>
    <div v-else>
      <p>No comments yet. Be the first to comment!</p>
    </div>
  </div>
</template>

<script>
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "../firebase"; // Import your Firebase auth

export default {
  name: "WikiPage",
  data() {
    return {
      wiki: {},
      articles: [],
      comments: [], // List of comments
      newComment: "", // Model for the new comment input
    };
  },
  async mounted() {
    this.loadComments();
    const db = getFirestore();
    const wikiId = this.$route.params.id;

    // Load wiki details
    const wikiDoc = doc(db, "wikis", wikiId);
    const wikiSnapshot = await getDoc(wikiDoc);
    if (wikiSnapshot.exists()) {
      this.wiki = wikiSnapshot.data();
    }

    // Load articles related to this wiki
    const articlesQuery = query(
      collection(db, "articles"),
      where("wikiId", "==", wikiId)
    );
    const articlesSnapshot = await getDocs(articlesQuery);
    this.articles = articlesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Load comments for this wiki
    this.loadComments();
  },
  methods: {
    async createArticle() {
      const db = getFirestore();
      const newArticle = {
        title: "New Article",
        content: "",
        wikiId: this.$route.params.id, // Reference the current wiki's ID
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, "articles"), newArticle);
      this.articles.push({ id: docRef.id, ...newArticle });
    },

    // Load comments in real-time using onSnapshot
    loadComments() {
      const db = getFirestore();
      const wikiId = this.$route.params.id;

      const commentsQuery = query(
        collection(db, "comments"),
        where("wikiId", "==", wikiId)
      );

      // Listen for real-time updates on comments
      onSnapshot(commentsQuery, (querySnapshot) => {
        this.comments = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      });
    },

    // Post a new comment
    async postComment() {
      if (!this.newComment.trim()) {
        alert("Comment cannot be empty!");
        return;
      }

      const db = getFirestore();
      const currentUser = auth.currentUser;

      // Add a new comment to Firestore
      const newComment = {
        text: this.newComment,
        wikiId: this.$route.params.id,
        userId: currentUser.uid,
        displayName: currentUser.displayName || "Anonymous",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "comments"), newComment);

      // Clear the comment input after posting
      this.newComment = "";
    },
  },
};
</script>

<style scoped>
.wiki-page {
  padding: 20px;
}

h1 {
  text-align: center;
  color: #333;
}

h2 {
  margin-top: 20px;
  color: #555;
}

.article-list {
  padding: 0;
  list-style-type: none;
}

.article-list li {
  margin: 10px 0;
}

.article-list a {
  color: #007bff;
  text-decoration: none;
  font-size: 1.2rem;
}

.article-list a:hover {
  text-decoration: underline;
}

.create-article-btn {
  background-color: #28a745;
  color: white;
  padding: 10px 15px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 1rem;
  margin-bottom: 10px;
}

.create-article-btn:hover {
  background-color: #218838;
}

.back-btn {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  margin-bottom: 20px;
}

.back-btn:hover {
  background-color: #0056b3;
}

.comment-form textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.comment-form button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

.comment-form button:hover {
  background-color: #0056b3;
}

.comment-list {
  margin-top: 20px;
}

.comment {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.comment p {
  margin: 0;
}
</style>
