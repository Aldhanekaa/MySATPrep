"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { playSound } from "@/lib/playSound";
import { Calculator, PyramidIcon } from "lucide-react";
import { DraggableReferencePopup } from "../popups/reference-popup";
import { DraggableDesmosPopup } from "../popups/desmos-popup";

export default function ButtonsGroup() {
  // Reference popup state
  const [isReferencePopupOpen, setIsReferencePopupOpen] =
    useState<boolean>(false);

  // Desmos popup state
  const [isDesmosPopupOpen, setIsDesmosPopupOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-wrap items-center justify-start gap-2 mt-4">
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
