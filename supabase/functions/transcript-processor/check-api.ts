// @ts-nocheck - Deno syntax not compatible with standard TypeScript
/**
 * Script to test OpenAI API connectivity
 * Run with: deno run --allow-env --allow-net check-api.ts
 */

import { OpenAI } from "npm:openai@4.29.0";

const apiKey = Deno.env.get("OPENAI_API_KEY");

if (!apiKey) {
  console.error("Error: OPENAI_API_KEY environment variable not set");
  console.log("Please set this variable before running the test");
  Deno.exit(1);
}

console.log("Testing OpenAI API connection...");

const openai = new OpenAI({
  apiKey,
});

async function testApi() {
  try {
    // Make a simple API call to verify connectivity
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "This is a test message to verify API connectivity." }
      ],
      max_tokens: 10
    });

    console.log("✅ Successfully connected to OpenAI API");
    console.log(`Response: "${response.choices[0]?.message.content?.trim()}"`);
    console.log("The transcript processor should be able to process audio correctly");
  } catch (error) {
    console.error("❌ Failed to connect to OpenAI API:");
    console.error(error.message || "Unknown error");
    
    if (error.message?.includes("auth")) {
      console.log("\nThis looks like an authentication error. Please check your API key.");
    }
    
    if (error.message?.includes("rate limit")) {
      console.log("\nYou've hit a rate limit. Please try again later.");
    }
    
    Deno.exit(1);
  }
}

await testApi(); 