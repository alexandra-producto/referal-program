import "./config/env";
import { getAppUrl, normalizeBaseUrl } from "./utils/appUrl";
import { generateRecommendationUrl } from "./utils/recommendationTokens";

console.log("🧪 Probando normalización de URLs:");
console.log("");

console.log("1. getAppUrl():");
const url1 = getAppUrl();
console.log(`   Resultado: ${url1}`);
console.log("");

console.log("2. normalizeBaseUrl con diferentes inputs:");
const tests = [
  "https://localhost:3000",
  "http://localhost:3000",
  "localhost:3000",
  "http://localhost:3001",
  "https://localhost:3001",
];

tests.forEach((test) => {
  const normalized = normalizeBaseUrl(test);
  console.log(`   ${test.padEnd(25)} -> ${normalized}`);
});

console.log("");
console.log("3. generateRecommendationUrl (ejemplo):");
const testUrl = generateRecommendationUrl(
  "test-hci-id",
  "test-job-id",
  "http://localhost:3000"
);
console.log(`   Con http://localhost:3000: ${testUrl}`);

const testUrl2 = generateRecommendationUrl(
  "test-hci-id",
  "test-job-id",
  "https://localhost:3000"
);
console.log(`   Con https://localhost:3000: ${testUrl2}`);

