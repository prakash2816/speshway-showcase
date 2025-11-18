const jwt = require('jsonwebtoken');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = process.env.USERS_TABLE; // "Users"

// Middleware: Protect Routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DynamoDB
      const params = {
        TableName: USERS_TABLE,
        Key: { id: decoded.id }
      };

      const { Item } = await docClient.send(new GetCommand(params));

      if (!Item) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Remove password before attaching
      const { password, ...userData } = Item;
      req.user = userData;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware: Optional Token (User may or may not be logged in)
const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const params = {
        TableName: USERS_TABLE,
        Key: { id: decoded.id }
      };

      const { Item } = await docClient.send(new GetCommand(params));

      if (Item) {
        const { password, ...userData } = Item;
        req.user = userData;
      } else {
        req.user = undefined;
      }
    } catch (error) {
      req.user = undefined;
    }
  }

  next();
};

// Middleware: Admin Only
const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'hr')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, optionalProtect, admin };
