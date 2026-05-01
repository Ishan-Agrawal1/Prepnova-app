require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const OpenAI = require("openai");

const connectDB = require("./config/db");
const Analysis = require("./models/analysis");

const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const aptitudeRoutes = require("./routes/aptitudeRoutes");
const codingRoutes = require("./routes/codingRoutes");
const recordsRoutes = require("./routes/recordsRoutes");

const app = express();
const PORT = process.env.PORT || 3001;
const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
let dbConnected = false;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer();

const extractResumeText = async (file) => {
  const ext = (file.originalname.split(".").pop() || "").toLowerCase();
  const tryPlainText = () => {
    const text = file.buffer.toString("utf8");
    return text && text.trim() ? text : undefined;
  };

  if (file.mimetype === "application/pdf" || ext === "pdf") {
    try {
      const data = await pdfParse(file.buffer);
      return data.text;
    } catch (error) {
      console.error("PDF parse failed:", error.message || error);
      return tryPlainText();
    }
  }

  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    } catch (error) {
      console.error("DOCX parse failed:", error.message || error);
      return tryPlainText();
    }
  }

  if (ext === "doc") {
    return undefined;
  }

  return tryPlainText();
};

const safeJsonParse = (raw) => {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    return null;
  }
};

const heuristicResumeAnalysis = (text) => {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \u00A0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const lower = normalized.toLowerCase();
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const bulletCount = (normalized.match(/^[\-\*•]\s+/gm) || []).length;
  const actionVerbCount = (lower.match(/\b(led|managed|developed|designed|implemented|created|built|launched|improved|optimized|reduced|increased|achieved|delivered)\b/g) || []).length;
  const skillCount = (lower.match(/\b(java(script)?|python|react|vue|angular|node|express|docker|kubernetes|aws|azure|gcp|sql|nosql|typescript|html|css|rest|graphql|git)\b/g) || []).length;

  const hasContact = /(@|linkedin\.com|github\.com|portfolio|www\.|email\b|phone\b|tel:)/i.test(text);
  const hasSummary = /(professional summary|summary|profile|about me|career objective|objective)/i.test(lower);
  const hasExperience = /(experience|professional experience|work history|employment)/i.test(lower);
  const hasEducation = /(education|academic|degree|university|college|school|graduation)/i.test(lower);
  const hasSkills = /(skills|technical skills|programming languages|tools|technologies)/i.test(lower);
  const hasProjects = /(project(s)?|selected projects|project experience|portfolio)/i.test(lower);
  const hasAchievements = /\b(achieved|implemented|delivered|reduced|increased|optimized|built|launched|designed|led|improved|created|developed)\b/i.test(lower);
  const hasQuantifiedImpact = /\b(\d+%|\$[\d,]+|\d+k|\d+ years?|\d+ months?)\b/i.test(lower);

  let score = 45;
  score += hasContact ? 11 : -8;
  score += hasSummary ? 8 : -6;
  score += hasExperience ? 12 : -12;
  score += hasEducation ? 5 : -4;
  score += hasSkills ? 10 : -8;
  score += hasProjects ? 6 : -4;
  score += hasAchievements ? 5 : -2;
  score += hasQuantifiedImpact ? 8 : -6;
  score += wordCount >= 300 ? 5 : -7;
  score += bulletCount >= 5 ? 4 : 0;
  score += actionVerbCount >= 5 ? 4 : actionVerbCount >= 3 ? 2 : 0;
  score += skillCount >= 5 ? 4 : skillCount >= 3 ? 2 : 0;
  score = Math.round(Math.min(100, Math.max(25, score)));

  const strengths = [];
  const weaknesses = [];
  const improvements = [];

  if (hasContact) strengths.push("Contact information is visible and professional");
  if (hasSummary) strengths.push("Resume includes a clear summary or profile section");
  if (hasExperience) strengths.push("Experience section is present and clearly labeled");
  if (hasSkills) strengths.push("Technical skills are highlighted in a dedicated section");
  if (hasProjects) strengths.push("Projects or accomplishments are included");
  if (hasQuantifiedImpact) strengths.push("Resume uses measurable results to show impact");
  if (bulletCount >= 5) strengths.push("Bullet points improve readability and structure");

  if (!hasContact) weaknesses.push("Missing or unclear contact information");
  if (!hasSummary) weaknesses.push("No concise professional summary or profile statement");
  if (!hasExperience) weaknesses.push("Experience or work history section is too limited");
  if (!hasSkills) weaknesses.push("Technical skills section is weak or absent");
  if (!hasProjects) weaknesses.push("Project examples or accomplishments are not emphasized enough");
  if (!hasQuantifiedImpact) weaknesses.push("Impact statements lack measurable results");
  if (wordCount < 250) weaknesses.push("Resume appears brief and may miss important detail");

  if (!hasContact) improvements.push("Add email, phone, and LinkedIn/GitHub links in your contact section.");
  if (!hasSummary) improvements.push("Add a short professional summary that highlights your experience and career goals.");
  if (!hasSkills) improvements.push("Add a dedicated skills section with tools, languages, and frameworks you use.");
  if (!hasExperience) improvements.push("Expand your experience section with specific roles and responsibilities.");
  if (!hasProjects) improvements.push("Include 2-3 relevant projects with your contributions and outcomes.");
  if (!hasQuantifiedImpact) improvements.push("Add metrics or numbers to show the business impact of your work.");
  if (actionVerbCount < 5 && hasExperience) improvements.push("Use stronger action verbs like led, built, designed, or improved in your experience bullets.");
  if (bulletCount < 4 && hasExperience) improvements.push("Use bullet points in your experience section for easier reading.");
  if (wordCount < 300) improvements.push("Add more detail about your key roles and achievements to strengthen the resume.");

  const summary = hasExperience
    ? "Resume shows relevant experience, but it can improve with clearer achievement statements, stronger metrics, and a more structured skills section."
    : "Resume has a strong starting point, but it needs a clearer experience section, a dedicated skills list, and more measurable accomplishments.";

  return {
    score,
    summary,
    strengths: strengths.length ? strengths : ["Resume includes a solid base to build on."],
    weaknesses: weaknesses.length ? weaknesses : ["Add more detail to strengthen the resume structure and impact."],
    improvements: improvements.length ? improvements : ["Review the resume for clarity, section labels, and measurable results."],
  };
};

