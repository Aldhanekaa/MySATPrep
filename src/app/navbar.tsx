"use client";
import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, Search } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const menuItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Question Bank", href: "/questionbank" },
  { name: "Resources", href: "/resources" },
];

const CommunityListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
CommunityListItem.displayName = "CommunityListItem";

export const SiteHeader = ({
  IsScrolled = false,
  disableBlur = false,
  disableScroll = false,
}: {
  IsScrolled?: boolean;
  disableBlur?: boolean;
  disableScroll?: boolean;
}) => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(() => IsScrolled || false);

  React.useEffect(() => {
    if (disableScroll) return;

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
        className="fixed group z-50 w-full px-2"
      >
        <div
          className={cn(
            `mx-auto mt-2 max-w-7xl px-6 transition-all duration-300 lg:px-12 ${disableBlur && "bg-white/80  rounded-2xl border backdrop-blur-lg lg:px-5"}`,
            isScrolled &&
              (disableBlur == false
                ? "bg-background/50 max-w-5xl rounded-2xl border backdrop-blur-lg lg:px-5"
                : "bg-white/80 max-w-5xl rounded-2xl border backdrop-blur-lg lg:px-5"),
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
              <NavigationMenu>
                <NavigationMenuList>
                  {menuItems.map((item, index) => (
                    <NavigationMenuItem className="bg-transparent" key={index}>
                      <NavigationMenuLink
                        className={navigationMenuTriggerStyle()}
                        href={item.href}
                        asChild
                      >
                        <Link href={item.href}>
                          <span className="text-muted-foreground hover:text-accent-foreground">
                            {item.name}
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-muted-foreground hover:text-accent-foreground">
                      Community
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <Link
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                              href="/changelogs"
                            >
                              <div className="mb-2 mt-4 text-lg font-medium">
                                Changelogs
                              </div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                Check out the latest updates and improvements
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <CommunityListItem
                          href="/contributors"
                          title="Contributors"
                        >
                          Meet the amazing people behind MySATPrep
                        </CommunityListItem>
                        <CommunityListItem
                          href="/report-bug"
                          title="Report Bug"
                        >
                          Help us improve by reporting issues
                        </CommunityListItem>
                        <CommunityListItem
                          href="/suggest-feature"
                          title="Suggest a Feature"
                        >
                          Share your ideas to make MySATPrep better
                        </CommunityListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
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
                  <li>
                    <div className="text-base font-semibold mb-3">
                      Community
                    </div>
                    <ul className="space-y-3 ml-4">
                      <li>
                        <Link
                          href="/contributors"
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          <span>Contributors</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/report-bug"
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          <span>Report Bug</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/suggest-feature"
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          <span>Suggest a Feature</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/changelogs"
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          <span>Changelogs</span>
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                {/* <Button
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
                </Button> */}

                <Button
                  asChild
                  size="sm"
                  className={cn(
                    ` bg-blue-500 hover:bg-blue-700 ${
                      isScrolled ? "lg:inline-flex" : "inline-flex"
                    }`,
                  )}
                >
                  <Link href="/practice">
                    <span>Practice Rush</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className={cn(
                    `border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white ${
                      isScrolled ? "lg:inline-flex" : "inline-flex"
                    }`,
                  )}
                >
                  <Link href="/question">
                    <Search className="w-4 h-4" />
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
