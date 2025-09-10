"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const PersistentPopover = PopoverPrimitive.Root;

const PersistentPopoverTrigger = PopoverPrimitive.Trigger;

const PersistentPopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    preventClose?: boolean;
  }
>(
  (
    {
      className,
      align = "center",
      sideOffset = 4,
      preventClose = false,
      ...props
    },
    ref
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        onPointerDownOutside={(event) => {
          if (preventClose) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (preventClose) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (preventClose) {
            event.preventDefault();
          }
        }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
);
PersistentPopoverContent.displayName = PopoverPrimitive.Content.displayName;

export {
  PersistentPopover,
  PersistentPopoverTrigger,
  PersistentPopoverContent,
};
