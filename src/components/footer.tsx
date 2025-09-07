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

        <span className="text-muted-foreground block text-center text-sm">
          {" "}
          © {new Date().getFullYear()} PracticeSAT. Made with Love by Aldhaneka,
          Indonesia.
        </span>
      </div>
    </footer>
  );
}
