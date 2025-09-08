"use client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradientBars } from "./ui/bg-bars";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface NotFoundProps {
  title?: string;
  description?: string;
}

export function Illustration(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 362 145" {...props}>
      <path
        fill="currentColor"
        d="M62.6 142c-2.133 0-3.2-1.067-3.2-3.2V118h-56c-2 0-3-1-3-3V92.8c0-1.333.4-2.733 1.2-4.2L58.2 4c.8-1.333 2.067-2 3.8-2h28c2 0 3 1 3 3v85.4h11.2c.933 0 1.733.333 2.4 1 .667.533 1 1.267 1 2.2v21.2c0 .933-.333 1.733-1 2.4-.667.533-1.467.8-2.4.8H93v20.8c0 2.133-1.067 3.2-3.2 3.2H62.6zM33 90.4h26.4V51.2L33 90.4zM181.67 144.6c-7.333 0-14.333-1.333-21-4-6.666-2.667-12.866-6.733-18.6-12.2-5.733-5.467-10.266-13-13.6-22.6-3.333-9.6-5-20.667-5-33.2 0-12.533 1.667-23.6 5-33.2 3.334-9.6 7.867-17.133 13.6-22.6 5.734-5.467 11.934-9.533 18.6-12.2 6.667-2.8 13.667-4.2 21-4.2 7.467 0 14.534 1.4 21.2 4.2 6.667 2.667 12.8 6.733 18.4 12.2 5.734 5.467 10.267 13 13.6 22.6 3.334 9.6 5 20.667 5 33.2 0 12.533-1.666 23.6-5 33.2-3.333 9.6-7.866 17.133-13.6 22.6-5.6 5.467-11.733 9.533-18.4 12.2-6.666 2.667-13.733 4-21.2 4zm0-31c9.067 0 15.6-3.733 19.6-11.2 4.134-7.6 6.2-17.533 6.2-29.8s-2.066-22.2-6.2-29.8c-4.133-7.6-10.666-11.4-19.6-11.4-8.933 0-15.466 3.8-19.6 11.4-4 7.6-6 17.533-6 29.8s2 22.2 6 29.8c4.134 7.467 10.667 11.2 19.6 11.2zM316.116 142c-2.134 0-3.2-1.067-3.2-3.2V118h-56c-2 0-3-1-3-3V92.8c0-1.333.4-2.733 1.2-4.2l56.6-84.6c.8-1.333 2.066-2 3.8-2h28c2 0 3 1 3 3v85.4h11.2c.933 0 1.733.333 2.4 1 .666.533 1 1.267 1 2.2v21.2c0 .933-.334 1.733-1 2.4-.667.533-1.467.8-2.4.8h-11.2v20.8c0 2.133-1.067 3.2-3.2 3.2h-27.2zm-29.6-51.6h26.4V51.2l-26.4 39.2z"
      />
    </svg>
  );
}

export function NotFound({
  title = "Page not found",
  description = "Lost, this page is. In another system, it may be.",
}: NotFoundProps) {
  const [questionId, setQuestionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = () => {
    if (questionId.trim()) {
      setIsLoading(true);
      const toastId = toast.loading("Searching for question...", {
        id: "question-search",
      });

      // Navigate to the question page
      router.push(`/question/${questionId.trim()}`);

      // Dismiss the toast after a short delay
      setTimeout(() => {
        toast.dismiss(toastId);
        setIsLoading(false);
      }, 1500);
    } else {
      toast.error("Please enter a question ID");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      {/* Progress Bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <div className="h-full bg-blue-500 animate-pulse transition-all duration-300 progress-bar"></div>
        </div>
      )}
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
      <div className="relative text-center z-20 pt-52">
        <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight text-primary sm:text-7xl">
          {title}
        </h1>
        <p className="mt-6 text-pretty text-lg font-medium text-muted-foreground sm:text-xl/8">
          {description}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-y-3 sm:space-x-2 mx-auto sm:max-w-sm">
          <div className="relative w-full">
            <Input
              placeholder="Enter Question ID"
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-4 bg-white border-2 border-blue-300 border-b-4 border-b-blue-500 rounded-xl h-12 text-slate-700 placeholder:text-slate-500 shadow-none focus-visible:border-blue-400 focus-visible:border-b-blue-600 focus-visible:ring-0 hover:border-blue-400 hover:border-b-blue-600 transition-colors"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            variant="outline"
            className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-400 border-b-4 border-b-blue-700 rounded-xl h-12 px-6 shadow-none active:border-b-2 active:translate-y-0.5 transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-y-3 gap-x-6">
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            className="group bg-slate-200 hover:bg-slate-300 text-slate-700 border-2 border-slate-300 border-b-4 border-b-slate-400 rounded-xl h-12 shadow-none active:border-b-2 active:translate-y-0.5 transition-all duration-75"
          >
            <ArrowLeft
              className="me-2 ms-0 opacity-60 transition-transform group-hover:-translate-x-0.5"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Go back
          </Button>
          <Button
            className="-order-1 sm:order-none bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-400 border-b-4 border-b-blue-700 rounded-xl h-12 shadow-none active:border-b-2 active:translate-y-0.5 transition-all duration-75"
            onClick={() => router.push("/")}
          >
            Take me home
          </Button>
        </div>
      </div>
    </>
  );
}

export default function QuestionNotFound() {
  return (
    <div className="relative flex flex-col w-full justify-center min-h-svh bg-background p-6 md:p-10">
      <GradientBars
        colors={["lab(54.1736% 13.3369 -74.6839)", "transparent"]}
      />
      <div className="relative max-w-5xl mx-auto w-full">
        <Illustration className="absolute inset-0 z-10 w-full h-[50vh] opacity-[0.04] dark:opacity-[0.03] text-foreground" />
        <NotFound
          title="Question not found"
          description="Uh oh, we are unable to find the question you are looking for."
        />
      </div>
    </div>
  );
}
