const dotenv = require("dotenv");
dotenv.config();

const bcrypt = require("bcryptjs");
const {
  PutItemCommand,
  DeleteItemCommand,
  ScanCommand,
} = require("@aws-sdk/client-dynamodb");

const dynamo = require("./config/dynamodb");
const TABLE = process.env.DYNAMODB_TABLE;

// Admin users to seed
const users = [
  {
    name: "Admin User",
    email: "admin@speshway.com",
    password: "Admin123!",
    role: "admin",
  },
  {
    name: "Super Admin",
    email: "superadmin@speshway.com",
    password: "SuperAdmin123!",
    role: "admin",
  },
  {
    name: "Administrator",
    email: "administrator@speshway.com",
    password: "Admin@2024",
    role: "admin",
  },
  {
    name: "HR Manager",
    email: "hr@speshway.com",
    password: "HrManager123!",
    role: "hr",
  },
];

// ===========================
// IMPORT USERS (Insert)
// ===========================
const importData = async () => {
  try {
    console.log("Deleting old user records...");
    await destroyOnlyUsers();

    console.log("Seeding new users...");

    for (const user of users) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const params = {
        TableName: TABLE,
        Item: {
          PK: { S: `USER#${user.email}` },
          SK: { S: `USER#${user.email}` }, // one-item entity
          name: { S: user.name },
          email: { S: user.email },
          password: { S: hashedPassword },
          role: { S: user.role },
          createdAt: { S: new Date().toISOString() },
        },
      };

      await dynamo.send(new PutItemCommand(params));
    }

    console.log("Data Imported Successfully!");
    console.log(`Admins Created: ${users.length}`);

    console.log("\nAdmin Login Credentials:");
    console.log("Email: admin@speshway.com");
    console.log("Password: Admin123!");

    process.exit();
  } catch (error) {
    console.error("Import Error:", error);
    process.exit(1);
  }
};

// ===========================
// DELETE ONLY USERS
// ===========================
const destroyOnlyUsers = async () => {
  try {
    const existingUsers = await dynamo.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: "begins_with(PK, :pk)",
        ExpressionAttributeValues: {
          ":pk": { S: "USER#" },
        },
      })
    );

    for (const item of existingUsers.Items) {
      await dynamo.send(
        new DeleteItemCommand({
          TableName: TABLE,
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        })
      );
    }

    console.log("All users removed.");
  } catch (err) {
    console.error("Destroy Error:", err);
  }
};

// ===========================
// DESTROY MODE (CLI)
// ===========================
const destroyData = async () => {
  await destroyOnlyUsers();
  process.exit();
};

// If "-d", destroy; else import
if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
