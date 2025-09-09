"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Tab {
  title: string;
  icon: React.ComponentType<{
    className?: string;
    size?: number;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  value: string;
  badge?: number;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  value?: never;
  badge?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
  onTabChange?: (value: string) => void;
  defaultValue?: string;
  children?: React.ReactNode;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = {
  delay: 0.1,
  type: "spring" as const,
  bounce: 0,
  duration: 0.6,
};

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
  onTabChange,
  defaultValue,
  children,
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState<string | null>(
    defaultValue || null
  );
  const outsideClickRef = React.useRef<HTMLDivElement>(null);

  useOnClickOutside(outsideClickRef as React.RefObject<HTMLElement>, () => {
    setSelected(null);
    onChange?.(null);
  });

  const handleSelect = (index: number) => {
    const tab = tabs[index];
    if (tab && tab.type !== "separator") {
      setSelected(index);
      setActiveTab(tab.value);
      onChange?.(index);
      onTabChange?.(tab.value);
    }
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />
  );

  return (
    <div className="space-y-4">
      <div
        ref={outsideClickRef}
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-2xl border bg-background p-1 shadow-sm",
          className
        )}
      >
        {tabs.map((tab, index) => {
          if (tab.type === "separator") {
            return <Separator key={`separator-${index}`} />;
          }

          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.title}
              variants={buttonVariants}
              initial={false}
              animate="animate"
              custom={selected === index}
              onClick={() => handleSelect(index)}
              transition={transition}
              className={cn(
                "relative flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
                selected === index
                  ? cn("bg-muted", activeColor)
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="relative flex items-center">
                <Icon size={20} />
                {tab.badge && (
                  <Badge className="absolute -top-2 left-full min-w-4 -translate-x-1.5 border-background px-1 text-[10px]/[.875rem]">
                    {tab.badge}
                  </Badge>
                )}
              </div>
              <AnimatePresence initial={false}>
                {selected === index && (
                  <motion.span
                    variants={spanVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={transition}
                    className="overflow-hidden ml-2"
                  >
                    {tab.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
      {activeTab && children && (
        <div className="rounded-lg bg-card">{children}</div>
      )}
    </div>
  );
}
