export interface GoogleAIResponse {
    response: {
      text: () => string; // Assuming the response has a text method
    };
  }