const express = require('express');
const router = express.Router();
const { Post } = require('../models');
const postSchema = require('../security/schemas/postSchema');

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The post ID
 *         title:
 *           type: string
 *           description: The post title
 *         content:
 *           type: string
 *           description: The post content
 *         category:
 *           type: string
 *           description: The post category
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: The post tags
 *         author:
 *           type: string
 *           description: The post author
 *       example:
 *         id: 1
 *         title: How to use Node.js with Express
 *         content: Learn how to use Node.js and Express to create a simple server application...
 *         category: Programming
 *         tags: ['Node.js', 'Express', 'Backend']
 *         author: John Doe
 */

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Retrieve a list of posts
 *     description: Retrieve a list of posts with pagination and filtering options
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of posts to retrieve
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter posts by category
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter posts by tags (comma-separated)
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter posts by author
 *     responses:
 *       200:
 *         description: A list of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */

module.exports = (passport) => {

    router.get('/', async (req, res) => {
        const { page = 1, limit = 10, category, tags, author } = req.query;
      
        const offset = (page - 1) * limit;
        const where = {};
      
        if (category) {
          where.category = category;
        }
        if (tags) {
          where.tags = { [Op.contains]: tags.split(',') };
        }
        if (author) {
          where.author = author;
        }
      
        const posts = await Post.findAll({ limit, offset, where });
        res.json(posts);
    });
      
      // Get all comments with pagination
    router.get('/:postId/comments', async (req, res) => {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const postId = req.params.postId;
      
        const comments = await Comment.findAll({ limit, offset, where: { postId } });
        res.json(comments);
    });
      
      
    router.post('/', passport.authenticate('jwt', { session: false }),async (req, res) => {
        await postSchema.validateAsync(req.body);
        const post = await Post.create({ ...req.body, UserId: req.user.id });
        res.status(201).json(post);
    });
      
    router.get('/:id',passport.authenticate('jwt', { session: false }), async (req, res) => {
        const post = await Post.findByPk(req.params.id, { include: User });
        res.json(post);
    });
      
    router.put('/:id',passport.authenticate('jwt', { session: false }), async (req, res) => {
        await postSchema.validateAsync(req.body);
        await Post.update(req.body, { where: { id: req.params.id } });
        const updatedPost = await Post.findByPk(req.params.id, { include: User });
        res.json(updatedPost);
    });
      
    router.delete('/:id',passport.authenticate('jwt', { session: false }), async (req, res) => {
        await Post.destroy({ where: { id: req.params.id } });
        res.status(204).send();
    });
    return router    

}


