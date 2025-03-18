import React, { useState } from "react";
import { DataFrame } from "@/types/Dataframe";
import DonutChart from "./data-viz/DonutChart";
import TimeSeriesChart from "./data-viz/TimeSeriesChart";
import LLMMarkdown from "./data-viz/LLMMarkdown";
import { GoogleAIResponse } from "@/types/GoogleAIResponse";
import GeminiAPI from "./GeminiAPI";
import BarChartIcon from '@mui/icons-material/BarChart';

interface ExecutiveSummarizerProps {
  dataFrame: DataFrame;
}

interface SentimentAISummary {
  markdownContent: string; // AI-generated content in markdown format
}

interface SentimentCounts {
  Total: number;
  Positive: number;
  Neutral: number;
  Negative: number;
}

interface SentimentTrend {
  period: string;
  Positive: number;
  Neutral: number;
  Negative: number;
}

export default function ExecutiveSummarizer({
  dataFrame,
}: ExecutiveSummarizerProps) {
  const [summaryResult, setSummaryResult] = useState<{
    sentimentCounts?: SentimentCounts;
    sentimentTrends?: SentimentTrend[];
  } | null>(null);

  const [aiSummary, setAiSummary] = useState<SentimentAISummary | null>(null);

  const handleGenerateSummary = (dataFrame: DataFrame) => {
    // Validate the input DataFrame
    if (!dataFrame || !dataFrame.isValid() || dataFrame.getRowCount() === 0) {
      console.error("Invalid DataFrame or no data available to summarize.");
      return;
    }

    // Generate sentiment counts
    const sentimentCounts = generateSentimentCounts(dataFrame);

    // Generate sentiment trends
    const sentimentTrends = generateSentimentTrends();

    // Set the summary result
    setSummaryResult({
      sentimentCounts,
      sentimentTrends,
    });

  };

  const generateSentimentCounts = (dataFrame: DataFrame): SentimentCounts => {
    // Calculate sentiment counts
    return {
      Total: dataFrame.rows.length,
      Positive: dataFrame.rows.filter((row) => row["sentiment"] === "Positive")
        .length,
      Neutral: dataFrame.rows.filter((row) => row["sentiment"] === "Neutral")
        .length,
      Negative: dataFrame.rows.filter((row) => row["sentiment"] === "Negative")
        .length,
    };
  };

  const generateSentimentTrends = (): SentimentTrend[] => {
    // Placeholder data for trends
    return [
      { period: "Q1", Positive: 10, Neutral: 5, Negative: 3 },
      { period: "Q2", Positive: 15, Neutral: 7, Negative: 5 },
      { period: "Q3", Positive: 12, Neutral: 6, Negative: 4 },
      { period: "Q4", Positive: 18, Neutral: 9, Negative: 6 },
    ];
  };

  const handleLLMResult = (result: GoogleAIResponse) => {
    const markdownContent = result.response.text(); // Adjust based on the actual structure
    setAiSummary({ markdownContent }); // Set the AI summary with the markdown content
  };

  const generateLLMPrompt = (): string => {
    if (!summaryResult?.sentimentCounts || !summaryResult?.sentimentTrends) {
      console.error("Sentiment counts or trends are missing.");
      return "";
    }

    // Extract feedback and names from the dataFrame (assuming third column is feedback and first column is names)
    const feedbackEntries = dataFrame.rows.map((row) => {
      const name = row[dataFrame.columns[0]]; // Assuming the first column contains names
      const feedback = row[dataFrame.columns[2]]; // Assuming the third column contains feedback
      return { name, feedback };
    });

    // Format feedback entries with names and quotes
    const formattedFeedbacks = feedbackEntries
      .map((entry) => {
        if (entry.name && entry.feedback) {
          return `**${entry.name}**: "${entry.feedback}"`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n");

    return `
        ### Sentiment Analysis and Organizational Insights

        **Aggregated Sentiment Analysis Data:**

        #### Overall Sentiment Counts (aggregated across all reviews):
        \`\`\`json
        ${JSON.stringify(summaryResult.sentimentCounts, null, 2)}
        \`\`\`

        #### Quarterly Sentiment Trends (tracking changes in sentiment over time):
        \`\`\`json
        ${JSON.stringify(summaryResult.sentimentTrends, null, 2)}
        \`\`\`

        ---

        ### Employee Feedback Highlights

        Here are some key feedback quotes from employees:

        ${formattedFeedbacks}

        ---

        ### Instructions

        Analyze the above sentiment analysis data and feedback to provide organizational insights and actionable recommendations. Focus on the following:

        1. **Summarize Overall Sentiment Breakdown:**
        - Highlight the implications of the sentiment counts for the organization.

        2. **Analyze Quarterly Sentiment Trends:**
        - Identify significant changes or patterns, such as shifts in employee morale or performance perceptions.

        3. **Provide Strategic Recommendations:**
        - **Enhancing employee development initiatives** based on feedback.
        - **Improving positive sentiment** across reviews.
        - **Addressing and mitigating negative sentiment trends**.
        - **Improving the performance review process** to better align with employee expectations and organizational goals.

        4. **Quote Relevant Feedback:**
        - Use specific names and quotes from the feedback provided where appropriate to illustrate points.

        5. **Markdown Formatting:**
        - Use **bold** for key names or phrases.
        - Use bullet points or numbered lists for clarity.
        - Highlight actionable recommendations clearly.

        ### Deliverable

        Provide a structured response focusing on actionable insights to improve overall organizational performance and employee morale, while ensuring the recommendations are generalized and not employee-specific.
    `;
  };

  return (
    <>
      <h3 className="text-lg font-semibold mb-2 mt-16 text-center">
        Executive Summary Generator
      </h3>
      <p className="text-gray-600 text-center">
        Gain actionable insights from employee feedback and sentiment analysis.
        Use this tool to identify patterns and make informed decisions.
      </p>

      <div className="flex justify-center mt-4">
        <button
          onClick={() => handleGenerateSummary(dataFrame)}
          className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          <BarChartIcon className="mr-2" />
          Generate Sentiment Statistics
        </button>
      </div>

      {summaryResult?.sentimentCounts && (
        <>
          <div className="flex flex-col gap-4 mt-10">
            <h1 className="text-2xl font-bold">
              Sentiment Statistics Overview
            </h1>
            <p className="text-gray-600">
              Review the aggregated sentiment counts, providing a clear snapshot
              of positive, neutral, and negative feedback across the dataset.
            </p>
          </div>
          <div className="mt-4">
            <div className="flex gap-4">
              <div
                className="flex items-center justify-center bg-gray-100 rounded-md"
                style={{ minWidth: 400, minHeight: 400 }}
              >
                <DonutChart
                  counts={[
                    summaryResult.sentimentCounts.Positive || 0,
                    summaryResult.sentimentCounts.Neutral || 0,
                    summaryResult.sentimentCounts.Negative || 0,
                  ]}
                  dataCount={summaryResult.sentimentCounts.Total || 0}
                />
              </div>
              <div
                className="flex-1 bg-gray-100 p-4 rounded-md"
                style={{ maxHeight: 400 }}
              >
                <p className="flex text-center text-lg font-bold">
                  Sentiment Trend
                </p>
                <div className="flex items-center justify-center h-full w-full">
                  <TimeSeriesChart
                    style={{ width: "100%", height: "90%" }}
                    data={summaryResult.sentimentTrends || []}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-center bg-gray-100 p-4 rounded-md mt-4">
              {!aiSummary ? (
                <>
                  <div className="flex h-full" style={{ minHeight: "400px" }}>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 mt-16 text-center">
                        Generate Insights
                      </h3>
                      <p className="text-gray-600 text-center">
                        Leverage AI to generate a comprehensive summary of your data, providing
                        actionable insights to enhance workplace strategies and
                        foster growth.
                      </p>
                      <div className="flex flex-col items-center justify-center min-h-40 gap-4">
                        <GeminiAPI
                          inputData={generateLLMPrompt()}
                          onResult={handleLLMResult}
                          buttonLabel="Generate Insights"
                          loadingLabel="Generating Insights..."
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full" style={{ minHeight: "400px" }}>
                  <div className="flex-1 bg-gray-100 p-4 rounded-md">
                    <h1 className="text-2xl font-bold">
                      Performance Insights and Actionable Feedback
                    </h1>
                    <p className="text-gray-600">
                      Get key feedback themes, sentiment patterns, and
                      actionable insights to enhance workplace strategies and
                      foster growth.
                    </p>
                    <LLMMarkdown content={aiSummary.markdownContent} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
