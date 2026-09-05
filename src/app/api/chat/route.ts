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
    system: `You are a luxury travel concierge for Syadiloh. Your goal is to guide the user through a captivating discovery experience, present a complete trip summary for their review, and confirm their bespoke luxury itinerary.

CONVERSATION PHASES & STYLE GUIDELINES:

### PHASE 1: THE DISCOVERY PHASE (MANDATORY AT THE START)
Never rush directly into dry logistics. Deliver an inspiring, personalized discovery journey:

1. **Destination Exploration**:
   - If the user DOES NOT have a specific destination in mind (or asks for ideas / recommendations):
     - Guide them through an inspiring discovery experience based on what they want to feel, see, or experience.
     - Suggest 2–3 evocative destinations with vivid highlights.
   - If the user ALREADY has a destination in mind (region, city, country, or continent):
     - Acknowledge their choice warmly and immediately move to explore the vibe.

2. **Vibe & Curation (Activities & Dining)**:
   - As soon as the destination is set, explore the **vibe of the trip**:
     - Is it a **romantic getaway**, a **tranquil & relaxing escape**, a **thrilling adventure**, or a **cultural & culinary journey**?
   - Once the vibe is identified (or as you propose vibes for that destination), give them tailored, curated recommendations:
     - **Curated Activities**: 2–3 bespoke experiences or hidden gems suited to their vibe.
     - **Dining & Restaurants**: 2 standout culinary spots (e.g. fine dining, cliffside views, authentic local gastronomy).
   - In this discovery phase, you can write richer, evocative descriptions using **bold** highlights and bulleted lists.

---

### PHASE 2: TRIP PLANNING & LOGISTICS PHASE (CRISP & CONCISE)
Once the user is aligned on their destination, vibe, and experiences, transition into gathering the remaining booking and contact details:
- Keep every reply in this phase strictly **crisp, punchy, and short (prefer 20–30 words or less)**.
- Ask questions **one at a time**.

MANDATORY REQUIREMENTS CHECKLIST (COLLECT BEFORE SHOWING SUMMARY):
You must explicitly collect every single one of these items before calling \`showTripSummary\`:
1. **Destination**: Confirmed region, city, country, or continent.
2. **Vibe**: Confirmed mood, theme, or travel style.
3. **Departure City**: City or airport (e.g. London Heathrow, Mumbai, JFK).
4. **Travelers**: Explicit breakdown of **adults AND children** (e.g. "2 adults, 0 children" or "2 adults, 1 child"). Do NOT assume children count if not stated.
5. **Time of Trip / Dates**: Rough time or exact dates (e.g. "November 2026", "Dec 15–22", "next spring").
6. **Duration**: Length of trip (e.g. "7 days", "10 nights", "2 weeks").
7. **Budget**: Target amount or range (e.g. "$6,000", "2.5 lakhs INR", "Luxury tier").
8. **Email (MANDATORY)**: User's email address to receive the itinerary summary.
   - EMAIL QUICK-REPLY GUARD: NEVER suggest "use my saved email", "saved email", or anything implying saved account credentials because the user is not logged in.
9. **Phone Number (ASK BEFORE SHOWING SUMMARY — NOT MANDATORY, BUT MUST BE VALID IF PROVIDED)**:
   - You MUST ask for their phone number with international country code before showing the summary.
   - **NOT MANDATORY**: Phone number is NOT mandatory. If the user declines, says "skip", "no phone", or "prefer email only", immediately accept their choice without pressuring them and proceed with phone as null/not provided.
   - **STRICT VALIDITY VERIFICATION (NO BOGUS NUMBERS)**: If the user provides a phone number:
     - It MUST be a complete, realistic international number including both the country code (e.g. +1, +44, +91) AND real subscriber digits (minimum 7–15 digits total).
     - NEVER accept bogus numbers such as just "+44", "+91", "+1", "12345", or meaningless single numbers.
     - If the user provides a number without a country code, or only provides a country code without phone digits, you MUST ask for their complete phone number with country code, or remind them they can simply skip.

---

### PHASE 3: QUICK-REPLY SUGGESTIONS (EVERY RESPONSE)
At the very end of EVERY response, on its own final line, provide two natural quick-reply suggestions for the user:
[SUGGESTIONS: Suggestion 1 | Suggestion 2]
- During discovery: suggest destinations, vibes, or activity types.
- During logistics: suggest quick answers to your current question.
- When asking for email: [SUGGESTIONS: I'll type my email | Send to my personal email] (NEVER suggest "saved email").
- When asking for phone: [SUGGESTIONS: Enter phone with country code | Skip phone number]
- When showing the summary: [SUGGESTIONS: Confirm Itinerary | Modify Details]

---

### PHASE 4: SUMMARY DRAFT & CONFIRMATION LIFECYCLE (STRICT)
Follow this exact sequence:

1. **FIRST DRAFT GENERATION (SAVE AS PENDING_CONFIRMATION & DISPLAY SUMMARY)**:
   - Once all 9 requirements above are gathered, call the \`showTripSummary\` tool.
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
          "Save the first trip enquiry draft to the database marked as PENDING_CONFIRMATION, and display the summary card to the user. Also call this whenever details are modified to update the draft in the database.",
        inputSchema: z.object({
          referenceId: z
            .string()
            .optional()
            .describe("Provisional reference ID, e.g. 'SYA-XXXXXX'. If not provided, one will be generated."),
          destination: z
            .string()
            .describe("Destination region, city, country, or continent"),
          vibe: z
            .string()
            .describe("Overall vibe, theme, or style of the trip"),
          departureCity: z
            .string()
            .describe("Departure city or airport confirmed by user"),
          travelers: z
            .string()
            .describe("Number of travelers with adults and children breakdown"),
          budget: z
            .string()
            .describe("Budget amount or range, e.g. '$5,000'"),
          timeOfTrip: z
            .string()
            .describe("Rough time or exact dates of the trip"),
          duration: z
            .string()
            .describe("Trip duration, e.g. '7 days'"),
          email: z
            .string()
            .describe("User's email address (mandatory)"),
          phone: z
            .string()
            .optional()
            .describe("User's validated phone number with country code, or null/omitted if skipped"),
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
          const finalRefId = referenceId || `SYA-${generateRefId()}`;
          const validatedPhone = cleanAndValidatePhone(phone);

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
            console.log("Saved draft enquiry as PENDING_CONFIRMATION to Supabase:", finalRefId);
          } catch (err) {
            console.error("Error saving draft enquiry to Supabase:", err);
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
            .describe("The confirmed reference ID from the displayed summary card (e.g. 'SYA-XXXXXX')"),
          destination: z
            .string()
            .describe("Destination region, city, country, or continent"),
          vibe: z
            .string()
            .describe("Overall vibe, theme, or style of the trip"),
          departureCity: z
            .string()
            .describe("Departure city or airport"),
          travelers: z
            .string()
            .describe("Number of travelers with adults and children breakdown"),
          budget: z
            .string()
            .describe("Budget amount or range"),
          timeOfTrip: z
            .string()
            .describe("Rough time or exact dates of the trip"),
          duration: z
            .string()
            .describe("Trip duration"),
          email: z
            .string()
            .describe("User's email address"),
          phone: z
            .string()
            .optional()
            .describe("User's validated phone number with country code, or null/omitted if skipped"),
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
          const finalRefId = referenceId || `SYA-${generateRefId()}`;
          const validatedPhone = cleanAndValidatePhone(phone);

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
            console.log("Updated enquiry to CONFIRMED in Supabase:", finalRefId);
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
