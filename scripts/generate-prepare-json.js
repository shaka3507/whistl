#!/usr/bin/env node

/**
 * This script generates placeholder JSON files for all prepare topics
 * referenced in the main prepare page that don't already have JSON files.
 * 
 * Usage: node scripts/generate-prepare-json.js
 */

const fs = require('fs');
const path = require('path');

// Define the paths
const prepareDataDir = path.join(process.cwd(), 'public', 'data', 'prepare');

// Ensure the prepare data directory exists
if (!fs.existsSync(prepareDataDir)) {
  fs.mkdirSync(prepareDataDir, { recursive: true });
  console.log(`Created directory: ${prepareDataDir}`);
}

// All prepare topics from the main page
const prepareTopics = [
  { id: "emergency-kit", title: "Emergency Kit Essentials: Your Lifeline in Crisis" },
  { id: "hurricane", title: "Hurricane Preparedness: Before, During & After" },
  { id: "tornado", title: "Tornado Safety: Your Quick-Action Guide" },
  { id: "flood", title: "Flood Survival: Rising Waters, Rising Awareness" },
  { id: "wildfire", title: "Wildfire Preparedness: Stay Safe in the Heat" },
  { id: "winter-storm", title: "Winter Storm Survival: Beat the Freeze" },
  { id: "heatwave", title: "Heat Wave Safety: Cool Tips for Hot Days" },
  { id: "thunderstorm", title: "Thunderstorm Safety: Weather the Storm" },
  { id: "earthquake", title: "Earthquake Preparedness: Shake, Rattle & Ready" },
  { id: "tsunami", title: "Tsunami Preparedness: Wave of Awareness" },
  { id: "family-plan", title: "Family Emergency Plan: Your Safety Blueprint" },
  { id: "pet-safety", title: "Pet Emergency Preparedness: Keep Your Furry Friends Safe" }
];

// Template for generating placeholder JSON content
const generateTemplate = (topic) => {
  return {
    title: topic.title,
    description: `Learn about ${topic.title.toLowerCase()}. This is a placeholder description.`,
    sections: [
      {
        title: "Before",
        content: "## Preparation\n\nThis is placeholder content. You should replace this with real content about preparation steps.\n\n- Step 1\n- Step 2\n- Step 3"
      },
      {
        title: "During",
        content: "## Immediate Actions\n\nThis is placeholder content. You should replace this with real content about what to do during this event.\n\n- Action 1\n- Action 2\n- Action 3"
      },
      {
        title: "After",
        content: "## Recovery\n\nThis is placeholder content. You should replace this with real content about recovery steps.\n\n- Recovery step 1\n- Recovery step 2\n- Recovery step 3"
      }
    ],
    resources: [
      {
        title: "FEMA Website",
        url: "https://www.ready.gov/"
      },
      {
        title: "Red Cross Resources",
        url: "https://www.redcross.org/"
      }
    ]
  };
};

// Count tracking
let created = 0;
let skipped = 0;

// Generate JSON files for each topic
prepareTopics.forEach(topic => {
  const jsonPath = path.join(prepareDataDir, `${topic.id}.json`);
  
  // Skip if the file already exists
  if (fs.existsSync(jsonPath)) {
    console.log(`Skipped: ${topic.id}.json (already exists)`);
    skipped++;
    return;
  }
  
  // Generate the JSON content
  const jsonContent = generateTemplate(topic);
  
  // Write the file
  fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2));
  console.log(`Created: ${topic.id}.json`);
  created++;
});

console.log(`\nSummary: ${created} files created, ${skipped} files skipped`);
console.log(`\nAll prepare topic JSON files are now available in: ${prepareDataDir}`);
console.log(`\nEdit these files to add real content for each topic.`); 