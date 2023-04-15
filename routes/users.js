const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userSchema = require('../security/schemas/userSchema');
const { Op } = require('sequelize');
const {createUser} = require("../utils/db/user-queries")
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The user ID
 *         username:
 *           type: string
 *           description: The user's username
 *         email:
 *           type: string
 *           description: The user's email address
 *         password:
 *           type: string
 *           description: The user's password
 *       example:
 *         id: 1
 *         username: johndoe
 *         email: johndoe@example.com
 *         password: MyStrongPassword
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with the provided information
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: The user was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Invalid input data
 */
module.exports = (passport) => {

    router.post('/register',async (req, res) => {
        const { username, password, email } = await userSchema.validateAsync(req.body);
        try {
          // Check if user already exists
          const existingUser = await User.findOne({
            where: {
              [Op.and]: [
                { username: username },
                { email: email }
              ]
            }
          });
          if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
          }
      
          try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await createUser({ username, password: hashedPassword, email });
        
            res.status(201).json({ message: 'User registered successfully', user: newUser });
          } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to register user' });
          }
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Failed to register user' });
        }
        
    });
      
    router.post('/login',passport.authenticate('local', { session: false }), async (req, res) => {
        const { username, password } = await userSchema.validateAsync(req.body);
      
        try {
          const user = await User.findOne({ where: { username } });
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
      
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid password' });
          }
      
          const payload = { id: user.id, username: user.username };
          const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      
          res.status(200).json({ message: 'User logged in successfully', token });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Failed to log in user' });
        }
    });
    
    router.get('/', async (req, res) => {
        const users = await User.findAll();
        res.json(users);
    });
      
      
    router.get('/:id', passport.authenticate('jwt', { session: false }),async (req, res) => {
        const user = await User.findByPk(req.params.id);
        res.json(user);
    });
    
    router.get('/search',passport.authenticate('jwt', { session: false }), async (req, res) => {
        try {
            const { query } = req.query;
            const searchResults = await client.search({
            index: 'users',
            body: {
                query: {
                multi_match: {
                    query,
                    fields: ['name', 'email'],
                    fuzziness: 'AUTO',
                },
                },
            },
            });
    
            const users = searchResults.body.hits.hits.map((hit) => hit._source);
            res.json(users);
        } catch (error) {
            console.error('Error searching users:', error);
            res.status(500).json({ message: 'Error searching users' });
        }
    });
    
    // Create a user
    router.post('/', passport.authenticate('jwt', { session: false }),async (req, res) => {
        try {
          await userSchema.validateAsync(req.body);


          const { username, password, email } = req.body;

          const existingUser = await User.findOne({
            where: {
              [Op.and]: [
                { username: username },
                { email: email }
              ]
            }
          });
          if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
          }
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          
          const user = await User.create({ username, password: hashedPassword, email });
          
          // Add the user to Elasticsearch
          client.index({
            index: 'users',
            id: user.id.toString(),
            body: user.toJSON(),
          });
          
          res.status(201).json(user);
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Failed to create user' });
        }
      });
    
    // Update a user
    router.put('/:id',passport.authenticate('jwt', { session: false }), async (req, res) => {
        const user = await User.findByPk(req.params.id);
    
        if (user) {
          const existingUser = await User.findOne({
            where: {
              [Op.and]: [
                { username: req.body.username },
                { email: req.body.email }
              ]
            }
          });
          if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
          }
            await user.update(req.body);
    
            // Update the user in Elasticsearch
            client.update({
            index: 'users',
            id: user.id.toString(),
            body: { doc: user.toJSON() },
            });
    
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
    
    // Delete a user
    router.delete('/:id',passport.authenticate('jwt', { session: false }), async (req, res) => {
        const user = await User.findByPk(req.params.id);
    
        if (user) {
            await user.destroy();
    
            // Delete the user from Elasticsearch
            client.delete({ index: 'users', id: user.id.toString() });
    
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });

    return router

}



