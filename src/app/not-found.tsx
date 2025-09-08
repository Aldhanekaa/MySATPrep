import { Button } from "@/components/ui/button";
import React from "react";
import { SiteHeader } from "./navbar";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <React.Fragment>
      <SiteHeader />
      <div className="w-full">
        <section className="bg-white font-serif min-h-screen flex items-center justify-center">
          <div className="container mx-auto">
            <div className="flex justify-center">
              <div className="w-full sm:w-10/12 md:w-8/12 text-center">
                <div
                  className="bg-[url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif)] h-[250px] sm:h-[350px] md:h-[400px] bg-center bg-no-repeat bg-contain"
                  aria-hidden="true"
                >
                  <h1 className="text-center text-black text-6xl sm:text-7xl md:text-8xl pt-6 sm:pt-8">
                    404
                  </h1>
                </div>

                <div className="mt-[-50px]">
                  <h3 className="text-2xl text-black sm:text-3xl font-bold mb-4">
                    Look like you{`'`}re lost
                  </h3>
                  <p className="mb-6 text-black sm:mb-5">
                    The page you are looking for is not available!
                  </p>

                  <Link href="/">
                    <Button
                      variant="default"
                      className="cursor-pointer my-5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 border-b-4 border-blue-700 hover:border-blue-800 active:border-blue-700"
                    >
                      Go to Home
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </React.Fragment>
  );
}
