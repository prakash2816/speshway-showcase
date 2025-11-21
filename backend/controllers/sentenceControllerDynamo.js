const { v4: uuidv4 } = require("uuid");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = "Sentences";

// ============================================================================
// GET ALL SENTENCES
// ============================================================================
const getSentences = async (req, res) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
    const sentences = (result.Items || []).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.json(sentences);
  } catch (error) {
    console.error("Get sentences error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================================
// GET SINGLE SENTENCE
// ============================================================================
const getSentence = async (req, res) => {
  try {
    const result = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { id: req.params.id } })
    );

    if (!result.Item) {
      return res.status(404).json({ message: "Sentence not found" });
    }

    res.json(result.Item);
  } catch (error) {
    console.error("Get sentence error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================================
// CREATE SENTENCE
// ============================================================================
const createSentence = async (req, res) => {
  try {
    if (!req.body.text) {
      return res.status(400).json({ message: "Text field is required" });
    }

    const id = uuidv4();
    const timestamp = req.body.timestamp || new Date().toISOString();

    const newSentence = {
      id,
      text: req.body.text,
      url: req.body.url || "",
      userAgent: req.headers["user-agent"] || "",
      timestamp
    };

    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: newSentence }));

    res.status(201).json(newSentence);
  } catch (error) {
    console.error("Create sentence error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ============================================================================
// UPDATE SENTENCE
// ============================================================================
const updateSentence = async (req, res) => {
  try {
    const existing = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { id: req.params.id } })
    );

    if (!existing.Item) {
      return res.status(404).json({ message: "Sentence not found" });
    }

    const updatedData = {
      text: req.body.text ?? existing.Item.text,
      url: req.body.url ?? existing.Item.url,
      userAgent: req.body.userAgent ?? existing.Item.userAgent,
      timestamp: req.body.timestamp ?? existing.Item.timestamp
    };

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: req.params.id },
        UpdateExpression: "SET text = :t, url = :u, userAgent = :a, timestamp = :ts",
        ExpressionAttributeValues: {
          ":t": updatedData.text,
          ":u": updatedData.url,
          ":a": updatedData.userAgent,
          ":ts": updatedData.timestamp
        },
        ReturnValues: "ALL_NEW"
      })
    );

    res.json({ id: req.params.id, ...updatedData });
  } catch (error) {
    console.error("Update sentence error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ============================================================================
// DELETE SENTENCE
// ============================================================================
const deleteSentence = async (req, res) => {
  try {
    const existing = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { id: req.params.id } })
    );

    if (!existing.Item) {
      return res.status(404).json({ message: "Sentence not found" });
    }

    await ddb.send(
      new DeleteCommand({ TableName: TABLE_NAME, Key: { id: req.params.id } })
    );

    res.json({ message: "Sentence removed" });
  } catch (error) {
    console.error("Delete sentence error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSentences,
  getSentence,
  createSentence,
  updateSentence,
  deleteSentence
};
