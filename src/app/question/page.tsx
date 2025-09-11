"use client";
import * as React from "react";
import { BgGradient } from "@/components/ui/bg-gradient";
import { SiteHeader } from "../navbar";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import FooterSection from "@/components/footer";

export default function QuestionSearchQueryPage() {
  const [questionId, setQuestionId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const handleSearch = () => {
    if (questionId.trim()) {
      setIsLoading(true);
      router.push(`/question/${questionId.trim()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  return (
    <>
      <style jsx>{`
        .progress-bar {
          width: 0%;
          animation: progressAnimation 2s ease-in-out infinite;
        }
        @keyframes progressAnimation {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
      <div className="min-h-screen  text-black flex flex-col relative overflow-x-hidden">
        {/* Progress Bar */}
        {isLoading && (
          <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
            <div className="h-full bg-blue-500 animate-pulse transition-all duration-300 progress-bar"></div>
          </div>
        )}

        <SiteHeader />
        {/* Gradient */}
        <BgGradient gradientTo="lab(54.1736% 13.3369 -74.6839)" />

        {/* Main Content */}
        <motion.main
          className="flex-1 flex flex-col items-center justify-center px-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="max-w-4xl mx-auto space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            {/* Headline */}
            <motion.h1
              className="text-5xl font-bold leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            >
              SAT Questionbank QuestionID Search
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              Enter a question ID to search for and view specific SAT questions
              from the College Board question bank.
            </motion.p>

            {/* Search bar */}
            <motion.div
              className="relative max-w-2xl mx-auto w-full"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
            >
              <motion.div
                className="bg-blue-50 border-2 border-neutral-100 rounded-full p-3 flex items-center gap-3"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                }}
                transition={{ duration: 0.2 }}
              >
                <motion.input
                  type="text"
                  placeholder="Enter question ID (e.g., bd9eb2b5)"
                  className="bg-transparent flex-1 outline-none text-gray-800 placeholder:text-gray-500 pl-4"
                  value={questionId}
                  onChange={(e) => setQuestionId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.button
                  onClick={handleSearch}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 border-b-4 border-blue-700 hover:border-blue-800 active:border-b-2 active:translate-y-0.5 shadow-lg"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95, y: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  Search
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.main>
      </div>
      <FooterSection />
    </>
  );
}
