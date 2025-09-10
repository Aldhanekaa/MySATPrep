"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { playSound } from "@/lib/playSound";
import { ArrowRight, Calculator, PyramidIcon } from "lucide-react";
import { DraggableReferencePopup } from "../popups/reference-popup";
import { DraggableDesmosPopup } from "../popups/desmos-popup";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export default function ButtonsGroup({ assessment }: { assessment: string }) {
  const router = useRouter();
  // Reference popup state
  const [isReferencePopupOpen, setIsReferencePopupOpen] =
    useState<boolean>(false);

  // Desmos popup state
  const [isDesmosPopupOpen, setIsDesmosPopupOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-wrap items-center justify-start gap-2 mt-4">
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              className="flex group cursor-pointer items-center gap-1 md:gap-2 font-bold py-2 md:py-3 px-3 md:px-6 rounded-xl md:rounded-2xl border-b-4 shadow-md hover:shadow-lg transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white border-blue-700 hover:border-blue-800 text-xs md:text-sm"
              onClick={() => {
                playSound("button-pressed.wav");
                router.push("/review?" + new URLSearchParams({ assessment }));
              }}
            >
              <span className="font-medium sm:inline">Start Reviewing</span>

              <div className=" text-blue-50 group-hover:text-blue-100 size-6 overflow-hidden rounded-full duration-500">
                <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                  <span className="flex size-6">
                    <ArrowRight className="m-auto size-3" />
                  </span>
                  <span className="flex size-6">
                    <ArrowRight className="m-auto size-3" />
                  </span>
                </div>
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Start a personalized practice session!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button
        variant="default"
        className="flex group cursor-pointer items-center gap-1 md:gap-2 font-bold py-2 md:py-3 px-3 md:px-6 rounded-xl md:rounded-2xl border-b-4 shadow-md hover:shadow-lg transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400 text-xs md:text-sm"
        onClick={() => {
          playSound("button-pressed.wav");
          setIsReferencePopupOpen(
            (isReferencePopupOpen) => !isReferencePopupOpen
          );
        }}
      >
        <PyramidIcon className="w-3 h-3 md:w-4 md:h-4 group-hover:rotate-12 duration-300" />
        <span className="font-medium hidden sm:inline">Reference</span>
      </Button>
      <Button
        variant="default"
        className="flex group cursor-pointer items-center gap-1 md:gap-2 font-bold py-2 md:py-3 px-3 md:px-6 rounded-xl md:rounded-2xl border-b-4 shadow-md hover:shadow-lg transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 bg-blue-500 hover:bg-blue-600 text-white border-blue-700 hover:border-blue-800 text-xs md:text-sm"
        onClick={() => {
          playSound("button-pressed.wav");
          setIsDesmosPopupOpen((isDesmosPopupOpen) => !isDesmosPopupOpen);
        }}
      >
        <Calculator className="w-3 h-3 md:w-4 md:h-4 group-hover:rotate-12 duration-300" />
        <span className="font-medium hidden sm:inline">Calculator</span>
      </Button>

      {/* Reference Popup */}
      <DraggableReferencePopup
        isOpen={isReferencePopupOpen}
        onClose={() => setIsReferencePopupOpen(false)}
      />

      {/* Desmos Popup */}

      <DraggableDesmosPopup
        isOpen={isDesmosPopupOpen}
        onClose={() => setIsDesmosPopupOpen(false)}
      />
    </div>
  );
}
