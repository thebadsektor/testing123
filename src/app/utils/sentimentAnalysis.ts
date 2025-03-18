import Sentiment from 'sentiment';

const sentiment = new Sentiment();

const MAX_POSITIVE_SCORE = 5; // Adjust based on your sentiment library's scoring
const MAX_NEGATIVE_SCORE = 5; // Adjust based on your sentiment library's scoring

export const analyzeSentimentRuleBased = (text: string) => {
  const result = sentiment.analyze(text);
  const score = result.score;

  let normalizedScore;
  let label = 'Neutral';

  if (score > 0) {
    // Positive sentiment
    normalizedScore = 0.5 + (score / MAX_POSITIVE_SCORE) * 0.5;
    label = 'Positive';
  } else if (score < 0) {
    // Negative sentiment
    normalizedScore = 0.5 - (Math.abs(score) / MAX_NEGATIVE_SCORE) * 0.5;
    label = 'Negative';
  } else {
    // Neutral sentiment
    normalizedScore = 0.5;
  }

  return {
    label,
    score: normalizedScore,
  };
}; 