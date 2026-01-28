import {
    CapabilityLevel,
    capabilityLevelToString,
    stringToCapabilityLevel,
    compareCapabilities,
    isCapabilityHigher,
    isCapabilityLower,
    validateCapabilityMonotonicity,
    validateFallbackChain,
} from '../../../core/capability/CapabilityLevel';

describe('CapabilityLevel', () => {
    describe('CapabilityLevel enum', () => {
        it('should have correct numeric values', () => {
            expect(CapabilityLevel.SEMANTIC).toBe(5);
            expect(CapabilityLevel.STRUCTURAL).toBe(4);
            expect(CapabilityLevel.LINE).toBe(3);
            expect(CapabilityLevel.TEXT).toBe(2);
            expect(CapabilityLevel.NONE).toBe(1);
        });
    });

    describe('capabilityLevelToString', () => {
        it('should convert levels to correct strings', () => {
            expect(capabilityLevelToString(CapabilityLevel.SEMANTIC)).toBe('SEMANTIC');
            expect(capabilityLevelToString(CapabilityLevel.STRUCTURAL)).toBe('STRUCTURAL');
            expect(capabilityLevelToString(CapabilityLevel.LINE)).toBe('LINE');
            expect(capabilityLevelToString(CapabilityLevel.TEXT)).toBe('TEXT');
            expect(capabilityLevelToString(CapabilityLevel.NONE)).toBe('NONE');
        });
    });

    describe('stringToCapabilityLevel', () => {
        it('should convert strings to correct levels', () => {
            expect(stringToCapabilityLevel('SEMANTIC')).toBe(CapabilityLevel.SEMANTIC);
            expect(stringToCapabilityLevel('semantic')).toBe(CapabilityLevel.SEMANTIC);
            expect(stringToCapabilityLevel('STRUCTURAL')).toBe(CapabilityLevel.STRUCTURAL);
            expect(stringToCapabilityLevel('LINE')).toBe(CapabilityLevel.LINE);
            expect(stringToCapabilityLevel('TEXT')).toBe(CapabilityLevel.TEXT);
            expect(stringToCapabilityLevel('NONE')).toBe(CapabilityLevel.NONE);
        });

        it('should return undefined for invalid strings', () => {
            expect(stringToCapabilityLevel('INVALID')).toBeUndefined();
            expect(stringToCapabilityLevel('')).toBeUndefined();
        });
    });

    describe('compareCapabilities', () => {
        it('should compare capabilities correctly', () => {
            expect(compareCapabilities(CapabilityLevel.SEMANTIC, CapabilityLevel.STRUCTURAL)).toBeGreaterThan(0);
            expect(compareCapabilities(CapabilityLevel.STRUCTURAL, CapabilityLevel.SEMANTIC)).toBeLessThan(0);
            expect(compareCapabilities(CapabilityLevel.LINE, CapabilityLevel.LINE)).toBe(0);
        });
    });

    describe('isCapabilityHigher', () => {
        it('should correctly identify higher capabilities', () => {
            expect(isCapabilityHigher(CapabilityLevel.SEMANTIC, CapabilityLevel.STRUCTURAL)).toBe(true);
            expect(isCapabilityHigher(CapabilityLevel.LINE, CapabilityLevel.TEXT)).toBe(true);
            expect(isCapabilityHigher(CapabilityLevel.TEXT, CapabilityLevel.SEMANTIC)).toBe(false);
        });
    });

    describe('isCapabilityLower', () => {
        it('should correctly identify lower capabilities', () => {
            expect(isCapabilityLower(CapabilityLevel.STRUCTURAL, CapabilityLevel.SEMANTIC)).toBe(true);
            expect(isCapabilityLower(CapabilityLevel.TEXT, CapabilityLevel.LINE)).toBe(true);
            expect(isCapabilityLower(CapabilityLevel.SEMANTIC, CapabilityLevel.TEXT)).toBe(false);
        });
    });

    describe('validateCapabilityMonotonicity', () => {
        it('should validate monotonic decreasing sequences', () => {
            expect(validateCapabilityMonotonicity([
                CapabilityLevel.SEMANTIC,
                CapabilityLevel.STRUCTURAL,
                CapabilityLevel.LINE,
                CapabilityLevel.TEXT,
                CapabilityLevel.NONE,
            ])).toBe(true);
        });

        it('should reject non-monotonic sequences', () => {
            expect(validateCapabilityMonotonicity([
                CapabilityLevel.SEMANTIC,
                CapabilityLevel.SEMANTIC,
            ])).toBe(false);

            expect(validateCapabilityMonotonicity([
                CapabilityLevel.LINE,
                CapabilityLevel.STRUCTURAL,
            ])).toBe(false);
        });

        it('should accept single element sequences', () => {
            expect(validateCapabilityMonotonicity([CapabilityLevel.SEMANTIC])).toBe(true);
        });

        it('should accept empty sequences', () => {
            expect(validateCapabilityMonotonicity([])).toBe(true);
        });
    });

    describe('validateFallbackChain', () => {
        it('should validate correct fallback chains', () => {
            expect(validateFallbackChain({
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE, CapabilityLevel.TEXT, CapabilityLevel.NONE],
            })).toBe(true);
        });

        it('should accept chains without fallbacks', () => {
            expect(validateFallbackChain({
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [],
            })).toBe(true);
        });

        it('should reject chains that don\'t end with NONE', () => {
            expect(validateFallbackChain({
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE],
            })).toBe(false);
        });

        it('should reject non-monotonic chains', () => {
            expect(validateFallbackChain({
                minCapability: CapabilityLevel.SEMANTIC,
                fallbackChain: [CapabilityLevel.SEMANTIC, CapabilityLevel.STRUCTURAL],
            })).toBe(false);
        });

        it('should reject chains with equal consecutive levels', () => {
            expect(validateFallbackChain({
                minCapability: CapabilityLevel.STRUCTURAL,
                fallbackChain: [CapabilityLevel.STRUCTURAL, CapabilityLevel.LINE],
            })).toBe(false);
        });
    });
});
