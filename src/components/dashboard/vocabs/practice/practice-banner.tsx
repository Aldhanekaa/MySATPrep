"use client";
import { Banner } from "@/components/ui/banner-v2";
import { MessageCircleWarningIcon } from "lucide-react";
import React, { useState, useEffect } from "react";

export function PracticeBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const bannerShown = localStorage.getItem("practice-banner");
    if (bannerShown === null || bannerShown === "false") {
      setShowBanner(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("practice-banner", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <Banner
      onClose={handleClose}
      isClosable
      variant={"default"}
      className="dark text-foreground"
    >
      <div className="w-full">
        <p className="flex items-center justify-center text-sm">
          <MessageCircleWarningIcon
            className="-mt-0.5 me-3 inline-flex opacity-60"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
          Your progress are always saved locally everytime you choose answer.
        </p>
      </div>
    </Banner>
  );
}
