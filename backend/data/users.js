const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const users = [
  {
    id: uuidv4(),
    name: 'Admin User',
    email: 'admin@speshway.com',
    password: bcrypt.hashSync('Admin123!', 10),
    role: 'admin',
  },
  {
    id: uuidv4(),
    name: 'Super Admin',
    email: 'superadmin@speshway.com',
    password: bcrypt.hashSync('SuperAdmin123!', 10),
    role: 'admin',
  },
  {
    id: uuidv4(),
    name: 'Administrator',
    email: 'administrator@speshway.com',
    password: bcrypt.hashSync('Admin@2024', 10),
    role: 'admin',
  },
  {
    id: uuidv4(),
    name: 'HR Manager',
    email: 'hr@speshway.com',
    password: bcrypt.hashSync('HrManager123!', 10),
    role: 'hr',
  },
];

module.exports = users;
