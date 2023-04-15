const User = require('../../models/user');

const createUser = async (req, res) => {
    const { username, password, email } = req.body;
  
    try {
      
      const existingUser = await User.findAll({
        where: {
          [Op.or]: [
            { username: { [Op.iLike]: `%${searchTerm}%` } },
            { email: { [Op.iLike]: `%${searchTerm}%` } },
          ]
        }
      });
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }
  
      // Create new user
      const newUser = await User.create({ username, password, email });
      res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to create user' });
    }
};

exports.createUser = createUser
