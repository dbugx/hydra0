import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FileNode } from "../types";

const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const MODEL_NAME = 'gemini-2.5-flash';

export const analyzeProject = async (files: FileNode[]): Promise<string> => {
  try {
    const ai = getClient();
    const fileSummaries = files.map(f => 
      `File: ${f.name}\nContent Snippet: ${f.content.slice(0, 500)}...`
    ).join('\n---\n');

    const prompt = `
      Analyze the following project structure and file contents. 
      Provide a concise summary of what this application does, its tech stack, and 3 potential improvements.
      Return the response in Markdown.
      
      Project Files:
      ${fileSummaries}
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "Failed to analyze project. Ensure API Key is valid.";
  }
};

export const generateRefactorCode = async (
  filename: string, 
  code: string, 
  instruction: string
): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      You are an expert senior software engineer.
      
      Filename: ${filename}
      Current Code:
      \`\`\`
      ${code}
      \`\`\`
      
      Instruction: ${instruction}
      
      Output ONLY the updated code for the file. Do not include markdown backticks or explanations around the code unless requested.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || code;
  } catch (error) {
    console.error("Gemini Refactor Failed:", error);
    return code; // Return original on failure
  }
};

export const streamChatResponse = async function* (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  contextFiles: FileNode[]
) {
  try {
    const ai = getClient();
    
    // Build a context-aware system instruction
    const fileContext = contextFiles.map(f => `${f.name}:\n${f.content}`).join('\n\n');
    const systemInstruction = `
      You are Hydra, an intelligent coding assistant. 
      You are helping a user build and refactor an application.
      
      Current Project Context:
      ${fileContext.slice(0, 20000)} 
      // Truncated context to avoid token limits in this demo, 
      // ideally would use caching or RAG.
    `;

    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of result) {
      yield chunk.text || '';
    }
  } catch (error) {
    console.error("Chat Error:", error);
    yield "Error communicating with Hydra Agent.";
  }
};