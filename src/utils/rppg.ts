/**
 * rPPG Heart Rate Detection Utilities
 * Implements rolling mean subtraction and Butterworth filtering
 */

interface RPPGState {
    signalBuffer: number[];
    timestamps: number[];
    heartRates: number[];
}

/**
 * Extract green channel values from video frame
 */
export function extractGreenChannel(imageData: ImageData): number {
    const data = imageData.data;
    let greenSum = 0;
    let pixelCount = 0;

    // Sample every 4th pixel for performance (can adjust for accuracy vs speed)
    for (let i = 0; i < data.length; i += 16) {
        const green = data[i + 1];
        greenSum += green;
        pixelCount++;
    }

    return greenSum / pixelCount;
}

/**
 * Apply rolling mean subtraction to remove DC component
 */
export function rollingMeanSubtraction(signal: number[], windowSize: number = 30): number[] {
    const result: number[] = [];

    for (let i = 0; i < signal.length; i++) {
        const start = Math.max(0, i - windowSize);
        const window = signal.slice(start, i + 1);
        const mean = window.reduce((sum, val) => sum + val, 0) / window.length;

        result.push(signal[i] - mean);
    }

    return result;
}

/**
 * 2nd-order IIR Butterworth Bandpass Filter (0.7Hz - 3.0Hz)
 * Simplified implementation for web browser
 */
export class ButterworthFilter {
    private x1 = 0;
    private x2 = 0;
    private y1 = 0;
    private y2 = 0;

    // Filter coefficients for 0.7-3.0 Hz at 30fps
    private readonly a0 = 1.0;
    private readonly a1 = -1.8227;
    private readonly a2 = 0.8372;
    private readonly b0 = 0.0185;
    private readonly b1 = 0;
    private readonly b2 = -0.0185;

    filter(x: number): number {
        const y = (this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 -
            this.a1 * this.y1 - this.a2 * this.y2) / this.a0;

        this.x2 = this.x1;
        this.x1 = x;
        this.y2 = this.y1;
        this.y1 = y;

        return y;
    }

    reset(): void {
        this.x1 = this.x2 = this.y1 = this.y2 = 0;
    }
}

/**
 * Calculate BPM from filtered signal using FFT approximation
 */
export function calculateBPM(signal: number[], samplingRate: number = 30): number {
    if (signal.length < 30) return 0;

    // Find peaks in the signal
    const peaks = findPeaks(signal);

    if (peaks.length < 2) return 0;

    // Calculate average time between peaks
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i - 1]);
    }

    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const bpm = (60 * samplingRate) / avgInterval;

    // Validate BPM is in realistic range (40-200)
    if (bpm < 40 || bpm > 200) return 0;

    return bpm;
}

/**
 * Find peaks in signal for heart rate calculation
 */
function findPeaks(signal: number[], threshold: number = 0): number[] {
    const peaks: number[] = [];

    for (let i = 1; i < signal.length - 1; i++) {
        if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1] && signal[i] > threshold) {
            peaks.push(i);
        }
    }

    return peaks;
}

/**
 * Smooth BPM reading using exponential moving average
 */
export function smoothBPM(current: number, previous: number, alpha: number = 0.3): number {
    return alpha * current + (1 - alpha) * previous;
}

/**
 * Detect stress based on heart rate baseline
 */
export function detectStressLevel(
    currentHR: number,
    baselineHR: number,
    hysteresisState: { isStressed: boolean; startTime: number | null }
): { level: 'low' | 'medium' | 'high'; shouldFlag: boolean } {
    const threshold = baselineHR * 1.2; // 20% above baseline
    const clearThreshold = baselineHR * 1.05; // 5% above baseline
    const now = Date.now();

    // Check if exceeding threshold
    if (currentHR > threshold) {
        if (!hysteresisState.isStressed) {
            // Start tracking stress
            if (!hysteresisState.startTime) {
                hysteresisState.startTime = now;
            } else if (now - hysteresisState.startTime > 5000) {
                // Exceeded for 5+ seconds, flag high stress
                hysteresisState.isStressed = true;
                return { level: 'high', shouldFlag: true };
            }
            return { level: 'medium', shouldFlag: false };
        } else {
            return { level: 'high', shouldFlag: true };
        }
    } else if (currentHR < clearThreshold) {
        // Below clear threshold, reset stress state
        hysteresisState.isStressed = false;
        hysteresisState.startTime = null;
        return { level: 'low', shouldFlag: false };
    } else {
        // In between thresholds, maintain current state
        return {
            level: hysteresisState.isStressed ? 'high' : 'medium',
            shouldFlag: hysteresisState.isStressed
        };
    }
}
