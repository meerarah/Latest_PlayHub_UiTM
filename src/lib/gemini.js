import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'placeholder_key';
const genAI = new GoogleGenerativeAI(apiKey);

export const getSportsRecommendation = async (userPreferences, userAvailability) => {
  if (apiKey === 'placeholder_key') {
     return "AI recommendations will appear here once the Gemini API key is configured. (Placeholder: We recommend trying out Badminton or Futsal based on your preferences!)";
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Based on the following student details, recommend 2-3 suitable sports from typical university facility sports (e.g. Badminton, Futsal, Basketball, Volleyball, Table Tennis).
Preferences/Skill: ${userPreferences}
Availability: ${userAvailability}
Format the output as a friendly, engaging, and brief recommendation for a student.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Oops! We encountered an issue fetching your recommendations. Please try again later.";
  }
};
