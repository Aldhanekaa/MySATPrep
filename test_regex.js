const rationales = [
  "The correct answer is either 2 or 8.",
  "The correct answer is 2.2 or 3/4",
  "The correct answer is either A or B",
  "The correct answer is 42.",
  "Choice C is correct."
];

for (const rationale of rationales) {
  const eitherOrMatch = rationale.match(/The correct answer is(?: either)?\s+([A-D]|\d+\/\d+|\d+(?:\.\d+)?)\s+or\s+([A-D]|\d+\/\d+|\d+(?:\.\d+)?)/i);
  if (eitherOrMatch) {
    console.log("Matched EITHER-OR:", eitherOrMatch[1], eitherOrMatch[2]);
  } else {
    const singleMatch = rationale.match(/(?:The correct answer is\s+([A-D]|\d+\/\d+|\d+(?:\.\d+)?)\.?|Choice\s+([A-D]|\d+\/\d+|\d+(?:\.\d+)?)\s+is correct\.|alt="([^"]*)")/i);
    if (singleMatch) {
      console.log("Matched SINGLE:", singleMatch[1] || singleMatch[2] || singleMatch[3]);
    } else {
      console.log("No match");
    }
  }
}
