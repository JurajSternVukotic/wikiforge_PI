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
} from "firebase/firestore";

export default {
  name: "WikiPage",
  data() {
    return {
      wiki: {},
      articles: [],
    };
  },
  async mounted() {
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
</style>
