# Socratic Mirror Agent - Quick Start Guide

## What is this?

The Socratic Mirror Agent is an AI coaching system that:
- Monitors your heart rate via webcam (rPPG technology)
- Detects stress and communication patterns
- Provides real-time coaching feedback
- Uses a 3D avatar with lip-sync
- Generates comprehensive performance reports

## Setup (5 minutes)

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Get API Keys

You need a Gemini API key:
1. Go to https://aistudio.google.com/apikey
2. Create a new API key
3. Copy it

### 3. Configure Environment

Create `.env.local`:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_RPM_AVATAR_URL=/avatars/6986dfdd47a75ab0c820deb2.glb
```

Create `backend/.env`:
```env
GEMINI_API_KEY=your_key_here
FRONTEND_URL=http://localhost:3000
```

### 4. Run the App

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Open:** http://localhost:3000

## Usage

1. Allow camera and microphone access
2. Choose a coaching mode (Tutoring, Interview, or Public Speaking)  
3. Wait 10 seconds for biometric calibration
4. Start talking with the AI coach
5. Review your performance report at the end

## Troubleshooting

**"Camera not working"**
- Ensure good lighting
- Check browser permissions
- Try Chrome/Edge (best WebGL support)

**"Backend connection failed"**
- Make sure backend is running on port 8000
- Check that API key is set correctly

**"Avatar not loading"**
- Check internet connection
- Verify Ready Player Me URL in .env.local

## Features by Mode

**Socratic Tutoring:**
- Ask questions about any subject
- AI guides with leading questions (no direct answers)
- Adapts to your confusion level

**Public Speaking:**
- Practice presentations
- Real-time feedback on delivery
- Barge-in interruptions for poor habits

**Interview Prep:**
- Challenging AI interviewer
- Skeptical questioning
- Professional feedback

## Technical Notes

- rPPG heart rate is NOT medical grade
- Best results in quiet, well-lit environment
- Requires modern browser with WebGL
- Sub-200ms response time for real-time interaction

## Support

See README.md for detailed documentation
