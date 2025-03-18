import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white bg-opacity-80">
      <p className="text-lg font-semibold mb-4">Loading...</p>
      <div className="loader"></div>
      <style jsx>{`
        .loader {
          border: 8px solid rgba(0, 0, 0, 0.3);
          border-left-color: #000000;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Spinner; 