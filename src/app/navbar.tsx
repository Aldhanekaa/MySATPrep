"use client";
import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const menuItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Questionbank", href: "/questionbank" },

  { name: "Resources", href: "/resources" },
];

export const SiteHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed group z-20 w-full px-2"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-7xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-5xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                <Logo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-accent-foreground block duration-150"
                    >
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(isScrolled && "lg:hidden")}
                >
                  <Link href="#">
                    <span>Login</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn(isScrolled && "lg:hidden")}
                >
                  <Link href="#">
                    <span>Sign Up</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn(
                    ` bg-indigo-500 hover:bg-indigo-700 ${
                      isScrolled ? "lg:inline-flex" : "hidden"
                    }`
                  )}
                >
                  <Link href="#">
                    <span>Practice Rush</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className="text-2xl font-bold text-primary flex justify-center items-center gap-1">
      <svg
        width="35"
        height="35"
        viewBox="0 0 110 106"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100.83 28.63L66.86 3.95c-7.25-5.26-17.07-5.26-24.35 0L8.54 28.63C1.29 33.89-1.76 43.23 1.01 51.77l12.98 39.93c2.77 8.53 10.72 14.3 19.7 14.3h41.97c8.98 0 16.93-5.76 19.7-14.3l12.98-39.93c2.77-8.53-.28-17.88-7.53-23.14ZM64.81 63.13l-10.13 18.55-10.13-18.55-18.55-10.13 18.55-10.13 10.13-18.55 10.13 18.55 18.55 10.13-18.55 10.13Z"
          fill="#3B82F6"
        />
      </svg>
      Practice<span className=" text-blue-500 font-black">SAT</span>
    </div>
  );
};
