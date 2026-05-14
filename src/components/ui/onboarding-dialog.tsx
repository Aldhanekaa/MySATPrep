import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import useEmblaCarousel from "embla-carousel-react"

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}

type PlaceholderImageOptions = {
  title: string
  startColor: string
  endColor: string
  accentColor: string
}

const createPlaceholderImage = ({ title, startColor, endColor, accentColor }: PlaceholderImageOptions) => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="720" gradientUnits="userSpaceOnUse">
      <stop stop-color="${startColor}" />
      <stop offset="1" stop-color="${endColor}" />
    </linearGradient>
  </defs>
  <rect width="1200" height="720" rx="40" fill="url(#bg)" />
  <rect x="96" y="96" width="1008" height="528" rx="30" fill="${accentColor}" fill-opacity="0.18" />
  <circle cx="270" cy="220" r="54" fill="${accentColor}" fill-opacity="0.7" />
  <rect x="352" y="184" width="552" height="72" rx="20" fill="${accentColor}" fill-opacity="0.68" />
  <rect x="196" y="350" width="404" height="36" rx="18" fill="${accentColor}" fill-opacity="0.62" />
  <rect x="196" y="410" width="620" height="30" rx="15" fill="${accentColor}" fill-opacity="0.56" />
  <rect x="196" y="456" width="720" height="30" rx="15" fill="${accentColor}" fill-opacity="0.46" />
  <text x="196" y="565" fill="${accentColor}" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700">${title}</text>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const slides = [
  {
    id: "welcome",
    alt: "Dashboard preview",
    title: "Welcome to your new workspace",
    description: "Track tasks, documents, and progress from one focused dashboard built for daily execution.",
    image: createPlaceholderImage({ accentColor: "#0B1E47", endColor: "#CDE2FF", startColor: "#EAF2FF", title: "Welcome Dashboard" }),
  },
  {
    id: "automations",
    alt: "Automation workflow preview",
    title: "Automate repetitive work",
    description: "Use smart flows to remove manual busywork and keep your team aligned without extra status meetings.",
    image: createPlaceholderImage({ accentColor: "#0A3D30", endColor: "#CAF6E8", startColor: "#E8FFF7", title: "Automations" }),
  },
  {
    id: "collaboration",
    alt: "Collaboration preview",
    title: "Collaborate in context",
    description: "Share feedback directly where decisions happen so updates stay clear, timely, and easy to follow.",
    image: createPlaceholderImage({ accentColor: "#4A2B00", endColor: "#FFE8C2", startColor: "#FFF6E8", title: "Team Collaboration" }),
  },
  {
    id: "insights",
    alt: "Insights reporting preview",
    title: "Measure outcomes",
    description: "Turn activity into insights with reporting views that highlight what is improving and what needs attention.",
    image: createPlaceholderImage({ accentColor: "#2D1457", endColor: "#E1D4FF", startColor: "#F2ECFF", title: "Insights Reporting" }),
  },
] as const

export function OnboardingDialog({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const [activeIndex, setActiveIndex] = React.useState(0)

  React.useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on("select", onSelect)
    return () => { emblaApi.off("select", onSelect) }
  }, [emblaApi])

  const isFirstSlide = activeIndex === 0
  const isLastSlide = activeIndex === slides.length - 1
  const currentSlide = slides[activeIndex] ?? slides[0]

  const handleNext = () => {
    if (isLastSlide) { setOpen(false); return }
    emblaApi?.scrollNext()
  }

  const handlePrevious = () => emblaApi?.scrollPrev()

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => emblaApi?.scrollTo(0), 50) }}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
      >
        Restart Onboarding
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 rounded-xl bg-background border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-3 sm:p-4">
          {/* Carousel */}
          <div ref={emblaRef} className="overflow-hidden rounded-lg">
            <div className="flex">
              {slides.map((slide) => (
                <div key={slide.id} className="flex-[0_0_100%] min-w-0">
                  <div className="p-1">
                    <img
                      src={slide.image}
                      alt={slide.alt}
                      className="aspect-video w-full rounded-lg object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {slides.map((slide, index) => (
              <motion.div
                key={slide.id}
                animate={{
                  opacity: index === activeIndex ? 1 : 0.5,
                  width: index === activeIndex ? 24 : 16,
                }}
                initial={false}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <button
                  onClick={() => emblaApi?.scrollTo(index)}
                  aria-label={`Go to ${slide.title}`}
                  className={cn(
                    "h-2 w-full rounded-full transition-colors cursor-pointer",
                    index === activeIndex ? "bg-foreground" : "bg-border hover:bg-muted-foreground"
                  )}
                />
              </motion.div>
            ))}
          </div>

          {/* Title + Description — grid fade */}
          <div className="grid mt-4 px-1">
            {slides.map((slide) => (
              <motion.div
                key={slide.id}
                animate={{ opacity: currentSlide.id === slide.id ? 1 : 0 }}
                initial={false}
                className="col-start-1 row-start-1"
                style={{ pointerEvents: currentSlide.id === slide.id ? "auto" : "none" }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <h2 className="text-lg font-semibold text-foreground">{slide.title}</h2>
                <p className="text-sm text-muted-foreground mt-2">{slide.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
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
                {isLastSlide ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
