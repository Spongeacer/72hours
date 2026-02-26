import React from 'react';
import { motion } from 'framer-motion';
import { Choice } from '../../types';

interface ChoicePanelProps {
  choices: Choice[];
  onSelect: (choice: Choice) => void;
}

export const ChoicePanel: React.FC<ChoicePanelProps> = ({ choices, onSelect }) => {
  return (
    <div className="game-panel">
      <h3 className="text-game-muted mb-4 text-center">选择你的行动</h3>
      
      <div className="space-y-3">
        {choices.map((choice, index) => (
          <motion.button
            key={choice.id}
            className={`choice-btn ${choice.isHidden ? 'hidden-choice' : ''}`}
            onClick={() => onSelect(choice)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-start gap-3">
              <span className="text-game-muted mt-1">
                {String.fromCharCode(65 + index)}.
              </span>
              <span>{choice.text}</span>
              {choice.isHidden && (
                <span className="ml-auto text-game-dim text-sm">[隐藏]</span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
