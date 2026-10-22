"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const classifier_js_1 = require("./classifier.js");
(0, node_test_1.describe)('DefectClassifier', () => {
    const classifier = new classifier_js_1.DefectClassifier();
    (0, node_test_1.it)('classifies a critical functional 500 error as P1 Confirmed Defect', () => {
        const execution = {
            id: 'exec-1',
            testRunId: 'run-1',
            testCaseId: 'tc-form',
            testCaseTitle: 'Submit checkout form',
            category: 'FUNCTIONAL',
            status: 'FAILED',
            durationMs: 1200,
            retryCount: 0,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            stepResults: [
                {
                    stepNumber: 1,
                    action: 'CLICK',
                    status: 'FAILED',
                    durationMs: 300,
                    actualResult: 'Failure: HTTP 500 Internal Server Error returned by backend',
                    errorMessage: 'Backend 500 failure',
                },
            ],
            consoleLogs: [{ type: 'error', text: 'Uncaught (in promise) Server error 500' }],
            networkFailures: [{ url: 'http://test.local/api/checkout', method: 'POST', status: 500 }],
        };
        const defect = classifier.classifyFunctionalFailure(execution, true);
        assert.strictEqual(defect.severity, 'P1');
        assert.strictEqual(defect.classification, 'CONFIRMED');
        assert.strictEqual(defect.category, 'FUNCTIONAL');
        assert.strictEqual(defect.confidenceScore, 0.95);
        assert.ok(defect.fingerprint.length > 0);
    });
    (0, node_test_1.it)('classifies an accessibility violation into appropriate severity', () => {
        const violation = {
            id: 'image-alt',
            impact: 'critical',
            description: 'Ensures <img> elements have alternate text or a role of none or presentation',
            help: 'Images must have alternate text',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.9/image-alt',
            tags: ['wcag2a', 'wcag111'],
            nodes: [
                {
                    html: '<img src="banner.jpg">',
                    target: ['#banner'],
                    failureSummary: 'Fix any of the following: Element does not have an alt attribute',
                },
            ],
        };
        const defect = classifier.classifyA11yViolation(violation, 'http://test.local/', 'run-1');
        assert.strictEqual(defect.severity, 'P1');
        assert.strictEqual(defect.category, 'ACCESSIBILITY');
        assert.strictEqual(defect.classification, 'CONFIRMED');
    });
    (0, node_test_1.it)('classifies visual regression mismatches', () => {
        const result = {
            baselinePath: '',
            candidatePath: '',
            diffPath: '/api/artifacts/run-1/screenshots/diff.png',
            diffPixelCount: 25000,
            totalPixels: 1000000,
            mismatchPercentage: 2.5,
            isMismatch: true,
        };
        const defect = classifier.classifyVisualRegression(result, 'http://test.local/visual', 'run-1');
        assert.strictEqual(defect.category, 'VISUAL');
        assert.strictEqual(defect.severity, 'P3');
        assert.strictEqual(defect.evidence.length, 1);
    });
    (0, node_test_1.it)('classifies passive security findings', () => {
        const finding = {
            type: 'INSECURE_COOKIE',
            severity: 'P1',
            title: 'Cookie Missing HttpOnly Flag',
            description: 'Session cookie does not have HttpOnly flag',
            evidence: 'Set-Cookie: session_id=xyz; Path=/',
            recommendation: 'Add HttpOnly to session cookie',
        };
        const defect = classifier.classifySecurityFinding(finding, 'http://test.local/auth', 'run-1');
        assert.strictEqual(defect.category, 'SECURITY');
        assert.strictEqual(defect.severity, 'P1');
    });
});
//# sourceMappingURL=classifier.test.js.map