import React from "react";
import { motion } from "framer-motion";

export const LoadingFallback = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-100">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <motion.div
          className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Loading text with animation */}
        <motion.div
          className="flex items-center space-x-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-gray-700 text-lg font-medium">Loading</span>
          <motion.div
            className="flex space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-1 h-1 bg-gray-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Optional description */}
        <motion.p
          className="text-gray-500 text-sm text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Preparing your question bank experience...
        </motion.p>
      </div>
    </div>
  );
};

// Alternative minimal loading component
export const MinimalLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-100">
      <motion.div
        className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};
