import React from 'react';
import ReactMarkdown from 'react-markdown';
import './markdownStyle.css';

interface LLMMarkdownProps {
    content: string; // Prop to accept markdown content
}

const LLMMarkdown: React.FC<LLMMarkdownProps> = ({ content }) => {
    return (
        <div className="markdown-container w-full h-full" style={{ padding: '20px', overflowY: 'auto' }}>
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
};

export default LLMMarkdown;