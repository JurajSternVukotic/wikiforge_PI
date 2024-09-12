import { createRouter, createWebHistory } from "vue-router";

// Import the components for each route
import HomePage from "./components/HomePage.vue";
import WikisPage from "./components/Wikis.vue";
import SocialPage from "./components/Social.vue";
import BookmarksPage from "./components/Bookmarks.vue";
import SupportPage from "./components/Support.vue";
import ProfilePage from "./components/Profile.vue";
import LoginPage from "./components/Login.vue";
import VerifyEmail from "./components/VerifyEmail.vue";
import WikiPage from "./components/WikiPage.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomePage,
  },
  {
    path: "/wikis",
    name: "Wikis",
    component: WikisPage,
  },
  {
    path: "/social",
    name: "Social",
    component: SocialPage,
  },
  {
    path: "/bookmarks",
    name: "Bookmarks",
    component: BookmarksPage,
  },
  {
    path: "/support",
    name: "Support",
    component: SupportPage,
  },
  {
    path: "/profile",
    name: "Profile",
    component: ProfilePage,
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
  },
  {
    path: "/profile",
    name: "Profile",
    component: ProfilePage,
  },
  {
    path: "/verify-email",
    name: "VerifyEmail",
    component: VerifyEmail,
  },
  { path: "/wiki/:id", name: "WikiPage", component: WikiPage },
  {
    path: "/wiki/:wikiId/article/:id",
    name: "ArticlePage",
    component: () => import("./components/ArticlePage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
