export function GET() {
  console.log("TEST ENV");
  console.log("process.env.GA_KEY ", process.env.GA_KEY);
  console.log("process.env.GT_KEY ", process.env.GT_KEY);
  return new Response("hello there", { status: 200 });
}
