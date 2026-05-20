// Some browsers (and crawlers) still request /favicon.ico directly,
// ignoring <link rel="icon">. Send them to the real SVG icon.
export function GET() {
  return new Response(null, {
    status: 308,
    headers: { Location: '/icon.svg' },
  });
}
