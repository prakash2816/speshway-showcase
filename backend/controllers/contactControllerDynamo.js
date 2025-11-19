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
// Submit Contact / Resume
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
// Get All Submissions
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
// Export only the needed items
// ------------------------------------------------------------
module.exports = {
  uploadDynamo,          // used in routes as uploadDynamo.single('resume')
  submitContactDynamo,
  getSubmissionsDynamo
};
