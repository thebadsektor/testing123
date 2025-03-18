import React, { useState } from 'react';
import { CircularProgress } from '@mui/material';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIResponse } from '../../types/GoogleAIResponse';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface GeminiAPIProps {
  inputData: string; // This will be the prompt for the AI
  onResult: (result: GoogleAIResponse) => void; // Use the new type here
  buttonLabel: string; // Custom button label
  loadingLabel: string; // Custom loading label
}

const GeminiAPI = ({ inputData, onResult, buttonLabel, loadingLabel }: GeminiAPIProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [gptResponse, setGptResponse] = useState('');

  const generateContentWithGoogleAI = async () => {
    setIsLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is not defined');
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result: GoogleAIResponse = await model.generateContent(inputData);
      setGptResponse(result.response.text());
      onResult(result);
    } catch (error) {
      console.error('Error generating content with Google AI:', error);
      setGptResponse('An error occurred while generating content.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={generateContentWithGoogleAI}
        disabled={isLoading}
        className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
      >
        {isLoading ? (
          <>
            <CircularProgress size={24} className="mr-2" />
            {loadingLabel}
          </>
        ) : (
          <>
            <AutoAwesomeIcon className="mr-2" />
            {buttonLabel}
          </>
        )}
      </button>
      {gptResponse && (
        <div className="mt-4">
          <h4 className="font-semibold">Google AI Response:</h4>
          <p>{gptResponse}</p>
        </div>
      )}
    </div>
  );
};

export default GeminiAPI;
