import Link from "next/link";

// Import generic icons from lucide-react
import {
  Globe, // Could represent a website or general online presence
  Share2, // Could represent sharing/social media in general
  MessageCircle, // Could represent communication/social
  Link as LinkIcon, // Renamed to avoid conflict with Next.js Link
  Send, // Could represent sending a message, a bit like a paper plane for social
  Feather, // Could be an abstract representation for a 'feed' or 'post'
} from "lucide-react";

const links = [
  {
    title: "Features",
    href: "#",
  },
  {
    title: "Solution",
    href: "#",
  },
  {
    title: "Customers",
    href: "#",
  },
  {
    title: "Pricing",
    href: "#",
  },
  {
    title: "Help",
    href: "#",
  },
  {
    title: "About",
    href: "#",
  },
];

export default function FooterSection() {
  return (
    <footer className="py-10">
      <div className="mx-auto max-w-5xl px-6">
        <Link
          href="/"
          aria-label="go home"
          className="mx-auto block size-fit"
        ></Link>

        <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="text-muted-foreground hover:text-primary block duration-150"
            >
              <span>{link.title}</span>
            </Link>
          ))}
        </div>
        <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
          {/* Using generic icons for social links */}
          <Link
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Social Link 1" // Generic label
            className="text-muted-foreground hover:text-primary block"
          >
            <Share2 className="size-6" /> {/* Generic "Share" icon */}
          </Link>
          <Link
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Social Link 2"
            className="text-muted-foreground hover:text-primary block"
          >
            <MessageCircle className="size-6" /> {/* Generic "Message" icon */}
          </Link>
          <Link
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Social Link 3"
            className="text-muted-foreground hover:text-primary block"
          >
            <LinkIcon className="size-6" /> {/* Generic "Link" icon */}
          </Link>
          <Link
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Social Link 4"
            className="text-muted-foreground hover:text-primary block"
          >
            <Globe className="size-6" />{" "}
            {/* Generic "Globe" (website/world) icon */}
          </Link>
          <Link
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Social Link 5"
            className="text-muted-foreground hover:text-primary block"
          >
            <Send className="size-6" /> {/* Generic "Send" icon */}
          </Link>
          <Link
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Social Link 6"
            className="text-muted-foreground hover:text-primary block"
          >
            <Feather className="size-6" />{" "}
            {/* Generic "Feather" (post/write) icon */}
          </Link>
        </div>
        <span className="text-muted-foreground block text-center text-sm">
          {" "}
          © {new Date().getFullYear()} PracticeSAT, All rights reserved
        </span>
      </div>
    </footer>
  );
}
