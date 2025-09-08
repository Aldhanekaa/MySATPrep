import React from "react";
import clsx from "clsx";

interface ProjectBannerProps {
  variant?: "success" | "warning" | "error";
  label: React.ReactNode;
  icon?: React.ReactNode;
  callToAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export const ProjectBanner = ({
  variant = "success",
  label,
  icon,
  callToAction,
}: ProjectBannerProps) => {
  return (
    <aside
      className={clsx(
        "flex z-30 gap-x-2 justify-center items-center py-2 border-y min-h-10 translate-y-[-1px] text-sm font-sans",
        variant === "success" &&
          "text-blue-900 fill-blue-900 bg-blue-100 border-blue-400",
        variant === "warning" &&
          "text-amber-900 fill-amber-900 bg-amber-100 border-amber-400",
        variant === "error" &&
          "text-red-900 fill-red-900 bg-red-100 border-red-400"
      )}
    >
      <div className="flex flex-col gap-2 px-6 w-full md:justify-center md:flex-row md:items-center">
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4">{icon}</div>
          <div>{label}</div>
        </div>
        {callToAction && (
          <div className="ml-6 md:ml-0">
            {callToAction.href && (
              <a
                href={callToAction.href}
                className={clsx(
                  "font-medium underline underline-offset-[5px] duration-100",
                  variant === "success" &&
                    "text-blue-1000 decoration-blue-400 hover:text-blue-900 hover:decoration-blue-500",
                  variant === "warning" &&
                    "text-amber-1000 decoration-amber-400 hover:text-amber-900 hover:decoration-amber-500",
                  variant === "error" &&
                    "text-red-1000 decoration-red-400 hover:text-red-900 hover:decoration-red-500"
                )}
              >
                {callToAction.label}
              </a>
            )}
            {callToAction.onClick && (
              <div
                onClick={callToAction.onClick}
                className={clsx(
                  "font-medium underline underline-offset-[5px] duration-100 cursor-pointer",
                  variant === "success" &&
                    "text-blue-1000 decoration-blue-400 hover:text-blue-900 hover:decoration-blue-500",
                  variant === "warning" &&
                    "text-amber-1000 decoration-amber-400 hover:text-amber-900 hover:decoration-amber-500",
                  variant === "error" &&
                    "text-red-1000 decoration-red-400 hover:text-red-900 hover:decoration-red-500"
                )}
              >
                {callToAction.label}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
