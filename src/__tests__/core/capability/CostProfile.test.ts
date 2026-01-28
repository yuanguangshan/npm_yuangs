import { CostProfileCalculator, defaultCostProfileCalculator } from '../../../core/capability/CostProfile';
import { CapabilityLevel } from '../../../core/capability/CapabilityLevel';

describe('CostProfileCalculator', () => {
    let calculator: CostProfileCalculator;

    beforeEach(() => {
        calculator = new CostProfileCalculator();
    });

    describe('getLanguageComplexity', () => {
        it('should return correct complexity for different file extensions', () => {
            expect(calculator.getLanguageComplexity('test.cpp')).toBeGreaterThan(1);
            expect(calculator.getLanguageComplexity('test.ts')).toBeGreaterThan(1);
            expect(calculator.getLanguageComplexity('test.js')).toBe(1);
            expect(calculator.getLanguageComplexity('test.py')).toBeGreaterThan(1);
        });

        it('should return default complexity for unknown extensions', () => {
            expect(calculator.getLanguageComplexity('test.unknown')).toBe(1.0);
        });

        it('should handle case insensitive extensions', () => {
            expect(calculator.getLanguageComplexity('test.TS')).toBeGreaterThan(1);
            expect(calculator.getLanguageComplexity('test.CPP')).toBeGreaterThan(1);
        });
    });

    describe('getLanguageWeight', () => {
        it('should return correct weight for different file extensions', () => {
            expect(calculator.getLanguageWeight('test.cpp')).toBeGreaterThan(1);
            expect(calculator.getLanguageWeight('test.ts')).toBeGreaterThan(1);
            expect(calculator.getLanguageWeight('test.js')).toBe(1);
        });

        it('should return default weight for unknown extensions', () => {
            expect(calculator.getLanguageWeight('test.unknown')).toBe(1.0);
        });
    });

    describe('getFileExtension', () => {
        it('should extract correct extensions', () => {
            expect(calculator.getFileExtension('test.ts')).toBe('.ts');
            expect(calculator.getFileExtension('test.js')).toBe('.js');
            expect(calculator.getFileExtension('test.min.js')).toBe('.js');
        });

        it('should handle files without extensions', () => {
            expect(calculator.getFileExtension('test')).toBe('');
            expect(calculator.getFileExtension('test/')).toBe('');
        });

        it('should handle case insensitive', () => {
            expect(calculator.getFileExtension('test.TS')).toBe('.ts');
            expect(calculator.getFileExtension('test.TS')).not.toBe('.TS');
        });
    });

    describe('calculate', () => {
        it('should calculate cost profile for empty file list', () => {
            const profile = calculator.calculate([], 0);

            expect(profile.estimatedTime).toBe(0);
            expect(profile.estimatedMemory).toBe(0);
            expect(profile.estimatedTokens).toBe(0);
            expect(profile.requiredCapability).toBe(CapabilityLevel.NONE);
        });

        it('should calculate higher cost for complex languages', () => {
            const cppFiles = ['test.cpp'];
            const jsFiles = ['test.js'];

            const cppProfile = calculator.calculate(cppFiles, 100);
            const jsProfile = calculator.calculate(jsFiles, 100);

            expect(cppProfile.estimatedTime).toBeGreaterThan(jsProfile.estimatedTime);
            expect(cppProfile.estimatedMemory).toBeGreaterThan(jsProfile.estimatedMemory);
            expect(cppProfile.estimatedTokens).toBeGreaterThan(jsProfile.estimatedTokens);
        });

        it('should scale with file count and line count', () => {
            const singleFile = ['test.ts'];
            const multipleFiles = ['test1.ts', 'test2.ts', 'test3.ts'];

            const singleProfile = calculator.calculate(singleFile, 100);
            const multipleProfile = calculator.calculate(multipleFiles, 300);

            expect(multipleProfile.estimatedTime).toBeGreaterThan(singleProfile.estimatedTime);
            expect(multipleProfile.estimatedMemory).toBeGreaterThan(singleProfile.estimatedMemory);
            expect(multipleProfile.estimatedTokens).toBeGreaterThan(singleProfile.estimatedTokens);
        });

        it('should determine correct capability levels based on complexity', () => {
            const smallProfile = calculator.calculate(['test.ts'], 50);
            const mediumProfile = calculator.calculate(['test.ts'], 500);
            const largeProfile = calculator.calculate(['test.cpp'], 10000);

            expect(smallProfile.requiredCapability).toBeLessThanOrEqual(CapabilityLevel.LINE);
            expect(mediumProfile.requiredCapability).toBeLessThanOrEqual(CapabilityLevel.STRUCTURAL);
            expect(largeProfile.requiredCapability).toBeGreaterThanOrEqual(CapabilityLevel.STRUCTURAL);
        });

        it('should handle mixed language files', () => {
            const mixedFiles = ['test.ts', 'test.cpp', 'test.js'];

            const profile = calculator.calculate(mixedFiles, 300);

            expect(profile.estimatedTime).toBeGreaterThan(0);
            expect(profile.estimatedMemory).toBeGreaterThan(0);
            expect(profile.estimatedTokens).toBeGreaterThan(0);
        });

        it('should return positive values for any input', () => {
            const profile = calculator.calculate(['test.ts'], 10);

            expect(profile.estimatedTime).toBeGreaterThanOrEqual(0);
            expect(profile.estimatedMemory).toBeGreaterThanOrEqual(0);
            expect(profile.estimatedTokens).toBeGreaterThanOrEqual(0);
            expect(profile.requiredCapability).toBeGreaterThanOrEqual(CapabilityLevel.NONE);
        });
    });

    describe('with custom options', () => {
        it('should use custom multipliers', () => {
            const customCalculator = new CostProfileCalculator({
                baseTimeMultiplier: 2.0,
                baseMemoryMultiplier: 1.5,
                baseTokenMultiplier: 0.5,
            });

            const profile = customCalculator.calculate(['test.ts'], 100);

            expect(profile.estimatedTime).toBeGreaterThan(0);
            expect(profile.estimatedMemory).toBeGreaterThan(0);
            expect(profile.estimatedTokens).toBeGreaterThan(0);
        });

        it('should use custom language weights', () => {
            const customWeights = [
                { extensions: ['.custom'], weight: 2.0, complexity: 2.0 },
            ];

            const customCalculator = new CostProfileCalculator({
                languageWeights: customWeights,
            });

            const profile = customCalculator.calculate(['test.custom'], 100);

            expect(profile.estimatedTime).toBeGreaterThan(0);
            expect(profile.estimatedMemory).toBeGreaterThan(0);
            expect(profile.estimatedTokens).toBeGreaterThan(0);
        });
    });

    describe('defaultCostProfileCalculator', () => {
        it('should be an instance of CostProfileCalculator', () => {
            expect(defaultCostProfileCalculator).toBeInstanceOf(CostProfileCalculator);
        });

        it('should calculate profiles correctly', () => {
            const profile = defaultCostProfileCalculator.calculate(['test.ts'], 100);

            expect(profile.estimatedTime).toBeGreaterThan(0);
            expect(profile.requiredCapability).toBeGreaterThanOrEqual(CapabilityLevel.NONE);
        });
    });
});
