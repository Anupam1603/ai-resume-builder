const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const app = express();
dotenv.config();

app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(cors());

const generateID = () => Math.random().toString(36).substring(2, 10);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 },
});

const genAI = new GoogleGenerativeAI(process.env.GKEY);

const database = [];

const GeminiFunction = async (prompt) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

app.post("/resume/create", upload.single("headshotImage"), async (req, res) => {
    const {
        fullName,
        currentPosition,
        currentLength,
        currentTechnologies,
        workHistory,
    } = req.body;

    const workArray = JSON.parse(workHistory);
    const newEntry = {
        id: generateID(),
        fullName,
        image_url: `http://localhost:4000/uploads/${req.file.filename}`,
        currentPosition,
        currentLength,
        currentTechnologies,
        workHistory: workArray,
    };

    const prompt1 = `I am writing a resume, my details are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n I write in the technologies: ${currentTechnologies}. Can you write a 100 words description for the top of the resume (first person writing)?`;

    const prompt2 = `I am writing a resume, my details are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n I write in the technologies: ${currentTechnologies}. Can you write 10 points for a resume on what I am good at?`;

    const remainderText = () => {
        let stringText = "";
        for (let i = 0; i < workArray.length; i++) {
            stringText += ` ${workArray[i].name} as a ${workArray[i].position}.`;
        }
        return stringText;
    };

    const prompt3 = `I am writing a resume, my details are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n During my years I worked at ${
        workArray.length
    } companies. ${remainderText()} \n Can you write me 50 words for each company separated in numbers of my succession in the company (in first person)?`;

    const objective = await GeminiFunction(prompt1);
    const keypoints = await GeminiFunction(prompt2);
    const jobResponsibilities = await GeminiFunction(prompt3);

    const geminiData = { objective, keypoints, jobResponsibilities };
    const data = { ...newEntry, ...geminiData };
    database.push(data);

    res.json({
        message: "Request successful!",
        data,
    });
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
