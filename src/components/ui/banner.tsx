"use client";

import { type HTMLAttributes, useCallback, useEffect, useState } from "react";
import { AlertCircleIcon, Terminal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * @defaultValue 'normal'
   */
  variant?: "rainbow" | "normal";
  /**
   * @defaultValue true
   */
  changeLayout?: boolean;
  /**
   * Banner message
   */
  message?: string;
  /**
   * @defaultValue '3rem'
   */
  height?: string;
}

export function Banner({
  id,
  variant = "normal",
  changeLayout = true,
  message,
  height = "3rem",
  ...props
}: BannerProps): React.ReactElement {
  const [open, setOpen] = useState(true);
  const [alertOpen, setAlertOpen] = useState(true);
  const globalKey = id ? `banner-${id}` : undefined;
  const alertKey = "global-outage-alert-dismissed";

  useEffect(() => {
    if (globalKey) setOpen(localStorage.getItem(globalKey) !== "true");
    setAlertOpen(localStorage.getItem(alertKey) !== "true");
  }, [globalKey, alertKey]);

  const onClick = useCallback(() => {
    setOpen(false);
    if (globalKey) localStorage.setItem(globalKey, "true");
  }, [globalKey]);

  const onAlertClose = useCallback(() => {
    setAlertOpen(false);
    localStorage.setItem(alertKey, "true");
  }, [alertKey]);

  return (
    <>
      {alertOpen && (
        <Alert
          variant="default"
          className="fixed z-20 left-5 bottom-5 max-w-md text-yellow-600"
        >
          <AlertCircleIcon />
          <AlertTitle>Global Outage Is Ongoing</AlertTitle>
          <AlertDescription>
            Some features may be unavailable due to the ongoing global outage.
          </AlertDescription>
          <button
            type="button"
            aria-label="Close Alert"
            onClick={onAlertClose}
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "sm",
              }),
              "absolute top-2 right-2 h-6 w-6 p-0 text-yellow-600 hover:text-yellow-700"
            )}
          >
            <X className="h-3 w-3" />
          </button>
        </Alert>
      )}
      <div className="fixed w-full">
        <div className="w-full relative">
          <div
            id={id}
            {...props}
            style={{ height: open ? height : "0" }}
            className={cn(
              "absolute w-[100vw] top-0 z-40 flex flex-row items-center justify-center bg-secondary px-4 text-center text-sm font-medium transition-all duration-300",
              variant === "rainbow" && "bg-background",
              !open && "hidden",
              props.className
            )}
          >
            {changeLayout && open ? (
              <style>{`
          :root:not(.${
            globalKey ?? "banner-never"
          }) { --banner-height: ${height}; }
          `}</style>
            ) : null}
            {globalKey ? (
              <style>{`.${globalKey} #${id} { display: none; }`}</style>
            ) : null}
            {id ? (
              <script
                dangerouslySetInnerHTML={{
                  __html: `if (localStorage.getItem('${globalKey}') === 'true') document.documentElement.classList.add('${globalKey}');`,
                }}
              />
            ) : null}

            {variant === "rainbow" ? <RainbowLayer /> : null}
            {message || props.children}
            {id ? (
              <button
                type="button"
                aria-label="Close Banner"
                onClick={onClick}
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                    className:
                      "absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground",
                    size: "icon",
                  })
                )}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

const RainbowLayer = () => {
  return (
    <>
      <div className="absolute inset-0 z-[-1] warning-banner-gradient-1" />
      <div className="absolute inset-0 z-[-1] warning-banner-gradient-2" />
    </>
  );
};
