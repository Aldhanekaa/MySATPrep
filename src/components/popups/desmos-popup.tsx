"use client";
import { X, GripHorizontal } from "lucide-react";
import React, { useEffect, useReducer, useRef } from "react";
import { Button } from "@/components/ui/button";
import { popupInitialState, popupReducer } from ".";

// Draggable Desmos Popup Component
interface DraggableDesmosPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DraggableDesmosPopup({
  isOpen,
  onClose,
}: DraggableDesmosPopupProps) {
  const [popupState, dispatchPopup] = useReducer(popupReducer, {
    ...popupInitialState,
    size: { width: 600, height: 400 }, // Larger default size for Desmos
  });
  const popupRef = useRef<HTMLDivElement>(null);

  // Ensure initial position is within window bounds
  useEffect(() => {
    if (isOpen) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Responsive default sizes for Desmos popup
      let defaultWidth = 800;
      let defaultHeight = 600;

      if (windowWidth < 640) {
        // Mobile (sm breakpoint)
        defaultWidth = Math.min(windowWidth - 20, 380);
        defaultHeight = Math.min(windowHeight - 80, 400);
      } else if (windowWidth < 1024) {
        // Tablet (lg breakpoint)
        defaultWidth = Math.min(windowWidth - 60, 600);
        defaultHeight = Math.min(windowHeight - 100, 500);
      }

      // Update size if it's the initial default size
      if (popupState.size.width === 800 && popupState.size.height === 600) {
        dispatchPopup({
          type: "SET_SIZE",
          payload: { width: defaultWidth, height: defaultHeight },
        });
      }

      const maxX = windowWidth - popupState.size.width;
      const maxY = windowHeight - popupState.size.height;

      const newPosition = {
        x: Math.max(0, Math.min(maxX, popupState.position.x)),
        y: Math.max(0, Math.min(maxY, popupState.position.y)),
      };

      if (
        newPosition.x !== popupState.position.x ||
        newPosition.y !== popupState.position.y
      ) {
        dispatchPopup({ type: "SET_POSITION", payload: newPosition });
      }
    }
  }, [
    isOpen,
    popupState.size.width,
    popupState.size.height,
    popupState.position,
  ]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (popupState.isDragging) {
        const newPosition = {
          x: e.clientX - popupState.dragStart.x,
          y: e.clientY - popupState.dragStart.y,
        };
        dispatchPopup({ type: "SET_POSITION", payload: newPosition });
      }

      if (popupState.isResizing) {
        const deltaX = e.clientX - popupState.resizeStart.x;
        const deltaY = e.clientY - popupState.resizeStart.y;

        let newWidth = popupState.resizeStart.width;
        let newHeight = popupState.resizeStart.height;
        const newX = popupState.resizeStart.startPosition.x;
        let newY = popupState.resizeStart.startPosition.y;

        if (popupState.resizeDirection === "se") {
          newWidth = Math.max(400, popupState.resizeStart.width + deltaX);
          newHeight = Math.max(300, popupState.resizeStart.height + deltaY);
        } else if (popupState.resizeDirection === "ne") {
          newWidth = Math.max(400, popupState.resizeStart.width + deltaX);
          newHeight = Math.max(300, popupState.resizeStart.height - deltaY);
          newY = popupState.resizeStart.startPosition.y + deltaY;
        }

        dispatchPopup({
          type: "SET_SIZE",
          payload: { width: newWidth, height: newHeight },
        });
        if (popupState.resizeDirection === "ne") {
          dispatchPopup({
            type: "SET_POSITION",
            payload: { x: newX, y: newY },
          });
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (popupState.isDragging && e.touches.length === 1) {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const newPosition = {
          x: touch.clientX - popupState.dragStart.x,
          y: touch.clientY - popupState.dragStart.y,
        };
        dispatchPopup({ type: "SET_POSITION", payload: newPosition });
      }
    };

    const handleMouseUp = () => {
      dispatchPopup({ type: "STOP_DRAGGING" });
      dispatchPopup({ type: "STOP_RESIZING" });

      // Re-enable pointer events on iframe when resizing stops
      const iframe = document.querySelector(
        'iframe[title="Desmos Graphing Calculator"]'
      ) as HTMLIFrameElement;
      if (iframe) {
        iframe.style.pointerEvents = "auto";
      }
    };

    const handleTouchEnd = () => {
      dispatchPopup({ type: "STOP_DRAGGING" });
      dispatchPopup({ type: "STOP_RESIZING" });

      // Re-enable pointer events on iframe when resizing stops
      const iframe = document.querySelector(
        'iframe[title="Desmos Graphing Calculator"]'
      ) as HTMLIFrameElement;
      if (iframe) {
        iframe.style.pointerEvents = "auto";
      }
    };

    if (popupState.isDragging || popupState.isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [popupState]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dispatchPopup({
      type: "START_DRAGGING",
      payload: {
        x: e.clientX - popupState.position.x,
        y: e.clientY - popupState.position.y,
      },
    });
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    direction: "se" | "ne"
  ) => {
    e.stopPropagation();

    // Disable pointer events on iframe during resize
    const iframe = document.querySelector(
      'iframe[title="Desmos Graphing Calculator"]'
    ) as HTMLIFrameElement;
    if (iframe) {
      iframe.style.pointerEvents = "none";
    }

    dispatchPopup({
      type: "START_RESIZING",
      payload: {
        direction,
        x: e.clientX,
        y: e.clientY,
        width: popupState.size.width,
        height: popupState.size.height,
        startPosition: { x: popupState.position.x, y: popupState.position.y },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="fixed flex flex-col bg-white rounded-lg shadow-2xl border-black border-4 overflow-hidden z-50"
      style={{
        left: `${popupState.position.x}px`,
        top: `${popupState.position.y}px`,
        width: `${popupState.size.width}px`,
        height: `${popupState.size.height}px`,
      }}
    >
      {/* Header */}
      <div
        className="bg-black border-b border-black text-white cursor-move flex justify-between items-center"
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            const touch = e.touches[0];
            dispatchPopup({
              type: "START_DRAGGING",
              payload: {
                x: touch.clientX - popupState.position.x,
                y: touch.clientY - popupState.position.y,
              },
            });
          }
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className=" h-8 w-8 p-0 hover:bg-neutral-800 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className=" h-8 w-8 p-0 cursor-move hover:bg-neutral-900 hover:text-white "
        >
          <GripHorizontal className="h-4 w-4 text-white b" />
        </Button>
        <div></div>
      </div>

      {/* Content */}
      <div className="relative h-full">
        <div className="p-0 h-full overflow-hidden">
          <div className="w-full h-full">
            <iframe
              src="https://www.desmos.com/testing/cb-sat-ap/graphing"
              width="100%"
              height="100%"
              className="border-0"
              title="Desmos Graphing Calculator"
            />
          </div>
        </div>

        {/* Resize handles */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "se")}
          onMouseEnter={() => {
            // Disable pointer events on iframe when hovering resize handle
            const iframe = document.querySelector(
              'iframe[title="Desmos Graphing Calculator"]'
            ) as HTMLIFrameElement;
            if (iframe) {
              iframe.style.pointerEvents = "none";
            }
          }}
          onMouseLeave={() => {
            // Re-enable pointer events on iframe when leaving resize handle
            const iframe = document.querySelector(
              'iframe[title="Desmos Graphing Calculator"]'
            ) as HTMLIFrameElement;
            if (iframe) {
              iframe.style.pointerEvents = "auto";
            }
          }}
        >
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500/20 rounded-tl-md border-l-2 border-t-2 border-blue-500/50"></div>
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 256 256"
            className="absolute bottom-1 right-1 text-blue-600 dark:text-blue-400"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M216.49,136.49l-80,80a12,12,0,1,1-17-17l80-80a12,12,0,1,1,17,17Zm-16-105a12,12,0,0,0-17,0l-152,152a12,12,0,0,0,17,17l152-152A12,12,0,0,0,200.49,31.51Z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}
