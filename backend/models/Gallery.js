// gallery.dynamodb.js
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = "Gallery";

// Create a new gallery item
exports.createGallery = async (data) => {
  const id = uuidv4();
  const timestamp = Date.now();

  const item = {
    PK: `gallery#${id}`,
    SK: "meta",

    // Gallery fields
    id,
    title: data.title,
    description: data.description,

    image: {
      url: data.image.url,
      publicId: data.image.publicId,
    },

    category: data.category,
    date: data.date || timestamp,
    location: data.location || "",
    readMoreLink: data.readMoreLink || "",
    isActive: data.isActive ?? true,
    order: data.order || timestamp,

    createdBy: data.createdBy,
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

// Get gallery item by ID
exports.getGalleryById = async (id) => {
  const result = await dynamodb
    .get({
      TableName: TABLE_NAME,
      Key: {
        PK: `gallery#${id}`,
        SK: "meta",
      },
    })
    .promise();

  return result.Item;
};

// Update gallery item
exports.updateGallery = async (id, updates) => {
  const timestamp = Date.now();

  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `gallery#${id}`,
      SK: "meta",
    },
    UpdateExpression: `
      set 
        title = :title,
        description = :description,
        image = :image,
        category = :category,
        date = :date,
        location = :location,
        readMoreLink = :readMoreLink,
        isActive = :isActive,
        #order = :order,
        updatedAt = :updatedAt
    `,
    ExpressionAttributeNames: {
      "#order": "order",
    },
    ExpressionAttributeValues: {
      ":title": updates.title,
      ":description": updates.description,
      ":image": updates.image,
      ":category": updates.category,
      ":date": updates.date || timestamp,
      ":location": updates.location || "",
      ":readMoreLink": updates.readMoreLink || "",
      ":isActive": updates.isActive,
      ":order": updates.order || timestamp,
      ":updatedAt": timestamp,
    },
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamodb.update(params).promise();
  return result.Attributes;
};

// Delete gallery item
exports.deleteGallery = async (id) => {
  await dynamodb
    .delete({
      TableName: TABLE_NAME,
      Key: {
        PK: `gallery#${id}`,
        SK: "meta",
      },
    })
    .promise();

  return { message: "Gallery item deleted successfully" };
};
