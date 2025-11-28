import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  console.log("Checking available models for your key...");

  try {
    // We use the REST API to list models because it's the most reliable method
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.models) {
      console.log("\n✅ AVAILABLE MODELS:");
      console.log("-----------------------");
      data.models.forEach(m => {
        // We only care about models that support 'generateContent'
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
          console.log(m.name.replace("models/", ""));
        }
      });
      console.log("-----------------------");
      console.log("Copy one of the names above into your code.");
    } else {
      console.error("❌ Could not list models. Response:", data);
    }
  } catch (error) {
    console.error("❌ Error fetching models:", error.message);
  }
}

listModels();