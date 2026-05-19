# Brain Bugs — Privacy & Safety Notes

## Data collected from children
Brain Bugs is designed to be COPPA-friendly. Child profiles contain only:
- **Nickname** — free text, chosen by parent
- **Avatar** — one of 6 emoji/color options
- **Bug companion** — one of 6 original bug characters
- **Age range** — optional: "5-6", "7-8", or "9+"

No email address, phone number, full name, or personal information is collected from children.

## Data collected from parents
Parent accounts contain:
- **Email address** — for account identification
- **Display name** — for personalization
- **Password hash** — obfuscated locally (not plain text)

In production (Firebase mode), passwords are handled by Firebase Auth and never stored in the application database.

## Local storage (MVP)
All data in the MVP is stored in the browser's `localStorage`. It is:
- **Local to the device** — not synced to any server in MVP mode
- **Not shared** with third parties
- **Not sent** over the network
- **Clearable** by the parent at any time using browser settings or the Reset Progress feature

## Firebase mode (production)
When Firebase environment variables (`VITE_FIREBASE_API_KEY`, etc.) are configured:
- Authentication is handled by Firebase Auth (industry-standard, secure)
- Data is stored in a private Firestore database
- Firestore security rules should be configured so parents can only access their own children's data
- No data is shared with third parties

## No tracking
Brain Bugs MVP includes:
- No analytics scripts (no Google Analytics, Mixpanel, etc.)
- No advertising networks
- No social login
- No cookies (localStorage only)
- No third-party embeds

## Content safety
All puzzle content, character designs, and hint messages are:
- Hand-crafted and reviewed for ages 5–9
- Free from violence, mature content, or scary imagery
- Original (no licensed IP, no third-party characters)
- Deterministic (Bug Coach is scripted, not connected to an LLM)

## Parent controls
Parents can:
- Create, edit, and delete child profiles
- Reset a child's progress at any time
- View their child's activity via the Parent Dashboard
- Sign out and clear their session

## Known MVP limitations
- No production security audit has been performed
- `hashPassword` uses base64 obfuscation, not bcrypt — suitable for demo only
- No COPPA formal compliance review has been conducted
- No data processing agreement (DPA) is in place
- No privacy policy URL exists yet

**Before commercial launch, engage a qualified privacy attorney to review COPPA/GDPR compliance.**
