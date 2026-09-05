import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  tool,
  isStepCount,
} from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { db } from "@/lib/db/client";
import { enquiries } from "@/lib/db/schema";

const generateRefId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

// Guarantees that referenceId is never null, empty, or malformed before DB operations
function ensureValidRefId(refId?: string | null): string {
  if (!refId) return `SYA-${generateRefId()}`;
  const trimmed = refId.trim();
  if (
    trimmed === "" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined" ||
    trimmed.toLowerCase() === "none" ||
    trimmed.toLowerCase() === "pending"
  ) {
    return `SYA-${generateRefId()}`;
  }
  return trimmed.startsWith("SYA-") ? trimmed : `SYA-${trimmed}`;
}

// Validate that phone number has an international country code and real subscriber digits
function cleanAndValidatePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower === "skip" ||
    lower === "none" ||
    lower === "not provided" ||
    lower === "no" ||
    lower === "n/a"
  ) {
    return null;
  }
  // Strip spaces, dashes, parentheses
  const cleaned = trimmed.replace(/[\s\-()]/g, "");
  // Must start with '+' followed by between 7 and 15 digits total (ITU-T E.164 standard)
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    return trimmed;
  }
  return null;
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-3.5-flash-lite"),
    system: `You are a luxury travel concierge for Syadiloh. Your mission is to deliver an inspiring, personalized discovery experience, collect the traveler's exact trip requirements, present a complete trip summary for their review, and confirm their bespoke luxury itinerary.

======================================================================
CORE OPERATING PRINCIPLES: DYNAMIC CONTEXT AWARENESS & ZERO HALLUCINATION
======================================================================

1. DYNAMIC INFORMATION EXTRACTION (NEVER RE-ASK FOR KNOWN DETAILS):
   - Users frequently provide multiple details at once (e.g. "Wanna travel to the Indian Golden Triangle from London, with 3 adults including me, budget is around 1500 pounds per person and I want the trip to be around 3 weeks long").
   - At EVERY turn, thoroughly scan the FULL conversation history. Whenever the user has already provided ANY detail — whether in their opening prompt or in an earlier reply — immediately extract, remember, and lock it in.
   - NEVER re-ask for any detail that the user has already provided anywhere in the chat!
     * If the user said "from London", NEVER ask which city or airport they are departing from.
     * If the user said "budget is around 1500 pounds per person", NEVER ask what their budget is.
     * If the user said "with 3 adults", NEVER ask how many travelers or adults there are.
     * If the user said "3 weeks long", NEVER ask what their trip duration is.
   - Acknowledge the details they provided warmly and naturally so the user knows they have been heard.

2. ZERO TOLERANCE FOR HALLUCINATION:
   - Extracting what the user ACTUALLY stated is essential; INVENTING what the user NEVER stated is STRICTLY FORBIDDEN.
   - NEVER assume, guess, or auto-fill details that the user has NOT provided in their messages.
   - If a detail is missing, you must ask the user for it.
   - NEVER use placeholder names, fake emails (e.g. alex.morgan@example.com), fake phone numbers, or guessed dates.

3. DYNAMIC TRIP REQUIREMENTS CHECKLIST:
   Before you can display the itinerary summary, you need each of the following pieces of information:
   - [ ] Destination (Region, city, or country)
   - [ ] Vibe & Curation (Curate 2–3 bespoke activities and 2 dining gems suited to their destination & vibe)
   - [ ] Departure City / Airport (ONLY ask if not already provided)
   - [ ] Travelers breakdown: Adults and children (ONLY ask if not already provided)
   - [ ] Dates / Timing: Approximate month, season, or specific dates (ONLY ask if not already provided)
   - [ ] Duration: Length of trip in days or weeks (ONLY ask if not already provided)
   - [ ] Budget: Target amount or range per person or total (ONLY ask if not already provided)
   - [ ] Email Address (MANDATORY: Ask for this once all travel logistics above are known)
   - [ ] Phone Number (OPTIONAL: Ask after email is received; user may provide with country code or skip)

4. DYNAMIC QUESTION FLOW (ASK ONLY FOR THE NEXT MISSING ITEM):
   - In each turn, check off all items that the user has ALREADY provided.
   - If the user provides multiple details upfront, acknowledge them all, present curated recommendations for their destination & vibe, and then ask for the FIRST MISSING requirement on the checklist.
   - Always ask for ONLY ONE missing item at a time.
   - Once all logistics (Destination, Vibe, Departure, Travelers, Dates, Duration, Budget) are gathered:
     1. Ask for Email (Mandatory).
     2. Once Email is provided, ask for Phone Number (Optional, with country code or skip).
     3. ONLY after Email is collected and Phone question is answered (number or skip), invoke \`showTripSummary\`.

---

CONVERSATION PHASES & STYLE GUIDELINES:

### PHASE 1: THE DISCOVERY PHASE (MANDATORY AT THE START)
Never rush directly into dry logistics. Deliver an inspiring, personalized discovery journey:

1. **Destination Exploration**:
   - If the user DOES NOT have a specific destination in mind (or asks for ideas / recommendations):
     - Guide them through an inspiring discovery experience based on what they want to feel, see, or experience.
     - Suggest 2–3 evocative destinations with vivid highlights.
   - If the user ALREADY has a destination in mind (e.g. Indian Golden Triangle, Kyoto, Amalfi Coast):
     - Acknowledge their choice warmly.

2. **Vibe & Curation (Activities & Dining)**:
   - Explore or recognize the **vibe of the trip** (e.g. cultural & heritage journey, romantic getaway, tranquil & relaxing escape, or thrilling adventure).
   - Provide tailored, curated recommendations:
     - **Curated Activities**: 2–3 bespoke experiences or hidden gems suited to their vibe.
     - **Dining & Restaurants**: 2 standout culinary spots (fine dining, authentic local gastronomy, or panoramic views).
   - In this discovery phase, write rich, evocative descriptions using **bold** highlights and bulleted lists.
   - At the end of this response, look at your requirements checklist:
     * Check off all details the user already gave in their message.
     * Identify the FIRST detail that is STILL MISSING (e.g. if they already gave departure, travelers, duration, and budget, but not dates: ask when they plan to travel; if departure is missing: ask for departure city).
     * Ask for that SINGLE missing detail to transition naturally into planning.

---

### PHASE 2: TRIP PLANNING & LOGISTICS PHASE (CRISP & CONCISE)
Once destination and vibe are aligned, gather the remaining missing requirements:
- Keep every reply in this phase strictly **crisp, punchy, and short (prefer 20–30 words or less)**.
- Ask for **ONE missing item at a time**.
- NEVER ask for any detail the user already gave.
- Specific requirements guidelines:
  * **Departure City**: City or airport (skip if already provided).
  * **Travelers**: Explicit breakdown of adults and children (skip if already provided).
  * **Dates / Timing**: Approximate month/season or exact dates (skip if already provided).
  * **Duration**: Length of trip in days or weeks (skip if already provided).
  * **Budget**: Target amount or range (skip if already provided).
  * **Email (MANDATORY)**: User's real email address to receive the itinerary summary.
    - EMAIL QUICK-REPLY GUARD: NEVER suggest "use my saved email", "saved email", or anything implying saved account credentials because the user is not logged in.
  * **Phone Number (ASK AFTER EMAIL, BEFORE SHOWING SUMMARY — NOT MANDATORY, BUT MUST BE VALID IF PROVIDED)**:
    - STRICT ORDER: Ask for Email first. AFTER email is provided, ask for Phone Number.
    - DO NOT invoke \`showTripSummary\` while asking for phone number! Wait for their answer (either phone number or skip).
    - **NOT MANDATORY**: Phone number is NOT mandatory. If the user declines, says "skip", "no phone", or "prefer email only", immediately accept their choice without pressuring them and proceed with phone as null/not provided.
    - **STRICT VALIDITY VERIFICATION (NO BOGUS NUMBERS)**: If the user provides a phone number:
      - It MUST be a complete, realistic international number including both the country code (e.g. +1, +44, +91) AND real subscriber digits (minimum 7–15 digits total).
      - NEVER accept bogus numbers such as just "+44", "+91", "+1", "12345", or meaningless single numbers.
      - If the user provides a number without a country code, or only provides a country code without phone digits, you MUST ask for their complete phone number with country code, or remind them they can simply skip.

---

### PHASE 3: QUICK-REPLY SUGGESTIONS (EVERY RESPONSE)
At the very end of EVERY response, on its own final line, provide PRECISELY TWO quick-reply suggestions matching the CURRENT question being asked:
[SUGGESTIONS: Suggestion 1 | Suggestion 2]
CRITICAL FORMATTING RULES:
- ALWAYS stick to PRECISELY TWO suggestions separated by a single pipe '|' character. Do NOT provide 3 suggestions.
- Each item between pipes MUST be a single, standalone suggestion.
- Tailor the 2 suggestions strictly to the current question:
  - When asking for destination: suggest 2 inspiring destinations (e.g. [SUGGESTIONS: Indian Golden Triangle | Kyoto, Japan]).
  - When asking for vibe: suggest 2 vibes (e.g. [SUGGESTIONS: Cultural & Heritage | Luxury & Wellness]).
  - When asking for departure city: suggest 2 major hubs (e.g. [SUGGESTIONS: London Heathrow | Manchester Airport]).
  - When asking for travelers: suggest 2 clear party options (e.g. [SUGGESTIONS: 2 adults, 0 children | 1 adult, 0 children]).
  - When asking for timing/dates: suggest 2 timing options (e.g. [SUGGESTIONS: October - November 2026 | Dec 2026 - Jan 2027]).
  - When asking for duration: suggest 2 durations (e.g. [SUGGESTIONS: 2 weeks | 3 weeks]).
  - When asking for budget: suggest 2 realistic tiers (e.g. [SUGGESTIONS: £1,500 - £2,000 per person | £2,500+ per person]).
  - When asking for email: [SUGGESTIONS: I'll type my email | Send to my personal email] (NEVER suggest "saved email").
  - When asking for phone: [SUGGESTIONS: Enter phone with country code | Skip phone number].
  - When showing the summary: [SUGGESTIONS: Confirm Itinerary | Modify Details].
  - After confirmed: [SUGGESTIONS: Back to Home | Plan Another Trip].

---

### PHASE 4: SUMMARY DRAFT & CONFIRMATION LIFECYCLE (STRICT)
Follow this exact sequence:

1. **FIRST DRAFT GENERATION (SAVE AS PENDING_CONFIRMATION & DISPLAY SUMMARY)**:
   - ONLY call \`showTripSummary\` AFTER the user has answered the phone question (by either giving a valid number or skipping).
   - This tool immediately saves the first draft to the database marked as **PENDING_CONFIRMATION**, and renders the summary card for the traveler on the UI.
   - In your message accompanying \`showTripSummary\`, ask the user to review the itinerary summary card above and let you know if they'd like to confirm it or make any changes.
   - End with: [SUGGESTIONS: Confirm Itinerary | Modify Details]

2. **IF DETAILS GET CHANGED (UPDATE DRAFT IN DATABASE)**:
   - If the user requests modifications (e.g. changing departure, dates, budget, duration, travelers, email, etc.):
     - Acknowledge their adjustment politely.
     - Call \`showTripSummary\` AGAIN with the updated details. This updates the draft in the database (keeping it as PENDING_CONFIRMATION) and displays the updated card.
     - Ask them to review the updated card.
     - End with: [SUGGESTIONS: Confirm Itinerary | Modify Details]

3. **ONCE CONFIRMED (MARK ENQUIRY AS CONFIRMED IN DATABASE)**:
   - When the user explicitly confirms (e.g. "Confirm Itinerary", "Looks good", "Yes, please proceed", "Confirmed"):
     - Call \`saveTripEnquiry\` to update the enquiry state in our database to **CONFIRMED**.
     - Send a celebratory confirmation message that clearly includes:
       - **Reference ID**: The confirmed reference ID (e.g. SYA-XXXXXX)
       - **Email**: The traveler's email address
       - **Phone**: The traveler's phone number (or note "Not provided" if skipped)
       - Inform them that our concierge will email the complete itinerary summary and reach out to begin finalizing reservations.
       - End with: [SUGGESTIONS: Back to Home | Plan Another Trip]`,
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    tools: {
      showTripSummary: tool({
        description:
          "Save the first trip enquiry draft to the database as PENDING_CONFIRMATION and display the summary card to the user. Call this ONLY AFTER all trip details have been gathered, the user has explicitly provided their email, and the user has answered the phone question. NEVER invoke prematurely or with hallucinated details.",
        inputSchema: z.object({
          referenceId: z
            .string()
            .nullable()
            .optional()
            .describe(
              "Provisional reference ID, e.g. 'SYA-XXXXXX'. If not provided, one will be generated.",
            ),
          destination: z.string().describe("Destination confirmed by user"),
          vibe: z.string().describe("Overall vibe confirmed by user"),
          departureCity: z
            .string()
            .describe("Departure city or airport provided by user"),
          travelers: z
            .string()
            .describe("Travelers breakdown provided by user"),
          budget: z
            .string()
            .describe("Budget amount or range provided by user"),
          timeOfTrip: z.string().describe("Travel dates provided by user"),
          duration: z.string().describe("Trip duration provided by user"),
          email: z
            .string()
            .describe("User's real email address provided in chat"),
          phone: z
            .string()
            .nullable()
            .optional()
            .describe(
              "User's validated phone number with country code, or null/omitted if skipped",
            ),
        }),
        execute: async ({
          referenceId,
          destination,
          vibe,
          departureCity,
          travelers,
          budget,
          timeOfTrip,
          duration,
          email,
          phone,
        }) => {
          // Server-side anti-hallucination check:
          // Verify that the user has actually supplied an email in the chat messages
          const userTexts = messages
            .filter((m) => m.role === "user")
            .map((m) => {
              if (Array.isArray(m.parts)) {
                return m.parts
                  .filter((p) => p.type === "text")
                  .map((p) => (p as any).text || "")
                  .join(" ");
              }
              return (m as any).content || "";
            })
            .join(" ");

          const hasUserEmail = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/.test(userTexts);

          if (!hasUserEmail) {
            console.warn(
              "Premature showTripSummary tool call rejected: User has not supplied an email in messages yet.",
            );
            return {
              error:
                "PREMATURE_TOOL_CALL: The user has not provided their email yet. Do NOT invent details or show the summary prematurely. Check which required details (Destination, Vibe, Departure, Travelers, Dates, Duration, Budget, or Email) are still missing from the user's messages, and ask for the next missing detail.",
            };
          }

          const finalRefId = ensureValidRefId(referenceId);
          const validatedPhone = cleanAndValidatePhone(phone);

          // Safety guard: Ensure database is never called with a null or empty reference ID
          if (
            finalRefId &&
            typeof finalRefId === "string" &&
            finalRefId.trim()
          ) {
            try {
              await db
                .insert(enquiries)
                .values({
                  referenceId: finalRefId,
                  destination,
                  state: "PENDING_CONFIRMATION",
                  email,
                  phone: validatedPhone,
                  tripDetails: {
                    destination,
                    vibe,
                    departureCity,
                    travelers,
                    budget,
                    timeOfTrip,
                    duration,
                    email,
                    phone: validatedPhone,
                  },
                })
                .onConflictDoUpdate({
                  target: enquiries.referenceId,
                  set: {
                    destination,
                    state: "PENDING_CONFIRMATION",
                    email,
                    phone: validatedPhone,
                    tripDetails: {
                      destination,
                      vibe,
                      departureCity,
                      travelers,
                      budget,
                      timeOfTrip,
                      duration,
                      email,
                      phone: validatedPhone,
                    },
                  },
                });
              console.log(
                "Saved draft enquiry as PENDING_CONFIRMATION to Supabase:",
                finalRefId,
              );
            } catch (err) {
              console.error("Error saving draft enquiry to Supabase:", err);
            }
          } else {
            console.error(
              "Critical error: Missing or invalid referenceId for database insert",
            );
          }

          return {
            referenceId: finalRefId,
            destination,
            vibe,
            departureCity,
            travelers,
            budget,
            timeOfTrip,
            duration,
            email,
            phone: validatedPhone,
          };
        },
      }),

      saveTripEnquiry: tool({
        description:
          "Mark the enquiry as CONFIRMED in the database. ONLY call this tool AFTER the user has reviewed the summary card and EXPLICITLY confirmed the details.",
        inputSchema: z.object({
          referenceId: z
            .string()
            .describe(
              "The confirmed reference ID from the displayed summary card (e.g. 'SYA-XXXXXX')",
            ),
          destination: z
            .string()
            .describe("Destination region, city, country, or continent"),
          vibe: z
            .string()
            .describe("Overall vibe, theme, or style of the trip"),
          departureCity: z.string().describe("Departure city or airport"),
          travelers: z
            .string()
            .describe("Number of travelers with adults and children breakdown"),
          budget: z.string().describe("Budget amount or range"),
          timeOfTrip: z
            .string()
            .describe("Rough time or exact dates of the trip"),
          duration: z.string().describe("Trip duration"),
          email: z.string().describe("User's email address"),
          phone: z
            .string()
            .nullable()
            .optional()
            .describe(
              "User's validated phone number with country code, or null/omitted if skipped",
            ),
        }),
        execute: async ({
          referenceId,
          destination,
          vibe,
          departureCity,
          travelers,
          budget,
          timeOfTrip,
          duration,
          email,
          phone,
        }) => {
          const finalRefId = ensureValidRefId(referenceId);
          const validatedPhone = cleanAndValidatePhone(phone);

          // Safety guard: Database call must NEVER be executed with a null or empty reference ID
          if (
            !finalRefId ||
            typeof finalRefId !== "string" ||
            !finalRefId.trim()
          ) {
            console.error(
              "Critical error: Missing valid referenceId for confirmed enquiry insert",
            );
            return {
              success: false,
              referenceId: "SYA-UNKNOWN",
              destination,
              email,
              phone: validatedPhone,
            };
          }

          try {
            await db
              .insert(enquiries)
              .values({
                referenceId: finalRefId,
                destination,
                state: "CONFIRMED",
                email,
                phone: validatedPhone,
                tripDetails: {
                  destination,
                  vibe,
                  departureCity,
                  travelers,
                  budget,
                  timeOfTrip,
                  duration,
                  email,
                  phone: validatedPhone,
                },
              })
              .onConflictDoUpdate({
                target: enquiries.referenceId,
                set: {
                  destination,
                  state: "CONFIRMED",
                  email,
                  phone: validatedPhone,
                  tripDetails: {
                    destination,
                    vibe,
                    departureCity,
                    travelers,
                    budget,
                    timeOfTrip,
                    duration,
                    email,
                    phone: validatedPhone,
                  },
                },
              });
            console.log(
              "Updated enquiry to CONFIRMED in Supabase:",
              finalRefId,
            );
            return {
              success: true,
              referenceId: finalRefId,
              destination,
              email,
              phone: validatedPhone,
            };
          } catch (err) {
            console.error("Error confirming enquiry in Supabase:", err);
            return {
              success: false,
              referenceId: finalRefId,
              destination,
              email,
              phone: validatedPhone,
            };
          }
        },
      }),
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
