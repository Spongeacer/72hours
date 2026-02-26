import React from 'react';

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  return (
    <div className="bg-game-error-bg border border-game-error p-4 mb-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <p className="text-game-error font-serif">{message}</p>
        <button 
          onClick={onClose}
          className="text-game-error hover:text-white ml-4"
        >
          ×
        </button>
      </div>
    </div>
  );
};
