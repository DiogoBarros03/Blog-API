const express = require('express');
const router = express.Router();
const { Comment } = require('../models');
const commentSchema = require('../security/schemas/commentSchema');
/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The comment ID
 *         content:
 *           type: string
 *           description: The comment content
 *         postId:
 *           type: integer
 *           description: The ID of the post the comment belongs to
 *       example:
 *         id: 1
 *         content: Great tutorial, thank you!
 *         postId: 1
 */

/**
 * @swagger
 * /posts/{postId}/comments:
 *   get:
 *     summary: Retrieve a list of comments for a specific post
 *     description: Retrieve a list of comments for a specific post with pagination
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: integer
 *         description: The ID of the post to retrieve comments for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of comments to retrieve
 *     responses:
 *       200:
 *         description: A list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *
 *   post:
 *     summary: Add a new comment to a specific post
 *     description: Add a new comment to a specific post using the provided information
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: integer
 *         description: The ID of the post to add a comment to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: The comment was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request - Invalid input data
 */

module.exports = (passport) => {
    router.get('/', async (req, res) => {
        const comments = await Comment.findAll({ include: [User, Post] });
        res.json(comments);
    });
      
    router.post('/', passport.authenticate('jwt', { session: false }),async (req, res) => {
        await commentSchema.validateAsync(req.body);
        const comment = await Comment.create({ ...req.body, UserId: req.user.id, PostId: req.body.postId });
        res.status(201).json(comment);
    });
      
    router.get('/:id',passport.authenticate('jwt', { session: false }), async (req, res) => {
        const comment = await Comment.findByPk(req.params.id, { include: [User, Post] });
        res.json(comment);
    });
      
    router.put('/:id', passport.authenticate('jwt', { session: false }),async (req, res) => {
        await commentSchema.validateAsync(req.body);
        await Comment.update(req.body, { where: { id: req.params.id } });
        const updatedComment = await Comment.findByPk(req.params.id, { include: [User, Post] });
        res.json(updatedComment);
    });
      
    router.delete('/:id',passport.authenticate('jwt', { session: false }), async (req, res) => {
        await Comment.destroy({ where: { id: req.params.id } });
        res.status(204).send();
    });
    
    return router

}

