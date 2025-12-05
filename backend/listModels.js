import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log("Full API response:");
    console.log(JSON.stringify(data, null, 2));

    if (!data.models) {
        console.log("\n❌ No 'models' field found. API returned an error.\n");
        return;
    }

    console.log("\nAvailable Models:");
    data.models.forEach(model => {
        console.log(`- ${model.name}`);
    });
}

listModels().catch(console.error);
