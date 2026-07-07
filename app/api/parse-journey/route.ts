import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { text } = await request.json();

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Pollinations API key not configured" },
      { status: 500 }
    );
  }

  const systemPrompt = `You are a journey parser for London public transport. Extract journey details from natural language input.
Return ONLY valid JSON with no extra text, no markdown, no code fences — just raw JSON.
The JSON must have exactly this shape:
{"from": string, "to": string, "arriveBy": string|null, "departAt": string|null}

Rules:
- "from" is the origin station or place name. If the user only mentions a destination (e.g. "I want to go to X"), set "from" to "current location".
- "to" is the destination station or place name.
- "arriveBy" and "departAt" are times in HH:MM 24h format if mentioned, otherwise null.
- Never leave "from" or "to" as an empty string — use "current location" if the origin is unknown.
- Never include anything outside the JSON object.

Typo and phrasing handling:
- Silently correct obvious spelling mistakes in connecting words (e.g. "form" → "from", "too" → "to", "fron" → "from") without mentioning the correction.
- DO NOT try to correct or normalise place names themselves — extract them exactly as the user wrote them (e.g. "dockland campus", "UEL", "canary wharf" should all be passed through verbatim). Place name resolution happens downstream.
- Handle very informal phrasings such as "whats the way from X to Y", "how do i get to X", "take me to X", "I need to reach X from Y" — extract the intent, not the literal words.
- If the input is genuinely gibberish with no discernible origin or destination (e.g. "asdkfj to zzzxyz"), return: {"from": "UNKNOWN", "to": "UNKNOWN", "arriveBy": null, "departAt": null}
- If only one place is unrecognisable, set that field to "UNKNOWN" and extract the other normally.`;

  let rawText = "";
  try {
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        model: "openai",
        jsonMode: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Pollinations error:", res.status, errBody);
      return Response.json(
        { error: `AI service error (${res.status})` },
        { status: 502 }
      );
    }

    rawText = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `AI request failed: ${msg}` }, { status: 502 });
  }

  // Strip markdown code fences if the model added them anyway
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: { from?: unknown; to?: unknown; arriveBy?: unknown; departAt?: unknown };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI output as JSON:", rawText);
    return Response.json(
      { error: "AI returned unparseable output. Please rephrase your query." },
      { status: 422 }
    );
  }

  if (typeof parsed.from !== "string" || typeof parsed.to !== "string") {
    return Response.json(
      { error: "Could not identify origin and destination. Please be more specific." },
      { status: 422 }
    );
  }

  const fromVal = parsed.from.trim();
  const toVal = parsed.to.trim();

  const fromUnknown = !fromVal || fromVal.toUpperCase() === "UNKNOWN";
  const toUnknown = !toVal || toVal.toUpperCase() === "UNKNOWN";

  if (fromUnknown && toUnknown) {
    return Response.json(
      { error: "Could not understand the origin or destination. Please rephrase, e.g. \"from Stratford to Canary Wharf\"." },
      { status: 422 }
    );
  }
  if (fromUnknown) {
    return Response.json(
      { error: "No origin found in your query. Please include where you're travelling from (e.g. \"from Stratford to UEL\")." },
      { status: 422 }
    );
  }
  if (toUnknown) {
    return Response.json(
      { error: "No destination found in your query. Please include where you want to go." },
      { status: 422 }
    );
  }

  return Response.json({
    from: fromVal,
    to: toVal,
    arriveBy: typeof parsed.arriveBy === "string" ? parsed.arriveBy : null,
    departAt: typeof parsed.departAt === "string" ? parsed.departAt : null,
  });
}
