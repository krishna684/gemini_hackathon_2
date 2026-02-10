# Copilot instructions for Socratic Mirror Agent

## Big picture architecture
- Next.js 14 app router frontend in `src/app` with client-only coaching UI.
- FastAPI backend in `backend/main.py` exposes REST for session lifecycle and a WebSocket `/ws/coach/{session_id}` for real-time coaching.
- Sessions are persisted to JSON under `backend/sessions/` and kept in-memory for up to 24 hours (`backend/session_manager.py`).
- Gemini responses are normalized into JSON with modes (tutoring/public_speaking/interview) via `backend/gemini_client.py`.

## Core data flow (frontend ↔ backend)
- Frontend creates a session via `POST /api/session/create`, then opens WebSocket at `/ws/coach/{session_id}`.
- Frontend sends messages: `user_speech`, `biometric_data`, `end_session` (see `src/app/CoachingSession.tsx`).
- Backend responds with `step` / `check_in` / `coach_response` / `error` / `session_ended` (see `backend/coaching_engine.py`).
- Tutoring mode expects **Visual-First** steps on the whiteboard: `kind: "step"` with `visual` payload and incremental `step` ids.

## Project-specific patterns
- `CoachingSession.tsx` drives the UX: queues narration for TTS, handles barge-in (cancels TTS when user speaks), and archives whiteboard topics.
- Biometric input is currently simulated in `src/components/BiometricMonitor.tsx`; only computed metrics are sent to backend.
- rPPG helpers and stress hysteresis live in `src/utils/rppg.ts` with property-based tests under `tests/properties`.
- Gemini output must be **raw JSON**; `GeminiClient.generate_structured_response()` strips markdown and extracts JSON.

## Developer workflows
- Frontend: `npm run dev`
- Backend: `npm run backend` (or `python backend/main.py` after venv activation)
- Tests: `npm test` (Jest + fast-check in `tests/properties`)

## Configuration & external integrations
- `.env.local` (frontend): `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_GEMINI_API_KEY`, `NEXT_PUBLIC_RPM_AVATAR_URL`
- `backend/.env` (backend): `GEMINI_API_KEY`, `FRONTEND_URL`
- External services: Gemini API, Ready Player Me avatars, MediaPipe (frontend deps).

## When adding/changing features
- Maintain WebSocket message shape compatibility with `handleWebSocketMessage` in `CoachingSession.tsx`.
- Keep session persistence consistent with `SessionManager` (context compression after long sessions).
- For tutoring updates, ensure whiteboard steps are append-only and use `kind: "step"` or `kind: "check_in"`.
