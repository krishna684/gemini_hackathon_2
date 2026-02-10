# Requirements Document

## Introduction

The Socratic Mirror Agent is a high-frequency multimodal AI coaching system that provides real-time feedback and tutoring through biometric monitoring, 3D avatar interaction, and assertive coaching techniques. The system combines React/Next.js/R3F frontend with Python/FastAPI backend, integrating Gemini 3 Pro for intelligent responses and Ready Player Me avatars for immersive 3D presence.

## Glossary

- **System**: The complete Socratic Mirror Agent platform
- **Avatar**: 3D Ready Player Me character with lip-sync and gesture capabilities
- **Session**: A continuous coaching interaction with context preservation
- **Biometric_Monitor**: Real-time rPPG heart rate and MediaPipe tracking system
- **VAD**: Voice Activity Detection system with barge-in capability
- **Gemini_API**: Google's Gemini 3 Pro AI service integration
- **Coaching_Mode**: Specific interaction pattern (Tutoring, Public Speaking, Interview)
- **Barge_In**: System interruption of user speech for corrective feedback
- **Context_Compression**: Sliding window technique for maintaining session memory
- **Future_Self_Image**: AI-generated visualization of user success at Mizzou

## Requirements

### Requirement 1: Real-Time Biometric Monitoring

**User Story:** As a user, I want the system to monitor my physiological responses in real-time, so that the AI coach can provide personalized feedback based on my stress levels and engagement.

#### Acceptance Criteria

1. WHEN the system starts a session, THE Biometric_Monitor SHALL capture heart rate using rPPG from the green color channel
2. WHEN processing video input, THE Biometric_Monitor SHALL apply 2nd-order IIR Butterworth Bandpass Filter (0.7Hz - 3.0Hz) for accurate BPM calculation
3. WHEN tracking user behavior, THE System SHALL monitor gaze direction and posture using MediaPipe at 30fps locally
4. WHEN biometric data is processed, THE System SHALL send only computed BPM and posture flags to Gemini API to optimize token costs
5. WHEN heart rate exceeds baseline by 20% for more than 5 consecutive seconds, THE System SHALL flag elevated stress state; THE flag SHALL only be cleared once heart rate returns to within 5% of baseline

### Requirement 2: Assertive Real-Time Coaching with Barge-In

**User Story:** As a user, I want the AI coach to interrupt me when I display poor communication patterns, so that I can immediately correct my behavior and improve my skills.

#### Acceptance Criteria

1. WHEN the user exhibits filler words combined with high BPM and looking away, THE System SHALL trigger a Barge_In event
2. WHEN a Barge_In is triggered, THE System SHALL interrupt user speech and provide corrective feedback
3. WHEN providing corrective feedback, THE System SHALL force the user to reset and retry their communication
4. WHEN VAD detects user speech, THE System SHALL analyze communication patterns in real-time
5. WHERE barge-in sensitivity is configured, THE System SHALL adjust interruption thresholds accordingly

### Requirement 3: AI Subject Matter Tutoring

**User Story:** As a student, I want an AI tutor that uses the Socratic method to help me learn, so that I develop critical thinking skills rather than receiving direct answers.

#### Acceptance Criteria

1. WHEN a user requests help with a subject, THE System SHALL activate "Deep Think" reasoning mode with Gemini 3 Pro
2. WHEN explaining concepts, THE Avatar SHALL use hand gestures toward a 3D whiteboard for visual reinforcement
3. WHEN the user asks direct questions, THE System SHALL respond only with leading questions using Socratic method
4. WHEN user confusion is detected through biometric patterns, THE System SHALL adapt explanation approach
5. WHEN tutoring sessions exceed 30 minutes, THE System SHALL apply Context_Compression to maintain coherence

### Requirement 4: Dynamic Interview and Topic Generation

**User Story:** As a job seeker, I want to practice interviews with AI-generated personas and scenarios, so that I can improve my interview performance in realistic conditions.

#### Acceptance Criteria

1. WHEN a user uploads a PDF or URL, THE System SHALL generate a custom interviewer persona
2. WHEN in interview mode, THE Avatar SHALL display skeptical and evaluative behaviors
3. WHEN in public speaking mode, THE System SHALL select challenging topics and simulate audience reactions
4. WHEN user performance is weak, THE Avatar SHALL display non-verbal cues like yawning or skeptical expressions
5. WHEN interview scenarios are generated, THE System SHALL incorporate Mizzou-specific references and context

