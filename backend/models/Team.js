// team.dynamodb.js
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Team";

/**
 * Create Team Member
 */
exports.createTeamMember = async (data) => {
  const id = uuidv4();
  const timestamp = Date.now();

  const item = {
    PK: `team#${id}`,
    SK: "meta",

    id,
    name: data.name,
    role: data.role,
    bio: data.bio,

    color: data.color || "from-purple-500 to-pink-500",
    linkedin: data.linkedin || "",
    email: data.email || "",

    image: {
      url: data.image?.url || "",
      publicId: data.image?.publicId || "",
    },

    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamodb
    .put({
      TableName: TABLE_NAME,
      Item: item,
    })
    .promise();

  return item;
};

/**
 * Get Team Member By ID
 */
exports.getTeamMemberById = async (id) => {
  const result = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: {
        PK: `team#${id}`,
        SK: "meta",
      },
    })
    .promise();

  return result.Item;
};

/**
 * Get All Team Members
 */
exports.getAllTeamMembers = async () => {
  const result = await dynamodb
    .scan({
      TableName: TABLE_NAME,
    })
    .promise();

  return result.Items;
};

/**
 * Update Team Member
 */
exports.updateTeamMember = async (id, data) => {
  const existing = await exports.getTeamMemberById(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...data,
    image: {
      url: data.image?.url || existing.image.url,
      publicId: data.image?.publicId || existing.image.publicId,
    },
    updatedAt: Date.now(),
  };

  await dynamodb
    .put({
      TableName: TABLE_NAME,
      Item: updated,
    })
    .promise();

  return updated;
};

/**
 * Delete Team Member
 */
exports.deleteTeamMember = async (id) => {
  await dynamodb
    .delete({
      TableName: TABLE_NAME,
      Key: {
        PK: `team#${id}`,
        SK: "meta",
      },
    })
    .promise();

  return { message: "Team member deleted successfully" };
};
