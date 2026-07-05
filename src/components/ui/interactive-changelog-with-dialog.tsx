"use client";

import * as React from "react";
import {
  ExternalLink,
  FolderIcon,
  GitPullRequest,
  Maximize2,
} from "lucide-react";
import { motion } from "motion/react";
import useEmblaCarousel from "embla-carousel-react";
import { Dithering } from "@paper-design/shaders-react";
import PlatformAnnouncementBanner from "@/src/platform-announcement-banner-v2.png";
import LastAnnouncementBanner from "@/src/last-announcement-banner.png";
import Insights from "@/src/insights.png";
import NewDashboard from "@/src/new-dashboard.png";
import QuestionbankDemo from "@/src/questionbank-demo.gif";
import Vocabs_Tracker from "@/src/vocabs-tracker.png";
import AvatarGroup from "@/components/ui/avatar-group";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type RawContributor =
  | string
  | {
      username?: string;
      name?: string;
      designation?: string;
      image?: string;
    };

type ChangelogComponentProps = {
  githubUsersMap?: Record<
    string,
    {
      username: string;
      name: string;
      designation: string;
      image: string;
    }
  >;
};

type ReleaseSlide = {
  title: string;
  description: string;
  image: string;
  content: React.ReactNode;
};

type ReleaseItem = {
  title: string;
  date: string;
  image: string;
  excerpt: string;
  content: React.ReactNode;
  slides: ReleaseSlide[];
  contributors: RawContributor[];
  issueLink?: string;
  relatedLink?: string;
};

type PlaceholderImageOptions = {
  title: string;
  startColor: string;
  endColor: string;
  accentColor: string;
};