### Requirement 5: 3D Avatar Interaction and Lip-Sync

**User Story:** As a user, I want to interact with a realistic 3D avatar that speaks and gestures naturally, so that the coaching experience feels immersive and engaging.

#### Acceptance Criteria

1. WHEN audio is received from Gemini API, THE System SHALL process 24kHz PCM for lip-sync
2. WHEN generating lip movements, THE Avatar SHALL use Oculus Viseme morph targets with Linear Interpolation (Lerping) for smooth transitions
3. WHEN speaking, THE Avatar SHALL maintain 150ms client-side jitter buffer with silence injection for dropped packets to prevent mouth freeze
4. WHEN explaining concepts, THE Avatar SHALL perform contextual hand gestures and body language
5. WHEN audio amplitude changes, THE System SHALL map PCM values to appropriate viseme weights with anti-aliasing

### Requirement 6: Session Management and Context Preservation

**User Story:** As a user, I want to resume my coaching sessions where I left off, so that I can maintain continuity in my learning progress.

#### Acceptance Criteria

1. WHEN a session is interrupted, THE System SHALL preserve context for up to 24 hours
2. WHEN resuming a session, THE System SHALL restore previous conversation context and user progress
3. WHEN sessions become lengthy, THE System SHALL apply sliding window Context_Compression with Thinking Signatures preservation
4. WHEN context is compressed, THE System SHALL maintain key learning objectives, user performance data, and pedagogical reasoning state
5. WHEN session data is stored, THE System SHALL ensure secure persistence of user interactions and AI reasoning context

### Requirement 7: Multimodal Real-Time Communication

**User Story:** As a user, I want seamless voice interaction with minimal latency, so that conversations feel natural and responsive.

#### Acceptance Criteria

1. WHEN establishing connection, THE System SHALL create WebSocket proxy to Gemini 3 Pro
2. WHEN processing audio, THE System SHALL maintain low thinking_level for minimal TTFT (Time to First Token)
3. WHEN user speaks, THE VAD SHALL detect speech activity with configurable sensitivity
4. WHEN generating responses, THE System SHALL prioritize response speed over deep reasoning during live interaction
5. WHEN audio streaming, THE System SHALL maintain 24kHz PCM quality for clear communication

### Requirement 8: Mizzou-Specific Personalization

**User Story:** As a Mizzou student, I want coaching content that references my campus and academic environment, so that the experience feels relevant and personalized.

#### Acceptance Criteria

1. WHEN generating scenarios, THE System SHALL incorporate Mizzou campus landmarks and locations
2. WHEN creating interview personas, THE System SHALL reference Mizzou curriculum and academic programs
3. WHEN providing examples, THE System SHALL use Mizzou-specific contexts and terminology
4. WHEN generating Future_Self_Images, THE System SHALL place user in recognizable Mizzou settings like Lafferre Hall
5. WHERE campus integration is enabled, THE System SHALL maintain database of Mizzou-specific references

### Requirement 9: Post-Session Analysis and Visualization

**User Story:** As a user, I want detailed feedback about my performance and a visualization of my potential success, so that I stay motivated and understand my progress.

#### Acceptance Criteria

1. WHEN a session concludes, THE System SHALL generate a comprehensive "Vibe Report" using high thinking_level
2. WHEN analyzing performance, THE System SHALL identify the user's "Peak Confidence Frame" based on lowest heart rate and highest eye contact
3. WHEN creating motivational content, THE System SHALL generate a Future_Self_Image using Nano Banana Pro
4. WHEN displaying results, THE System SHALL show photorealistic 4K visualization of user success at Mizzou
5. WHEN providing feedback, THE System SHALL correlate biometric data with communication performance metrics

### Requirement 10: Technical Architecture and Integration

**User Story:** As a system administrator, I want a robust technical architecture that handles real-time processing and integrations reliably, so that users have a consistent and performant experience.

#### Acceptance Criteria

1. WHEN the frontend loads, THE System SHALL initialize React/Next.js/R3F with Ready Player Me integration
2. WHEN processing requests, THE Backend SHALL use Python/FastAPI with efficient WebSocket handling
3. WHEN integrating AI services, THE System SHALL maintain reliable connection to Gemini 3 Pro API
4. WHEN handling biometric data, THE System SHALL process MediaPipe and rPPG calculations without performance degradation
5. WHEN scaling usage, THE System SHALL maintain sub-200ms response times for real-time interactions