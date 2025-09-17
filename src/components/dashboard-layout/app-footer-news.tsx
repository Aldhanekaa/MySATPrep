import { News, type NewsArticle } from "@/components/ui/sidebar-news";
import NewsFlashcard from "@/src/news/news-flashcard.png";
import NewsNewDashboard from "@/src/news/news-new-dashboard.png";
import NewsQuestionBank from "@/src/news/news-questionbank.png";
import NewsSatVocabs from "@/src/news/news-vocabs.png";

const DEMO_ARTICLES: NewsArticle[] = [
  {
    href: "/dashboard",
    id: "dashboard-update",
    title: "New Dashboard Look",
    summary: "Hey! Do you like our new dashboard look?",
    image: NewsNewDashboard,
  },
  {
    href: "/questionbank",
    title: "Question Bank!",
    id: "question-bank",
    summary: "Explore thousands of questions from Collegeboard's question bank",
    image: NewsQuestionBank,
  },

  {
    href: "/dashboard/vocabs",
    title: "SAT Vocabs Wordbank",
    id: "sat-vocabs",
    summary: "Explore & learn hundreds of SAT words.",
    image: NewsSatVocabs,
  },
  {
    href: "/dashboard/vocabs/learn",
    title: "SAT Vocabs Flashcards",
    id: "sat-vocabs-flashcards",
    summary: "Personalized SAT vocab practice to help you ace the exam.",
    image: NewsFlashcard,
  },
  // {
  //   href: "/dashboard/vocabs/practice",
  //   title: "Vocabs Practice with AI",
  //   id: "sat-vocabs-ai",
  //   summary: "Practicing SAT Vocabs now made easy with AI.",
  //   image: "https://assets.dub.co/changelog/utm-templates.jpg",
  // },
];

export function SidebarFooterNews() {
  return (
    <div className="w-full">
      <div className="relative bottom-0 left-1/2 -translate-x-1/2 w-full">
        <News articles={DEMO_ARTICLES} />
      </div>
    </div>
  );
}
