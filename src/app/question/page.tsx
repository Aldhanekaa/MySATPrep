"use client";
import * as React from "react";
import { BgGradient } from "@/components/ui/bg-gradient";
import { SiteHeader } from "../navbar";
import { useRouter } from "next/navigation";

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
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Headline */}
            <h1 className="text-5xl font-bold leading-tight">
              SAT Questionbank QuestionID Search
            </h1>

            {/* Subtitle */}
            <p className="text-md">
              Enter a question ID to search for and view specific SAT questions
              from the College Board question bank.
            </p>

            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto w-full">
              <div className="bg-blue-50 border-2 border-neutral-100 rounded-full p-3 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Enter question ID (e.g., bd9eb2b5)"
                  className="bg-transparent flex-1 outline-none text-gray-800 placeholder:text-gray-500 pl-4"
                  value={questionId}
                  onChange={(e) => setQuestionId(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  onClick={handleSearch}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 border-b-4 border-blue-700 hover:border-blue-800 active:border-b-2 active:translate-y-0.5 shadow-lg"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
