<template>
  <div class="article-page">
    <!-- Title editing -->
    <div v-if="isEditor && isEditing">
      <input v-model="article.title" class="title-editor" />
    </div>
    <div v-else>
      <h1>{{ article.title }}</h1>
    </div>

    <!-- Back button to the wiki page -->
    <button @click="goBackToWiki" class="back-btn">Back to Wiki</button>

    <!-- Mode toggle: Edit or Render -->
    <div v-if="isEditor">
      <div class="mode-toggle">
        <button @click="toggleMode">
          {{ isEditing ? "Render" : "Edit" }}
        </button>
      </div>
    </div>
    <!-- Edit/Delete mode available only for editors -->
    <div v-if="isEditor && isEditing">
      <textarea
        v-model="article.content"
        placeholder="Start writing..."
        rows="10"
        class="article-editor"
      ></textarea>
      <button @click="saveArticle" class="save-article-btn">Save</button>
      <button @click="deleteArticle" class="delete-article-btn">
        Delete Article
      </button>
    </div>

    <!-- Rendered mode (view only for viewers and commenters) -->
    <div v-else class="article-content" v-html="renderedContent"></div>
  </div>
</template>

<script>
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { auth } from "../firebase";
import { marked } from "marked";

export default {
  name: "ArticlePage",
  data() {
    return {
      article: {},
      isEditor: false,
      isEditing: false, // Toggle between edit and render mode
      renderedContent: "", // Store rendered HTML content
    };
  },
  async mounted() {
    await this.loadArticle();
    this.renderContent(); // Render content in Markdown/HTML
  },
  methods: {
    async loadArticle() {
      const db = getFirestore();
      const articleId = this.$route.params.id;

      // Load article details
      const articleDoc = doc(db, "articles", articleId);
      const articleSnapshot = await getDoc(articleDoc);
      if (articleSnapshot.exists()) {
        this.article = articleSnapshot.data();

        // Check if the user is an editor or commenter of the parent wiki
        const currentUser = auth.currentUser;
        const wikiDoc = doc(db, "wikis", this.article.wikiId);
        const wikiSnapshot = await getDoc(wikiDoc);
        const permissions = wikiSnapshot.data().permissions || {};

        const userPermission = permissions[currentUser.uid];
        this.isEditor =
          userPermission === "owner" || userPermission === "editor";
        this.canComment = userPermission === "commenter" || this.isEditor; // Commenters and editors can comment
      }
    },

    // Toggle between Edit and Render mode
    toggleMode() {
      this.isEditing = !this.isEditing;
      if (!this.isEditing) {
        this.renderContent(); // Re-render content when switching back to Render mode
      }
    },

    // Render the article content (Markdown/HTML)
    async renderContent() {
      // Resolve the parsed content before passing it to marked
      const parsedContent = await this.parseArticleLinks(this.article.content);
      this.renderedContent = marked(parsedContent);
    },

    // Parse article links and convert them into actual <a> tags
    async parseArticleLinks(content) {
      if (!content) return ""; // Check if content is defined
      const db = getFirestore();
      const wikiId = this.article.wikiId; // Assuming `wikiId` is available in the article data

      // Match the double-bracketed links [[articleTitle]]
      const linkPattern = /\[\[(.*?)\]\]/g;

      // Find all article links and resolve them to their corresponding Firebase IDs
      const articleTitles = [...content.matchAll(linkPattern)].map((match) =>
        match[1].trim()
      );

      // Fetch all articles in the wiki to get their IDs by title
      const articlesQuery = query(
        collection(db, "articles"),
        where("wikiId", "==", wikiId)
      );
      const articlesSnapshot = await getDocs(articlesQuery);

      const articleMap = {};
      articlesSnapshot.forEach((doc) => {
        articleMap[doc.data().title] = doc.id;
      });

      // Replace the titles with links to the article using the Firebase document ID
      return content.replace(linkPattern, (match, title) => {
        const articleId = articleMap[title.trim()];
        return articleId
          ? `<a href="/wiki/${wikiId}/article/${articleId}">${title.trim()}</a>`
          : title; // If no match, return the title as plain text
      });
    },

    // Save the article title and content
    async saveArticle() {
      const db = getFirestore();
      const articleDoc = doc(db, "articles", this.$route.params.id);
      await updateDoc(articleDoc, {
        content: this.article.content,
        title: this.article.title, // Update title as well
      });
      alert("Article saved!");
    },

    // Delete the article
    async deleteArticle() {
      if (confirm("Are you sure you want to delete this article?")) {
        const db = getFirestore();
        const articleDoc = doc(db, "articles", this.$route.params.id);
        await deleteDoc(articleDoc);
        this.$router.push({
          name: "WikiPage",
          params: { id: this.article.wikiId },
        });
      }
    },

    // Navigate back to the wiki page
    goBackToWiki() {
      this.$router.push({
        name: "WikiPage",
        params: { id: this.article.wikiId },
      });
    },
  },
};
</script>

<style scoped>
.article-page {
  padding: 20px;
}

h1 {
  text-align: center;
  color: #333;
}

.title-editor {
  width: 100%;
  font-size: 2rem;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.article-editor {
  width: 100%;
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  resize: vertical;
}

.save-article-btn {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 1rem;
  margin-right: 10px;
}

.save-article-btn:hover {
  background-color: #0056b3;
}

.delete-article-btn {
  background-color: red;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 1rem;
}

.delete-article-btn:hover {
  background-color: darkred;
}

.article-content {
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
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

.mode-toggle {
  margin-bottom: 10px;
}

.mode-toggle button {
  background-color: #28a745;
  color: white;
  padding: 10px 15px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 1rem;
}

.mode-toggle button:hover {
  background-color: #218838;
}
</style>
