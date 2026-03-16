
const testCases = [
    { input: "IBFT TBQ20824761", expected: "TBQ20824761" },
    { input: "MBVCB.xxx.TBQ20824761", expected: "TBQ20824761" },
    { input: "TBQ 20824761", expected: "TBQ20824761" },
    { input: "Chuyen khoan TBQ  20824761", expected: "TBQ20824761" },
    { input: "tbq20824761", expected: "TBQ20824761" }, // case insensitive
    { input: "Just text no code", expected: null },
    { input: "TBQmissingdigits", expected: null },
    { input: "20824761 without prefix", expected: null } // The extractOrderCode function expects TBQ
];

function extractOrderCode(raw) {
    if (!raw) return null;
    // Match TBQ followed by optional spaces and then digits
    const m = String(raw).match(/TBQ\s*(\d+)/i);
    if (m) {
        // Return normalized format: TBQ12345
        return 'TBQ' + m[1];
    }
    return null;
}

console.log("Running Regex Tests for generic extractOrderCode logic...");

let failed = 0;
for (const test of testCases) {
    const result = extractOrderCode(test.input);
    if (result === test.expected) {
        console.log(`PASS: "${test.input}" -> ${result}`);
    } else {
        console.error(`FAIL: "${test.input}" -> Expected ${test.expected}, got ${result}`);
        failed++;
    }
}

if (failed === 0) {
    console.log("\nAll tests passed!");
    process.exit(0);
} else {
    console.log(`\n${failed} tests failed.`);
    process.exit(1);
}
