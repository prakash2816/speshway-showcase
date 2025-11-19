const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const path = require("path");
const { v4: uuid } = require("uuid");
const sendEmail = require("../utils/email");

// AWS Clients
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.AWS_S3_BUCKET;

// Multer in-memory storage
const uploadDynamo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    const allowed = /pdf|doc|docx/.test(path.extname(file.originalname).toLowerCase());
    if (!allowed) return cb(new Error("Only PDF, DOC, DOCX allowed"));
    cb(null, true);
  }
});

// DynamoDB table
const TABLE = process.env.AWS_DYNAMO_CONTACT_TABLE || "ContactTable";

// ------------------------------------------------------------
// ✅ Submit Contact / Resume
// ------------------------------------------------------------
const submitContactDynamo = async (req, res) => {
  try {
    const { name, email, phone, subject, message, type } = req.body;

    if (!email || !name || !subject) {
      return res.status(400).json({ success: false, message: "Name, email & subject required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    let resumeData = null;

    if (req.file) {
      const key = `resumes/${Date.now()}-${req.file.originalname}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype
        })
      );
      resumeData = {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        key,
        url: `https://${BUCKET}.s3.amazonaws.com/${key}`
      };
    }

    const id = uuid();

    const item = {
      id,
      name,
      email: email.toLowerCase(),
      phone: phone || "",
      subject,
      message: message || "",
      type: type || "contact",
      resume: resumeData,
      status: "pending",
      replies: [],
      createdAt: Date.now()
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));

    if (type === "resume" && resumeData) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New Job Application: ${subject}`,
        html: `<h2>New Resume Submission</h2>
               <p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>`,
        attachments: []
      });
    }

    res.status(201).json({ success: true, message: "Submission saved successfully", data: item });
  } catch (error) {
    console.error("Contact submit error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------------------------------------------
// ✅ Get All Submissions
// ------------------------------------------------------------
const getSubmissionsDynamo = async (req, res) => {
  try {
    const { Items } = await ddb.send(new ScanCommand({ TableName: TABLE }));
    Items.sort((a, b) => b.createdAt - a.createdAt);
    res.json({ success: true, count: Items.length, data: Items });
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------------------------------------------
// ✅ Get Single Submission
// ------------------------------------------------------------
const getSubmission = async (req, res) => {
  try {
    const { Item } = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id: req.params.id } }));
    if (!Item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: Item });
  } catch (error) {
    console.error("Get submission error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------------------------------------------
// ✅ Update Submission Status
// ------------------------------------------------------------
const updateSubmissionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id: req.params.id },
        UpdateExpression: "set #s = :s",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": status },
        ReturnValues: "ALL_NEW"
      })
    );
    res.json({ success: true, message: "Status updated", data: result.Attributes });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------------------------------------------
// ✅ Reply to Submission
// ------------------------------------------------------------
const replyToSubmission = async (req, res) => {
  try {
    const { message } = req.body;
    const replyObj = { id: uuid(), message, repliedBy: req.user?.name || "Admin", repliedAt: Date.now() };

    const result = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id: req.params.id },
        UpdateExpression: "SET replies = list_append(if_not_exists(replies, :empty), :r), #s = :replied",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":r": [replyObj], ":empty": [], ":replied": "replied" },
        ReturnValues: "ALL_NEW"
      })
    );

    res.json({ success: true, message: "Reply added", data: result.Attributes });
  } catch (error) {
    console.error("Reply error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------------------------------------------
// ✅ Delete Submission
// ------------------------------------------------------------
const deleteSubmission = async (req, res) => {
  try {
    await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { id: req.params.id } }));
    res.json({ success: true, message: "Submission deleted" });
  } catch (error) {
    console.error("Delete submission error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------
module.exports = {
  upload,
  submitContactDynamo,
  getSubmissionsDynamo,
  getSubmission,
  updateSubmissionStatus,
  replyToSubmission,
  deleteSubmission,
};
