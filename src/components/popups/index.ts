"use client";

// Reference Popup State Management
export interface PopupState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  isDragging: boolean;
  isResizing: boolean;
  resizeDirection: "se" | "ne" | null;
  dragStart: { x: number; y: number };
  resizeStart: {
    x: number;
    y: number;
    width: number;
    height: number;
    startPosition: { x: number; y: number };
  };
}

type PopupAction =
  | { type: "SET_POSITION"; payload: { x: number; y: number } }
  | { type: "SET_SIZE"; payload: { width: number; height: number } }
  | { type: "START_DRAGGING"; payload: { x: number; y: number } }
  | { type: "STOP_DRAGGING" }
  | {
      type: "START_RESIZING";
      payload: {
        direction: "se" | "ne";
        x: number;
        y: number;
        width: number;
        height: number;
        startPosition: { x: number; y: number };
      };
    }
  | { type: "STOP_RESIZING" };

export const popupInitialState: PopupState = {
  position: { x: 50, y: 50 },
  size: { width: 600, height: 400 },
  isDragging: false,
  isResizing: false,
  resizeDirection: null,
  dragStart: { x: 0, y: 0 },
  resizeStart: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    startPosition: { x: 0, y: 0 },
  },
};

export function popupReducer(
  state: PopupState,
  action: PopupAction
): PopupState {
  switch (action.type) {
    case "SET_POSITION":
      return { ...state, position: action.payload };
    case "SET_SIZE":
      return { ...state, size: action.payload };
    case "START_DRAGGING":
      return { ...state, isDragging: true, dragStart: action.payload };
    case "STOP_DRAGGING":
      return { ...state, isDragging: false };
    case "START_RESIZING":
      return {
        ...state,
        isResizing: true,
        resizeDirection: action.payload.direction,
        resizeStart: {
          x: action.payload.x,
          y: action.payload.y,
          width: action.payload.width,
          height: action.payload.height,
          startPosition: action.payload.startPosition,
        },
      };
    case "STOP_RESIZING":
      return { ...state, isResizing: false, resizeDirection: null };
    default:
      return state;
  }
}

// Export popup components
export { DraggableReferencePopup } from "./reference-popup";
export { DraggableDesmosPopup } from "./desmos-popup";
export { DraggableNotesPopup } from "./notes-popup";
