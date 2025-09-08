import { QuestionById_Data } from "@/types";

export default function QuestionProblemCard({
  question,
}: {
  question: QuestionById_Data;
}) {
  return (
    <div className="question-problem-card">
      <h2>{question.problem.stem}</h2>
      <p>{question.problem.rationale}</p>
      {/* Render other question details as needed */}
    </div>
  );
}