const analyzeResumeWithAI = async (text) => {
  if (!openaiClient) return null;

  const sample = text.length > 5000 ? `${text.slice(0, 5000)}\n\n[TRUNCATED]` : text;

  const response = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are an expert resume reviewer for technology careers. Provide concise, actionable feedback in JSON only.",
      },
      {
        role: "user",
        content: `Analyze the resume text below and return only valid JSON with keys: score (integer 0-100), summary (1-2 sentence assessment), strengths (array of 3-5 concise strings), weaknesses (array of 3-5 concise strings), improvements (array of 3-5 clear action items). Resume text:\n\n${sample}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 700,
  });

  const raw = response?.choices?.[0]?.message?.content || "";
  return safeJsonParse(raw);
};

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/aptitude", aptitudeRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api", recordsRoutes);

// Resume upload route
app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // Validate file type
    const allowedMimes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const ext = (req.file.originalname.split(".").pop() || "").toLowerCase();
    if (!allowedMimes.includes(req.file.mimetype) && !["pdf", "docx"].includes(ext)) {
      return res.status(400).json({ success: false, error: "Only PDF and DOCX files are supported" });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({ success: false, error: "File size must be less than 10MB" });
    }

    const userEmail = req.body.userEmail || "guest@example.com";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail) && userEmail !== "guest@example.com") {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    let resumeText;

    try {
      resumeText = await extractResumeText(req.file);
    } catch (ex) {
      console.error("Resume extraction failed:", ex.message || ex);
      return res.status(400).json({
        success: false,
        error:
          "Could not extract text from the uploaded resume. Please upload a PDF or DOCX file.",
      });
    }

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({
        success: false,
        error:
          "Could not extract text from the uploaded resume. Please upload a PDF or DOCX file.",
      });
    }

    const fallbackResult = heuristicResumeAnalysis(resumeText);
    let result = fallbackResult;

    if (openaiClient) {
      try {
        const aiResult = await analyzeResumeWithAI(resumeText);
        if (aiResult && typeof aiResult.score === "number") {
          result = {
            score: Math.round(Math.min(100, Math.max(0, aiResult.score))),
            summary: aiResult.summary || fallbackResult.summary,
            strengths: Array.isArray(aiResult.strengths)
              ? aiResult.strengths
              : fallbackResult.strengths,
            weaknesses: Array.isArray(aiResult.weaknesses)
              ? aiResult.weaknesses
              : fallbackResult.weaknesses,
            improvements: Array.isArray(aiResult.improvements)
              ? aiResult.improvements
              : fallbackResult.improvements,
          };
        }
      } catch (openAiError) {
        console.error("OpenAI analysis failed:", openAiError.message || openAiError);
      }
    }

    let saved = null;
    if (dbConnected) {
      try {
        saved = await Analysis.create({
          userEmail: userEmail.toLowerCase(),
          fileName: req.file.originalname,
          score: result.score,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          improvements: result.improvements,
          summary: result.summary,
        });
      } catch (saveError) {
        console.error("Failed to save analysis:", saveError.message || saveError);
      }
    }

    const responsePayload = {
      success: true,
      message: "Resume analyzed",
      data: { result },
    };

    if (saved) {
      responsePayload.id = saved._id;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, error: "Analysis failed" });
  }
});

// Get analyses by query or path email
app.get("/analyses", async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res
      .status(400)
      .json({ error: "Email query parameter is required" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const analyses = await Analysis.find({
      userEmail: email.toLowerCase(),
    }).sort({ createdAt: -1 });

    res.json({ data: analyses });
  } catch (error) {
    console.error("Fetch analyses error:", error);
    res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

app.get("/analyses/:email", async (req, res) => {
  try {
    const email = req.params.email;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const analyses = await Analysis.find({
      userEmail: email.toLowerCase(),
    }).sort({ createdAt: -1 });

    res.json({ data: analyses });
  } catch (error) {
    console.error("Fetch analyses error:", error);
    res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// Start server
async function startServer() {
  try {
    await connectDB();
    dbConnected = true;
  } catch (error) {
    console.error("Database connection warning: server will still start but persistence is disabled.", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!dbConnected) {
      console.log("Warning: MongoDB is unavailable. Resume analysis will still run, but results cannot be saved.");
    }
  });
}

startServer();