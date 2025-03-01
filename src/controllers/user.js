import Authenticate from '../utils/Authenticate.js';
import db from '../models/index.js';
import { Op } from 'sequelize';
const { User } = db;

class UserController {

  async create(req, res) {
    try {
      // Destructure all required fields from the request body
      const { email, userName, dateOfBirth, condition, hobbies, about, role, password } = req.body;
  
      // Ensure all fields are provided
      if (!email || !userName || !dateOfBirth || !condition || !hobbies || !about || !role || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
  
      // Check if either the email or username already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { userName }],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(409).json({ message: 'Email already exists.' });
        }
        if (existingUser.userName === userName) {
          return res.status(409).json({ message: 'Username already exists.' });
        }
      }
  
      const user = await User.create({
        email,
        userName,
        dateOfBirth,
        condition,
        hobbies,
        about,
        role,
        password,
      });
  
      // Generate JWT token
      const token = Authenticate.generateToken(user);
  
      // Return success response with token
      return res.status(201).json({
        message: 'Signup successful',
        userData: user.filterDetails(),
        token,
      });
    } catch (error) {
      return res.status(500).json({
        message: "We're sorry, we couldn't sign you up",
        error: error.message,
      });
    }
  }
  

  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const token = Authenticate.generateToken(user);

      return res.status(200).json({
        message: 'Login successful.',
        userData: user.filterDetails(),
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        message: "We're sorry, we couldn't log you in.",
        error: error.message,
      });
    }
  }

  logout(req, res) {
    res.json({ message: 'Logout successful' });
  }
}

export default new UserController();