const createPlaceholderImage = ({
  title,
  startColor,
  endColor,
  accentColor,
}: PlaceholderImageOptions) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" fill="none"><defs><linearGradient id="bg" x1="0" y1="0" x2="1200" y2="720" gradientUnits="userSpaceOnUse"><stop stop-color="${startColor}"/><stop offset="1" stop-color="${endColor}"/></linearGradient></defs><rect width="1200" height="720" fill="url(#bg)"/><rect x="96" y="96" width="1008" height="528" fill="${accentColor}" fill-opacity="0.18"/><circle cx="270" cy="220" r="54" fill="${accentColor}" fill-opacity="0.7"/><rect x="352" y="184" width="552" height="72" fill="${accentColor}" fill-opacity="0.68"/><rect x="196" y="350" width="404" height="36" fill="${accentColor}" fill-opacity="0.62"/><rect x="196" y="410" width="620" height="30" fill="${accentColor}" fill-opacity="0.56"/><rect x="196" y="456" width="720" height="30" fill="${accentColor}" fill-opacity="0.46"/><text x="196" y="565" fill="${accentColor}" font-family="Arial, sans-serif" font-size="46" font-weight="700">${title}</text></svg>`;

  try {
    const encodedSvg = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${encodedSvg}`;
  } catch {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
};

function toAvatarGroupItems(contributors: RawContributor[]) {
  return contributors.map((contributor, index) => {
    if (typeof contributor === "string") {
      return {
        id: index + 1,
        name: `Contributor ${index + 1}`,
        designation: "Contributor",
        image: contributor,
      };
    }

    const name =
      contributor.name || contributor.username || `Contributor ${index + 1}`;
    return {
      id: index + 1,
      name,
      designation: contributor.designation || "Contributor",
      image:
        contributor.image ||
        `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name)}`,
    };
  });
}

const defaultReleaseContributors: RawContributor[] = [
  {
    username: "aldhanekaa",
    designation: "Creator",
  },
  {
    username: "cjspd-oly",
    designation: "Community Helper & Bug Reporter",
  },
];

const baseReleases: ReleaseItem[] = [
  {
    title: "v2.1.1: Fix Errors On Individual Question Page",
    date: "May 15, 2026",
    image: createPlaceholderImage({
      title: "Question Page Fixes",
      startColor: "#F0F7FF",
      endColor: "#DCEEFF",
      accentColor: "#0B2A4A",
    }),
    excerpt:
      "Fixed rendering and data issues on individual question pages, improved validation and sanitization.",
    contributors: [
      {
        username: "aldhanekaa",
        designation: "Creator",
      },
      {
        username: "cjspd-oly",
        designation: "Bug Issuer",
      },
    ],
    slides: [
      {
        title: "Fix Errors On Individual Question Page",
        description:
          "Resolved rendering and data issues on single question pages.",
        image: createPlaceholderImage({
          title: "Question Page Fixes",
          startColor: "#F0F7FF",
          endColor: "#DCEEFF",
          accentColor: "#0B2A4A",
        }),
        content: (
          <div className="prose dark:prose-invert">
            <h3>v2.1.1 - Fix Errors On Individual Question Page</h3>
            <ul>
              <li>Fixed incorrect answer rendering on some questions</li>
              <li>
                Added defensive checks for missing or malformed question data
              </li>
              <li>Improved HTML sanitization to prevent layout breakage</li>
              <li>
                Restored missing metadata (source, difficulty) where available
              </li>
            </ul>
          </div>
        ),
      },
    ],
    content: (
      <div className="prose dark:prose-invert">
        <h3>v2.1.1 - Fix Errors On Individual Question Page</h3>
        <ul>
          <li>Fixed incorrect answer rendering on some questions</li>
          <li>Added defensive checks for missing or malformed question data</li>
          <li>Improved HTML sanitization to prevent layout breakage</li>
          <li>
            Restored missing metadata (source, difficulty) where available
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "v2.1.0: Integrate student question bank (MyPractice) Latest",
    date: "May 15, 2026",
    image: createPlaceholderImage({
      title: "MyPractice",
      startColor: "#E8FFF6",
      endColor: "#CFFEF0",
      accentColor: "#004B2D",
    }),
    excerpt:
      "Integrated student question bank (MyPractice) — added 3k+ SAT questions and combined 3k+ PSAT/NMSQT + PSAT questions.",
    contributors: [
      {
        username: "aldhanekaa",
        designation: "Creator",
      },
      {
        username: "cjspd-oly",
        designation: "Feature Suggester",
      },
    ],
    slides: [
      {
        title: "Integrate student question bank (MyPractice) Latest",
        description:
          "Added thousands of new questions to the SAT and PSAT/NMSQT question banks.",
        image: createPlaceholderImage({
          title: "MyPractice",
          startColor: "#E8FFF6",
          endColor: "#CFFEF0",
          accentColor: "#004B2D",
        }),
        content: (
          <div className="prose dark:prose-invert">
            <h3>v2.1.0 - Integrate student question bank (MyPractice)</h3>
            <ul>
              <li>3k+ SAT questions added to the SAT question bank</li>
              <li>3k+ combined questions added for PSAT/NMSQT + PSAT</li>
              <li>Integrated MyPractice import and syncing workflow</li>
              <li>Performance tuning for large question datasets</li>
            </ul>
          </div>
        ),
      },
    ],
    content: (
      <div className="prose dark:prose-invert">
        <h3>v2.1.0 - Integrate student question bank (MyPractice)</h3>
        <ul>
          <li>3k+ SAT questions added to the SAT question bank</li>
          <li>3k+ combined questions added for PSAT/NMSQT + PSAT</li>
          <li>Integrated MyPractice import and syncing workflow</li>
          <li>Performance tuning for large question datasets</li>
        </ul>
      </div>
    ),
  },
  {
    title: "v2.0.2: Contributors Page",
    date: "May 14, 2026",
    image: createPlaceholderImage({
      title: "Contributors Page",
      startColor: "#EAF2FF",
      endColor: "#CDE2FF",
      accentColor: "#0B1E47",
    }),
    excerpt: "Added a dedicated contributors page.",
    contributors: [
      {
        username: "aldhanekaa",
        designation: "Creator",
      },
    ],
    slides: [
      {
        title: "Contributors Page",
        description: "Added a dedicated contributors page.",
        image: createPlaceholderImage({
          title: "Contributors Page",
          startColor: "#EAF2FF",
          endColor: "#CDE2FF",
          accentColor: "#0B1E47",
        }),
        content: (
          <div className="prose dark:prose-invert">
            <h3>v2.0.2 - Contributors Page</h3>
            <ul>
              <li>contributors page</li>
            </ul>
          </div>
        ),
      },
    ],
    content: (
      <div className="prose dark:prose-invert">
        <h3>v2.0.2 - Contributors Page</h3>
        <ul>
          <li>contributors page</li>
        </ul>
      </div>
    ),
  },
  {
    title: "v2.0.1: Fix Invalid Questions & Invalid Answers",
    date: "May 14, 2026",
    issueLink: "https://github.com/Aldhanekaa/MySATPrep/issues/3",
    image: createPlaceholderImage({
      title: "Fix Invalid QA",
      startColor: "#FFF6E8",
      endColor: "#FFE8C2",
      accentColor: "#4A2B00",
    }),
    excerpt:
      "Resolved invalid question/answer issues and fixed un-rendered table formatting.",
    contributors: [
      {
        username: "aldhanekaa",
        designation: "Creator",
      },
      {
        username: "cjspd-oly",
        designation: "Bug Reporter",
      },
    ],
    slides: [
      {
        title: "Fix Invalid Questions & Invalid Answers",
        description:
          "Resolved invalid question/answer issues and fixed un-rendered table formatting.",
        image: createPlaceholderImage({
          title: "Fix Invalid QA",
          startColor: "#FFF6E8",
          endColor: "#FFE8C2",
          accentColor: "#4A2B00",
        }),
        content: (
          <div className="prose dark:prose-invert">
            <h3>v2.0.1 - Fix Invalid Questions & Invalid Answers</h3>
            <p>
              <a
                href="https://github.com/Aldhanekaa/MySATPrep/issues/3"
                target="_blank"
                rel="noreferrer"
              >
                #3
              </a>{" "}
              basically to resolve that issue.
            </p>
            <ul>
              <li>
                fix the formatting issue of un-rendered tables (css problems)
              </li>
            </ul>
          </div>
        ),
      },
    ],
    content: (
      <div className="prose dark:prose-invert">
        <h3>v2.0.1 - Fix Invalid Questions & Invalid Answers</h3>
        <p>
          <a
            href="https://github.com/Aldhanekaa/MySATPrep/issues/3"
            target="_blank"
            rel="noreferrer"
          >
            #3
          </a>{" "}
          basically to resolve that issue.
        </p>
        <ul>
          <li>fix the formatting issue of un-rendered tables (css problems)</li>
        </ul>
      </div>
    ),
  },
  {
    title: "v2.0.0: Big Feature Release & Performance Improvements",
    date: "September 08, 2025",
    image: PlatformAnnouncementBanner.src,
    excerpt:
      "Explore the recaps of new features added through this tour, including dashboard upgrades, question bank improvements, and SAT vocab tools.",
    contributors: [
      {
        username: "aldhanekaa",
        designation: "Aldhaneka",
      },
    ],
    slides: [
      {
        title: "Let's Get Started",
        description:
          "Explore the recaps of new features added through this tour.",
        image: PlatformAnnouncementBanner.src,
        content: (
          <div className="prose dark:prose-invert">
            <h3>Welcome to the Tour</h3>
            <p>Explore the recaps of new features added through this tour.</p>
          </div>
        ),
      },
      {
        title: "New Dashboard Design",
        description:
          "The dashboard has been redesigned to provide more intuitive and user-friendly experience for mobile, tablet, and desktop users.",
        image: NewDashboard.src,
        content: (
          <div className="prose dark:prose-invert">
            <h3>New Dashboard Design</h3>
            <p>
              The dashboard has been redesigned to provide more intuitive and
              user-friendly experience for mobile, tablet, and desktop users.
            </p>
          </div>
        ),
      },
      {
        title: "Personalized Insights & Statistics",
        description:
          "You can get personalized insights and statistics based on your performance on each subject's topics.",
        image: Insights.src,
        content: (
          <div className="prose dark:prose-invert">
            <h3>Personalized Insights & Statistics</h3>
            <p>
              You can get personalized insights and statistics based on your
              performance on each subject&apos;s topics.
            </p>
          </div>
        ),
      },
      {
        title: "Questionbank Updates",
        description:
          "Questionbank now includes custom views, advanced filters, and progress tracking.",
        image: QuestionbankDemo.src,
        content: (
          <div className="prose dark:prose-invert">
            <h3>Questionbank Updates</h3>
            <ul>
              <li>Questionbank page with Collegeboard collections</li>
              <li>Custom list or slide view</li>
              <li>Advanced filters and latest-question discovery</li>
              <li>Progress tracking inside the platform</li>
            </ul>
          </div>
        ),
      },
      {
        title: "SAT Vocab Experience",
        description:
          "Learn 800+ vocab words with tracker, flashcards, practice modes, and AI support.",
        image: Vocabs_Tracker.src,
        content: (
          <div className="prose dark:prose-invert">
            <h3>SAT Vocab Experience</h3>
            <ul>
              <li>Learn more than 800+ SAT vocab words</li>
              <li>Flashcards with local progress persistence</li>
              <li>Multiple practice modes</li>
              <li>AI-powered personalized practice and feedback</li>
            </ul>
          </div>
        ),
      },
      {
        title: "All Free, Forever",
        description:
          "PracticeSAT is completely free to use, ad-free, and open source.",
        image: LastAnnouncementBanner.src,
        content: (
          <div className="prose dark:prose-invert">
            <h3>Lastly, it&apos;s all free, forever!</h3>
            <p>
              PracticeSAT is completely free to use, now and always. The
              platform is ad-free and open source.
            </p>
          </div>
        ),
      },
    ],
    content: (
      <div className="prose dark:prose-invert">
        <h3>Welcome to the Tour</h3>
        <p>Explore the recaps of new features added through this tour.</p>
      </div>
    ),
  },
];

export const Component = ({ githubUsersMap }: ChangelogComponentProps) => {
  const [open, setOpen] = React.useState(false);
  const [activeReleaseIndex, setActiveReleaseIndex] = React.useState(0);
  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const releases = React.useMemo(
    () =>
      baseReleases.map((release) => {
        const enrichedContributors = release.contributors.map((contributor) => {
          const username =
            typeof contributor === "string"
              ? contributor
              : contributor.username;

          if (
            typeof contributor !== "string" &&
            githubUsersMap &&
            username &&
            githubUsersMap[username]
          ) {
            const githubData = githubUsersMap[username];
            return {
              username: githubData.username,
              name: githubData.name,
              designation: contributor.designation,
              image: githubData.image,
            };
          }

          if (githubUsersMap && username && githubUsersMap[username]) {
            const githubData = githubUsersMap[username];
            return {
              username: githubData.username,
              name: githubData.name,
              designation: githubData.designation,
              image: githubData.image,
            };
          }
          return contributor;
        });
        return {
          ...release,
          contributors: enrichedContributors,
        };
      }),
    [githubUsersMap],
  );

  const currentRelease = releases[activeReleaseIndex] ?? releases[0];
  const currentSlides = currentRelease?.slides?.length
    ? currentRelease.slides
    : [
        {
          title: currentRelease.title,
          description: currentRelease.excerpt,
          image: currentRelease.image,
          content: currentRelease.content,
        },
      ];
  const currentSlide = currentSlides[activeSlideIndex] ?? currentSlides[0];

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveSlideIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi || !open) return;
    emblaApi.reInit();
    emblaApi.scrollTo(0);
    setActiveSlideIndex(0);
  }, [emblaApi, open, activeReleaseIndex]);

  const isFirstSlide = activeSlideIndex === 0;
  const isLastSlide = activeSlideIndex === currentSlides.length - 1;

  const openReleaseDialog = (index: number) => {
    setActiveReleaseIndex(index);
    setActiveSlideIndex(0);
    setOpen(true);
  };

  const handlePrevious = () => emblaApi?.scrollPrev();

  const handleNext = () => {
    if (isLastSlide) {
      setOpen(false);
      return;
    }
    emblaApi?.scrollNext();
  };

  const handleOpenRelatedLink = (index: number) => {
    const link = releases[index]?.relatedLink;
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const handleOpenIssueLink = (index: number) => {
    const link = releases[index]?.issueLink;
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* shader header full-width */}
      <div className="relative w-full overflow-hidden">
        {/* <MeshGradient
          colors={["#5b00ff", "#00ffa3", "#ff9a00", "#ea00ff"]}
          swirl={0.55}
          distortion={0.85}
          speed={0.1}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        /> */}
        <Dithering
          // @ts-ignore
          colors={["#ffffff", "#f2f2f2", "#eaeaea"]}
          intensity={0.18}
          shape="simplex"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/30" />

        <div className="relative container mx-auto px-4 py-12 text-left">
          <div className="flex flex-col gap-3 pt-32">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <GitPullRequest className="size-4" />
              <p>Changelog</p>
            </div>
            <h1 className="text-4xl font-semibold text-white leading-snug">
              Latest Enhancements
              <br /> & Platform News
            </h1>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="grid justify-center container mx-auto px-4  border-x border-border">
        {releases.map((item, idx) => (
          <div
            key={idx}
            id={`release-${idx + 1}`}
            className="relative flex flex-col lg:flex-row w-full py-16 gap-6 lg:gap-0"
          >
            <div className="lg:sticky top-2 h-fit">
              <time className="text-muted-foreground w-36 text-sm font-medium lg:absolute">
                {item.date}
              </time>
            </div>

            <div className="flex max-w-prose flex-col gap-4 lg:mx-auto">
              <h3 className="text-3xl font-medium lg:pt-10 lg:text-3xl">
                {item.title}
              </h3>
              <button
                type="button"
                onClick={() => openReleaseDialog(idx)}
                className="relative text-left"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="border-border max-h-96 w-full rounded-lg border object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 rounded-lg" />
              </button>
              <p className="text-muted-foreground text-sm font-medium">
                {item.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <AvatarGroup
                    items={toAvatarGroupItems(
                      item.contributors as RawContributor[],
                    )}
                    maxVisible={3}
                    size="sm"
                    className="justify-start"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openReleaseDialog(idx)}
                        >
                          <Maximize2 className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Show full release</p>
                      </TooltipContent>
                    </Tooltip>

                    {releases[idx]?.relatedLink && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenRelatedLink(idx)}
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open in new tab</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {releases[idx]?.issueLink && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenIssueLink(idx)}
                          >
                            <FolderIcon className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open on GitHub</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <div className="bg-border absolute bottom-0 left-0 right-0 h-px w-[200vw] -translate-x-1/2" />
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-3xl p-0 overflow-hidden">
          <div className="p-3 sm:p-4">
            <div ref={emblaRef} className="overflow-hidden rounded-lg">
              <div className="flex">
                {currentSlides.map((item, idx) => (
                  <div key={idx} className="flex-[0_0_100%] min-w-0">
                    <div className="p-1">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="aspect-video w-full rounded-lg border border-border object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-3">
              {currentSlides.map((item, index) => (
                <motion.div
                  key={item.title}
                  animate={{
                    opacity: index === activeSlideIndex ? 1 : 0.5,
                    width: index === activeSlideIndex ? 24 : 16,
                  }}
                  initial={false}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <button
                    onClick={() => emblaApi?.scrollTo(index)}
                    aria-label={`Go to ${item.title}`}
                    className={cn(
                      "h-2 w-full rounded-full transition-colors cursor-pointer",
                      index === activeSlideIndex
                        ? "bg-foreground"
                        : "bg-border hover:bg-muted-foreground",
                    )}
                  />
                </motion.div>
              ))}
            </div>

            <DialogHeader className="grid mt-4 px-1 text-left">
              {currentSlides.map((item) => (
                <motion.div
                  key={item.title}
                  animate={{
                    opacity: currentSlide.title === item.title ? 1 : 0,
                  }}
                  initial={false}
                  className="col-start-1 row-start-1"
                  style={{
                    pointerEvents:
                      currentSlide.title === item.title ? "auto" : "none",
                  }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <DialogTitle className="text-left text-xl">
                    {item.title}
                  </DialogTitle>
                  <DialogDescription className="text-left mt-2">
                    {item.description}
                  </DialogDescription>
                </motion.div>
              ))}
            </DialogHeader>

            <div className="mt-4 max-h-[32vh] overflow-y-auto px-1">
              {currentSlide.content}
            </div>

            <div className="flex items-center justify-between mt-6 px-1 pb-1">
              <div>
                {!isFirstSlide && (
                  <button
                    onClick={handlePrevious}
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  {isLastSlide ? "Done" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
