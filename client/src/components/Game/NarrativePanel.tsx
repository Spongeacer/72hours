import React from 'react';
import { motion } from 'framer-motion';

interface NarrativePanelProps {
  narrative: string;
  result?: string | null;
}

export const NarrativePanel: React.FC<NarrativePanelProps> = ({ 
  narrative, 
  result 
}) => {
  return (
    <motion.div 
      className="narrative-text"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {narrative}
      
      {result && (
        <motion.div 
          className="mt-6 pt-6 border-t border-game-border text-game-accent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {result}
        </motion.div>
      )}
    </motion.div>
  );
};
