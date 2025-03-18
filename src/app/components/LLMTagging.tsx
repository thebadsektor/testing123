import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TagsInput } from 'react-tag-input-component';
import CircularProgress from '@mui/material/CircularProgress';
import Papa from 'papaparse';
import ExecutiveSummarizer from "./ExecutiveSummarizer";
import { CustomDataFrame } from '../../types/Dataframe'; // Import CustomDataFrame
import HorizontalStackedBarGraph from './data-viz/HorizontalStackedBarGraph';
import React from 'react';
import { DataGrid } from '@mui/x-data-grid'; // Import DataGrid
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // Import the Play icon


// Define a new type for tagging results
type TaggingResult = {
    tags: string[];
};

// Define a type for the expected structure of each row
interface DataRow {
    [key: string]: string | number | boolean; // Added boolean to the type
}

interface LLMTaggingProps {
    data: DataRow[]; // Use the new DataRow type
    selectedColumn: string | null; // New prop for the selected column
}

export default function LLMTagging({ data, selectedColumn }: LLMTaggingProps) {
    const [taggingResult, setTaggingResult] = useState<TaggingResult | null>({
        tags: [
            "Accomplishments",
            "Areas for Development",
            "Team Dynamics",
            "Innovation and Creativity",
            "Leadership and Initiative",
            "Zero Tolerance"
        ]
    });

    const [promptPreview, setPromptPreview] = useState<string>('');
    const [updatedData, setUpdatedData] = useState<DataRow[]>(data); // State to hold updated data
    const [isTaggingDone, setIsTaggingDone] = useState<boolean>(false); // State to track tagging completion
    const [newData, setNewData] = useState<DataRow[]>([]); // State for new data
    const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state for tagging
    const [tagCounts, setTagCounts] = useState<{ [key: string]: { positive: number; neutral: number; negative: number } }>({});

    // Initialize the Gemini model
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; // Ensure you have the API key
    if (!apiKey) {
        throw new Error('API key for Google Gemini is not defined.'); // Handle the case where the API key is not set
    }
    const geminiAI = new GoogleGenerativeAI(apiKey);
    const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Generate prompt aligned with Function Schema
    const generatePrompt = (tags: string[]) => {
        if (tags.length === 0) {
            return "No tags provided. Please enter tags to generate the prompt.";
        }

        const tagsList = tags.map(tag => `"${tag}"`).join(', ');
        return `Categorize the given employee feedback into the following categories: ${tagsList}. 
            Return the result as a JSON object where each category is a key and its value is a boolean indicating whether the feedback is relevant to that category.`;
    };

    // Handle when tags are updated
    const handleTagsChange = (tags: string[]) => {
        setTaggingResult({ tags });
        const newPrompt = generatePrompt(tags); // Generate prompt from the latest tags
        setPromptPreview(newPrompt); // Update the prompt preview immediately
    };

    // Handle the button click to run LLM tagging
    const handleRunTagging = async () => {
        if (!selectedColumn) {
            console.error("Selected column is null. Cannot run tagging.");
            return;
        }
    
        setIsLoading(true); // Set loading state to true
        console.log("Selected Column:", selectedColumn);
        console.log("Available Columns in Data:", Object.keys(updatedData[0] || {}));
    
        // Append tags as new headers to the updatedData
        const newHeaders = taggingResult?.tags || [];
        const tempData = updatedData.map(row => {
            const updatedRow = { ...row };
            newHeaders.forEach(tag => {
                if (!(tag in updatedRow)) {
                    updatedRow[tag] = false; // Ensure all tags are initialized for every row
                }
            });
            return updatedRow;
        });
    
        const feedbackColumn = tempData
            .map(row => row[selectedColumn])
            .filter((feedback): feedback is string => feedback !== undefined && feedback !== null)
            .map(String);
    
        console.log("Feedback Column:", feedbackColumn);
    
        const responses = await Promise.all(
            feedbackColumn.map(async feedback => {
                const prompt = generatePrompt(taggingResult?.tags || []);
                console.log("Generated Prompt:", prompt);
    
                const geminiResponse = await model.generateContent(
                    `Categorize the feedback: "${feedback}" based on the following categories: ${prompt}`
                );
                console.log("Gemini Response:", geminiResponse);
    
                return geminiResponse.response.text(); // Assuming the response is in the expected format
            })
        );
    
        console.log("Responses from Gemini:", responses);
    
        // Process the JSON response and append boolean values to their respective headers
        const processedData = tempData.map((row, index) => {
            const cleanedResponse = responses[index].replace(/```json|```/g, "").trim(); // Remove code block delimiters
            console.log("Cleaned Response:", cleanedResponse); // Debugging log for cleaned response
    
            try {
                const parsedResponse = JSON.parse(cleanedResponse); // Parse the cleaned response
    
                // Validate the response structure
                const expectedKeys = taggingResult?.tags || [];
                const isValidResponse = expectedKeys.every(key => key in parsedResponse);
    
                if (isValidResponse) {
                    Object.keys(parsedResponse).forEach(tag => {
                        if (row) {
                            row[tag] = parsedResponse[tag]; // Set the boolean value
                        }
                    });
                } else {
                    console.warn("Invalid response structure:", parsedResponse); // Log invalid structure
                }
            } catch (error) {
                console.error("Error parsing JSON:", error); // Log any JSON parsing errors
                console.error("Original Response:", responses[index]); // Log the original response for debugging
            }
    
            return row;
        });
    
        setNewData(processedData); // Update the state with the new data
        setUpdatedData(processedData); // Update the original data state
        setIsTaggingDone(true); // Mark tagging as done
        setIsLoading(false); // Reset loading state
    };
    
    // Log updated newData when it changes
    useEffect(() => {
        if (newData.length > 0) {
            console.log("Updated Data with Tags:", newData);
        }
    }, [newData]);
    

    const handleDownload = () => {
        const csv = Papa.unparse(newData); // Convert the newData to CSV format
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'tagged_data.csv'); // Set the filename for the download
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Clean up
    };

    // Function to process newData and count tags based on sentiment
    const processTagCounts = () => {
        if (!newData || newData.length === 0) return;
    
        const tags = taggingResult?.tags || [];
        const counts: { [key: string]: { positive: number; neutral: number; negative: number } } = {};
    
        tags.forEach(tag => {
            counts[tag] = { positive: 0, neutral: 0, negative: 0 };
        });
    
        newData.forEach(row => {
            tags.forEach(tag => {
                if (row[tag] === true) {
                    const sentiment = row.sentiment;
    
                    if (sentiment === "Positive") {
                        counts[tag].positive += 1;
                    } else if (sentiment === "Neutral") {
                        counts[tag].neutral += 1;
                    } else if (sentiment === "Negative") {
                        counts[tag].negative += 1;
                    }
                }
            });
        });
    
        console.log("Processed Counts:", counts); // Debugging log for counts
        setTagCounts(counts);
    };    

    // Call the function where appropriate, e.g., after tagging is done
    useEffect(() => {
        if (isTaggingDone) {
            processTagCounts(); // Process and print tag counts when tagging is done
        }
    }, [isTaggingDone]);

    return (
        <>
        <h3 className="text-lg font-semibold mb-2 text-center">AI-Enhanced Data Tagging</h3>
        <p className="text-gray-600 text-center mb-4">
            Leverage AI to categorize and enhance your dataset with meaningful tags, providing deeper insights into your data.
        </p>
        <div className="mb-4 mt-8 w-full">
            <h3 className="text-lg font-semibold mb-2">Define Tags for Data Categorization</h3>
            <p className="text-gray-600 mb-2">
                Add or modify tags to classify your data more effectively. Tags help identify and group related feedback.
            </p>
            <div style={{ width: '100%' }}>
                <TagsInput
                    value={taggingResult?.tags || []}
                    onChange={handleTagsChange} // Use the new handler
                    name="tags"
                    placeHolder="Enter tags"
                    onKeyUp={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                        }
                    }}
                />
            </div>
            <em>Enter tags and press Enter or Comma to add</em>
        </div>

        <div className="w-full mt-4">
            <h3 className="text-lg font-semibold mb-2 text-center">Generated Prompt Preview</h3>
            <p className="text-gray-600 text-center">
                View the prompt generated by the AI for data categorization.
            </p>
            <div className="bg-gray-100 border rounded p-4 text-sm text-gray-700">
                {promptPreview || "Start adding tags to preview the generated prompt."}
            </div>
        </div>

        <div className="flex justify-center mt-4">
            <button
                className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
                onClick={handleRunTagging} // Attach the click handler
                disabled={isLoading} // Disable button while loading
            >
                {isLoading ? (
                    <>
                        <CircularProgress size={24} className="mr-2" /> {/* Spinner */}
                        AI Tagging in Progress...
                    </>
                ) : (
                    <>
                        <PlayArrowIcon className="mr-2" /> {/* Add the Play icon */}
                        Start LLM Tagging
                    </>
                )}
            </button>
        </div>

        {/* Display the first 5 rows of updated data only if tagging is done */}
        {isTaggingDone && (
            <>
                <h3 className="text-lg font-semibold mb-2 mt-8 text-left w-full text-center">Tagged Data Overview</h3>
                <p className="text-gray-600 text-center">
                Explore the first few rows of your enhanced data with applied tags. Use this preview to validate results before exporting.
                </p>
                <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                        rows={newData.slice(0, 5)} // Display only the first 5 rows
                        columns={Object.keys(newData[0] || {}).map((key) => ({
                            field: key,
                            headerName: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize the header
                            width: 150, // Set a default width
                        }))}
                        pagination
                        paginationModel={{ pageSize: 5, page: 0 }} // Use paginationModel for pagination
                        disableRowSelectionOnClick
                    />
                </div>

                {/* Download Button */}
                <div className="flex justify-end mt-4 w-full">
                    <a
                        onClick={handleDownload}
                        className="text-blue-500 hover:text-blue-600 cursor-pointer underline mr-16"
                    >
                        Download Tagged Data as CSV
                    </a>
                </div>
                    <h3 className="text-lg font-semibold mt-8 mb-2 text-center">Tag Sentiment Analysis</h3>
                    <p className="text-gray-600 text-center">
                    Analyze sentiment trends across tags using the visual representation below. This highlights the distribution of positive, neutral, and negative sentiments.
                    </p>
                <div className="flex justify-center bg-gray-100 p-4 rounded-md mt-4 w-full">
                    <HorizontalStackedBarGraph
                        tagCounts={tagCounts} // Pass the calculated tag counts
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>

                {/* Add ExecutiveSummarizer with the tagged data */}
                <ExecutiveSummarizer dataFrame={new CustomDataFrame(Object.keys(newData[0] || {}), newData)} />
            </>
        )}
        </>
    );
}
