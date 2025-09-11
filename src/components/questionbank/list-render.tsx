import { QuestionWithData } from "@/lib/questionbank";
import { OptimizedQuestionCard } from "../dashboard/shared/OptimizedQuestionCard";

export default function QB_List_Render({
  questions,
  visibleCount,
  handleRetry,
  answerVisibility,
}: {
  questions: QuestionWithData[];
  visibleCount: number;
  handleRetry: (index: number, questionId: string) => void;
  answerVisibility: string;
}) {
  return questions.slice(0, visibleCount).map((question, index) => (
    <div key={`${question.questionId}-${index}`} className="mb-32">
      <OptimizedQuestionCard
        withDate
        question={question}
        index={index}
        onRetry={handleRetry}
        answerVisibility={answerVisibility}
        type="standard"
      />
    </div>
  ));
}
