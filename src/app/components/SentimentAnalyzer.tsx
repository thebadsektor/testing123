"use client";

import React, { useState } from "react";
import { DataFrame, DataRow, CustomDataFrame } from "../../types/Dataframe";
import { analyzeSentimentRuleBased } from "../utils/sentimentAnalysis"; // Import the new function
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import the Gemini API
import { GoogleAIResponse } from "@/types/GoogleAIResponse";
import LLMTagging from "./LLMTagging"; // Import the LLMTagging component
import CircularProgress from "@mui/material/CircularProgress"; // Import CircularProgress for spinner
import { DataGrid, GridPaginationModel } from '@mui/x-data-grid'; // Import DataGrid and GridPaginationModel
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // Import the Play icon

interface SentimentAnalyzerProps {
  dataFrame: DataFrame | null;
}

const SentimentAnalyzer: React.FC<SentimentAnalyzerProps> = ({ dataFrame }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [updatedDataFrame, setUpdatedDataFrame] = useState<DataFrame | null>(
    null
  );
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>(
    "sentiment-rule-based"
  );
  const [isLLMTaggingVisible, setIsLLMTaggingVisible] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  const analyzeSentiment = async () => {
    console.log("Starting sentiment analysis...");

    if (!dataFrame || !dataFrame.rows || !selectedColumn) {
      console.log("DataFrame or selectedColumn is not defined.");
      return;
    }

    setIsLoading(true);
    setUpdatedDataFrame(null);
    setIsLLMTaggingVisible(false);
    console.log("DataFrame rows:", dataFrame.rows);
    console.log("Selected column for sentiment analysis:", selectedColumn);

    try {
      const newRows = await Promise.all(
        dataFrame.rows.map(async (row: DataRow) => {
          console.log("Analyzing row:", row);

          let sentimentResult;

          // Check the selected mode
          if (selectedMode === "sentiment-rule-based") {
            sentimentResult = analyzeSentimentRuleBased(
              String(row[selectedColumn])
            );
          } else if (selectedMode === "HuggingFace API") {
            const response = await fetch(
              "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ inputs: row[selectedColumn] }),
              }
            );

            const result = await response.json();
            const positiveScore = result[0].score; // Assuming this is the positive score
            let normalizedScore;
            let label = "Neutral";

            if (positiveScore > 0.5) {
              normalizedScore = positiveScore; // Use the score directly
              label = "Positive";
            } else if (positiveScore <= 0.5 && positiveScore > 0) {
              normalizedScore = positiveScore; // Treat as positive but close to neutral
              label = "Neutral";
            } else {
              normalizedScore = 1 - positiveScore; // Derive negative score
              label = "Negative";
            }

            sentimentResult = {
              label,
              score: normalizedScore,
            };
          } else if (selectedMode === "Gemini") {
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; // Ensure you have the API key
            if (!apiKey) {
              throw new Error("API key for Google Gemini is not defined.");
            }
            const geminiAI = new GoogleGenerativeAI(apiKey);
            const model = geminiAI.getGenerativeModel({
              model: "gemini-1.5-flash",
            });

            const geminiResponse: GoogleAIResponse =
              await model.generateContent(
                `Analyze the sentiment of: ${row[selectedColumn]}`
              );
            const geminiText = geminiResponse.response.text();

            // Simulate scoring based on the response
            let normalizedScore;
            let label = "Neutral";

            // Example logic to determine sentiment from the response
            if (geminiText.includes("positive")) {
              normalizedScore = 0.75; // Example score for positive sentiment
              label = "Positive";
            } else if (geminiText.includes("negative")) {
              normalizedScore = 0.25; // Example score for negative sentiment
              label = "Negative";
            } else {
              normalizedScore = 0.5; // Neutral sentiment
            }

            sentimentResult = {
              label,
              score: normalizedScore,
            };
          }

          // Debugging: Log the sentimentResult
          console.log("Sentiment Result:", sentimentResult);

          return {
            ...row,
            sentiment: sentimentResult?.label || "Unknown", // Fallback to 'Unknown'
            sentimentScore: sentimentResult?.score || 0, // Fallback to 0
          };
        })
      );

      console.log("New rows with sentiment:", newRows);
      // Set the entire newRows instead of slicing
      setUpdatedDataFrame(new CustomDataFrame(
        [...dataFrame.columns, "sentiment", "sentimentScore"], // Columns
        newRows // Rows
      ));
      setIsLLMTaggingVisible(true);
    } catch (error) {
      console.error("Error during sentiment analysis:", error);
    } finally {
      setIsLoading(false);
      console.log("Sentiment analysis completed.");
    }
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2 text-center">
        Sentiment Insights and Analysis
      </h3>
      <p className="text-gray-600 text-center">
      Gain insights into sentiment trends and patterns by analyzing the records in your dataset. Select a column and mode to begin.
      </p>

      {dataFrame && (
        <>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">
              Choose a Column for Sentiment Analysis
            </h3>
            {dataFrame.columns.map((column) => (
              <div key={column}>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sentimentColumn"
                    value={column}
                    className="mr-2"
                    onChange={() => setSelectedColumn(column)}
                  />
                  {column}
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-2">
              Pick an Analysis Method
            </h4>
            <div className="flex flex-col">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sentimentMode"
                  value="sentiment-rule-based"
                  className="mr-2"
                  defaultChecked
                  onChange={() => setSelectedMode("sentiment-rule-based")}
                />
                Rule-Based Sentiment Analysis
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sentimentMode"
                  value="HuggingFace API"
                  className="mr-2"
                  onChange={() => setSelectedMode("HuggingFace API")}
                />
                HuggingFace Sentiment API
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sentimentMode"
                  value="Gemini"
                  className="mr-2"
                  onChange={() => setSelectedMode("Gemini")}
                />
                Gemini AI Sentiment Analysis
              </label>
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <button
              onClick={analyzeSentiment}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
              disabled={isLoading || !selectedColumn}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} className="mr-2" />{" "}
                  {/* Spinner */}
                  Performing Sentiment Analysis...
                </>
              ) : (
                <>
                  <PlayArrowIcon className="mr-2" />
                  Start Sentiment Analysis
                </>
              )}
            </button>
          </div>
        </>
      )}

      {updatedDataFrame && (
        <>
          <h3 className="text-lg font-semibold mb-2 text-center mt-8">
            Sentiment Analysis Results
          </h3>
          <p className="text-gray-600 text-center">
          Below are the results of the sentiment analysis for the selected column. Use pagination to explore the data.
          </p>
          <div style={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={updatedDataFrame.rows}
              columns={updatedDataFrame.columns.map((col) => ({
                field: col,
                headerName: col,
                width: 150,
              }))}
              pagination
              paginationModel={paginationModel} // Set the pagination model
              onPaginationModelChange={setPaginationModel} // Handle pagination changes
              pageSizeOptions={[5, 10, 25]} // Pagination options
              loading={false}
            />
          </div>
          <div className="mt-8">
            {isLLMTaggingVisible && (
              <LLMTagging
                data={updatedDataFrame.rows}
                selectedColumn={selectedColumn}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SentimentAnalyzer;
