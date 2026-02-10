// Biometric Data Types
export interface BiometricData {
    heartRate: number;
    stressLevel: 'low' | 'medium' | 'high';
    signalQuality: number;
    gazeDirection: [number, number, number];
    postureScore: number;
    confidenceLevel: number;
    timestamp: number;
}

export interface BiometricBaseline {
    restingHeartRate: number;
    stressThreshold: number;
    calibrationDate: string;
}

// Avatar Types
export interface AvatarState {
    expression: 'neutral' | 'encouraging' | 'skeptical' | 'concerned';
    gesture: 'pointing' | 'explaining' | 'listening' | 'thinking' | 'idle';
    lipSyncData: VisemeWeights;
    eyeContact: boolean;
}

export interface VisemeWeights {
    [key: string]: number;
}

// Audio Types
export interface AudioConfig {
    sampleRate: 24000;
    bufferSize: 150;
    vadSensitivity: number;
    adaptiveBuffering: boolean;
}

// Coaching Types
export type CoachingMode = 'tutoring' | 'public_speaking' | 'interview';

export interface CoachingSession {
    sessionId: string;
    userId: string;
    mode: CoachingMode;
    startTime: string;
    biometricBaseline: BiometricBaseline;
    contextHistory: Message[];
}

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    biometricContext?: BiometricData;
}

// Barge-In Types
export interface BargeInTrigger {
    triggerType: 'filler_words' | 'stress_spike' | 'gaze_away' | 'combined';
    confidence: number;
    biometricContext: BiometricData;
    audioContext: string;
}

// Session Types
export interface VibeReport {
    sessionId: string;
    overall_score: number;
    peak_confidence_frame: (Partial<BiometricData> & { heart_rate?: number; posture_score?: number }) | null;
    stress_events: number;
    barge_in_count: number;
    improvements: string[];
    strengths: string[];
    analysis: string;
    timestamp: string;
    discussion_summary?: string;
    discussion_points?: string[];
    futureVisualizationUrl?: string;
}

// WebSocket Message Types
export interface WSMessage {
    type: 'audio' | 'biometric' | 'barge_in' | 'session_update' | 'vibe_report';
    payload: any;
    timestamp: number;
}
