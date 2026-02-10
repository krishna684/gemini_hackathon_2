/**
 * Property-Based Tests for Biometric System
 * Tests universal behaviors using fast-check
 */

import fc from 'fast-check';
import {
    extractGreenChannel,
    rollingMeanSubtraction,
    ButterworthFilter,
    calculateBPM,
    detectStressLevel,
} from '@/utils/rppg';

describe('Biometric Pipeline Integrity (Property 1)', () => {
    test('green channel extraction always returns value between 0-255', () => {
        fc.assert(
            fc.property(
                fc.record({
                    data: fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 400, maxLength: 4000 }),
                }),
                (imageDataLike) => {
                    const imageData = {
                        data: new Uint8ClampedArray(imageDataLike.data),
                    } as ImageData;

                    const green = extractGreenChannel(imageData);
                    expect(green).toBeGreaterThanOrEqual(0);
                    expect(green).toBeLessThanOrEqual(255);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('rolling mean subtraction preserves signal length', () => {
        fc.assert(
            fc.property(
                fc.array(fc.float({ min: 0, max: 255 }), { minLength: 10, maxLength: 300 }),
                (signal) => {
                    const result = rollingMeanSubtraction(signal, 10);
                    expect(result.length).toBe(signal.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Butterworth filter produces finite output for any finite input', () => {
        fc.assert(
            fc.property(
                fc.array(fc.float({ min: -100, max: 100 }), { minLength: 30, maxLength: 300 }),
                (signal) => {
                    const filter = new ButterworthFilter();
                    const filtered = signal.map((val) => filter.filter(val));

                    // All values must be finite
                    expect(filtered.every((val) => isFinite(val))).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('BPM calculation returns 0 or valid range (40-200)', () => {
        fc.assert(
            fc.property(
                fc.array(fc.float({ min: -10, max: 10 }), { minLength: 30, maxLength: 300 }),
                (signal) => {
                    const bpm = calculateBPM(signal, 30);
                    expect(bpm === 0 || (bpm >= 40 && bpm <= 200)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Stress Detection Hysteresis (Property 2)', () => {
    test('stress flag only sets after 5+ seconds above threshold', () => {
        const baselineHR = 70;
        const threshold = baselineHR * 1.2; // 84 BPM

        fc.assert(
            fc.property(
                fc.array(fc.float({ min: threshold + 1, max: threshold + 20 }), {
                    minLength: 1,
                    maxLength: 10,
                }),
                (readings) => {
                    const hysteresis = { isStressed: false, startTime: null as number | null };
                    let wasStressed = false;

                    readings.forEach((hr, index) => {
                        // Simulate time passing (1 second per reading)
                        const fakeTime = Date.now() + index * 1000;
                        const originalNow = Date.now;
                        Date.now = () => fakeTime;

                        const result = detectStressLevel(hr, baselineHR, hysteresis);

                        if (result.shouldFlag) {
                            wasStressed = true;
                        }

                        Date.now = originalNow;
                    });

                    // If we had <5 readings, should not have flagged
                    if (readings.length < 5) {
                        expect(wasStressed).toBe(false);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('stress flag clears only when HR drops below 5% above baseline', () => {
        const baselineHR = 70;
        const clearThreshold = baselineHR * 1.05; // 73.5 BPM

        fc.assert(
            fc.property(
                fc.float({ min: baselineHR, max: clearThreshold - 1 }),
                (lowHR) => {
                    // Start in stressed state
                    const hysteresis = { isStressed: true, startTime: Date.now() - 10000 };

                    const result = detectStressLevel(lowHR, baselineHR, hysteresis);

                    // Should have cleared stress
                    expect(result.level).toBe('low');
                    expect(result.shouldFlag).toBe(false);
                    expect(hysteresis.isStressed).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Biometric Processing Performance (Property 19)', () => {
    test('processing 30fps data completes within reasonable time', () => {
        fc.assert(
            fc.property(
                fc.array(fc.float({ min: 0, max: 255 }), { minLength: 90, maxLength: 90 }), // 3 seconds at 30fps
                (signal) => {
                    const startTime = performance.now();

                    const filter = new ButterworthFilter();
                    const acSignal = rollingMeanSubtraction(signal, 30);
                    const filtered = acSignal.map((val) => filter.filter(val));
                    const bpm = calculateBPM(filtered, 30);

                    const endTime = performance.now();
                    const processingTime = endTime - startTime;

                    // Should process 3 seconds of data in less than 100ms
                    expect(processingTime).toBeLessThan(100);
                }
            ),
            { numRuns: 100 }
        );
    });
});
