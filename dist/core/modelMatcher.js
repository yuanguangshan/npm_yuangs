"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchModel = matchModel;
exports.matchModelWithFallback = matchModelWithFallback;
function matchModel(models, requirement) {
    const explanations = [];
    for (const model of models) {
        const hasRequired = requirement.required.every(cap => model.atomicCapabilities.includes(cap));
        const missingRequired = requirement.required.filter(cap => !model.atomicCapabilities.includes(cap));
        const hasPreferred = requirement.preferred.filter(cap => model.atomicCapabilities.includes(cap));
        const explanation = {
            modelName: model.name,
            provider: model.provider,
            hasRequired,
            hasPreferred,
            missingRequired,
            reason: hasRequired
                ? `Has all required capabilities. Matches ${hasPreferred.length}/${requirement.preferred.length} preferred.`
                : `Missing required capabilities: ${missingRequired.map(c => String(c)).join(', ')}`,
        };
        explanations.push(explanation);
    }
    const matchingModels = explanations.filter(e => e.hasRequired);
    if (matchingModels.length === 0) {
        return {
            selected: null,
            candidates: explanations,
            fallbackOccurred: false,
        };
    }
    const bestMatch = matchingModels[0];
    const selectedModel = models.find(m => m.name === bestMatch.modelName);
    return {
        selected: selectedModel || null,
        candidates: explanations,
        fallbackOccurred: false,
    };
}
function matchModelWithFallback(models, fallbackModels, requirement) {
    const primaryResult = matchModel(models, requirement);
    if (primaryResult.selected) {
        return primaryResult;
    }
    const fallbackResult = matchModel(fallbackModels, requirement);
    return {
        ...fallbackResult,
        fallbackOccurred: fallbackResult.selected !== null,
    };
}
//# sourceMappingURL=modelMatcher.js.map