const jwt = require('jsonwebtoken');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = process.env.USERS_TABLE; // "Users"

// Middleware: Protect Routes
const protect = async (req, res, next) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      const token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { Item } = await docClient.send(
        new GetCommand({ TableName: USERS_TABLE, Key: { id: decoded.id } })
      );

      if (!Item) return res.status(401).json({ message: 'User not found' });

      const { password, ...userData } = Item;
      req.user = userData;

      return next();
    }

    res.status(401).json({ message: 'Not authorized, no token' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Middleware: Optional Token
const optionalProtect = async (req, res, next) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      const token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { Item } = await docClient.send(
        new GetCommand({ TableName: USERS_TABLE, Key: { id: decoded.id } })
      );

      if (Item) {
        const { password, ...userData } = Item;
        req.user = userData;
      } else {
        req.user = undefined;
      }
    }
  } catch (error) {
    req.user = undefined;
  }

  next();
};

// Middleware: Admin Only
const admin = (req, res, next) => {
  if (req.user && ['admin', 'hr'].includes(req.user.role)) {
    return next();
  }
  res.status(401).json({ message: 'Not authorized as an admin' });
};

module.exports = { protect, optionalProtect, admin };
