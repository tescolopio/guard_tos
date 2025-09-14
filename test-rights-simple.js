// Quick test for rights assessor pattern matching
const { createRightsAssessor } = require("./src/analysis/rightsAssessor");

const mockLog = () => {};
const mockLogLevels = { DEBUG: 1, INFO: 2, ERROR: 3 };

console.log("Creating rights assessor...");
const assessor = createRightsAssessor({
  log: mockLog,
  logLevels: mockLogLevels,
});

console.log('Testing with simple text containing "waive"...');
const testText = "You hereby waive any right to pursue claims.";
console.log("Test text:", testText);

assessor
  .analyzeContent(testText)
  .then((result) => {
    console.log("Result:", JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("Error:", error);
  });
