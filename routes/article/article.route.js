import express from "express";
import { isAuth } from "../../middleware/auth.js";

import {
    getAllBlog,
    getAvailableBlog,
    getTopAvailableBlog,
    getBlogById,
    getBlogBySlug,
    addBlog,
    editBlog,
    editBlogView,
    deleteBlog,
    getRelatedArticles,
    getBlogByAuthor,
} from "../../controllers/article/article.controller.js";
import { getCategory, addOrUpdateCategory } from "../../controllers/article/articleCate.controller.js";

const router = express.Router();

// Tambahkan rute list-category di atas rute dengan :id
router.get("/list-category", getCategory);
router.post("/list-category", addOrUpdateCategory);

// GET RELATED ARTICLES
router.get("/related", getRelatedArticles);

// GETTING ALL THE DATA
router.get("/", getAllBlog);

// GETTING ALL AVAILABLE DATA
router.get("/available", getAvailableBlog);

// GETTING ALL TOP AVAILABLE DATA
router.get("/available-top", getTopAvailableBlog);

// GET A SPECIFIC DATA
router.get("/:id", getBlogById);

// GET A SPECIFIC DATA BY SLUG
router.get("/read/:slug", getBlogBySlug);

// GET ALL BLOGS BY AUTHOR
router.get("/author/:authorId", getBlogByAuthor);

// CREATE NEW DATA
router.post("/", addBlog);

// UPDATE A SPECIFIC DATA
router.patch("/:id", editBlog);

// UPDATE A VIEW DATA
router.patch("/inc-view/:id", editBlogView);

// DELETE A SPECIFIC DATA
router.delete("/:id", isAuth, deleteBlog);

export default router;
