/**
 * Test script for the matching system
 * 
 * Tests ALL jobs with ALL candidates that have experience
 * 
 * Usage: npm run test:matching
 */

import "./config/env";
import { matchJobCandidate } from "./agents/matchJobCandidate";
import { supabase } from "./db/supabaseClient";
import { getExperienceForCandidate } from "./domain/candidateExperience";
import { getAllCandidates } from "./domain/candidates";

async function testMatching() {
  try {
    console.log("🧪 Testing Job-Candidate Matching System\n");
    console.log("=".repeat(70));

    // Get all jobs
    console.log("\n📋 Fetching all jobs...");
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("*");

    if (jobsError) throw new Error(`Error fetching jobs: ${jobsError.message}`);
    if (!jobs || jobs.length === 0) {
      console.log("❌ No jobs found in database.");
      return;
    }
    console.log(`✅ Found ${jobs.length} job(s)\n`);

    // Get candidate IDs that have experience (more efficient)
    console.log("🔍 Fetching candidates with experience...");
    const { data: experienceData, error: expError } = await supabase
      .from("candidate_experience")
      .select("candidate_id")
      .not("candidate_id", "is", null);

    if (expError) throw new Error(`Error fetching experience: ${expError.message}`);
    
    // Get unique candidate IDs
    const candidateIdsWithExperience = [...new Set(
      (experienceData || []).map((exp: any) => exp.candidate_id)
    )];
    
    if (candidateIdsWithExperience.length === 0) {
      console.log("❌ No candidates with experience found.");
      return;
    }
    console.log(`✅ Found ${candidateIdsWithExperience.length} candidate(s) with experience\n`);

    // Get only those candidates
    console.log("👥 Fetching candidate details...");
    const { data: candidates, error: candidatesError } = await supabase
      .from("candidates")
      .select("*")
      .in("id", candidateIdsWithExperience);

    if (candidatesError) throw new Error(`Error fetching candidates: ${candidatesError.message}`);
    if (!candidates || candidates.length === 0) {
      console.log("❌ No candidates found.");
      return;
    }
    
    const candidatesWithExperience = candidates;
    console.log(`✅ Loaded ${candidatesWithExperience.length} candidate(s)\n`);

    if (candidatesWithExperience.length === 0) {
      console.log("❌ No candidates with experience found. Cannot perform matching.");
      return;
    }

    console.log("=".repeat(70));
    console.log("🚀 Starting matching process...");
    console.log(`   Jobs: ${jobs.length}`);
    console.log(`   Candidates with experience: ${candidatesWithExperience.length}`);
    console.log(`   Total matches to compute: ${jobs.length * candidatesWithExperience.length}`);
    console.log("=".repeat(70) + "\n");

    // Track results
    const results: Array<{
      jobId: string;
      jobTitle: string;
      companyName: string;
      candidateId: string;
      candidateName: string;
      score: number;
    }> = [];

    let totalMatches = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process each job
    for (let jobIndex = 0; jobIndex < jobs.length; jobIndex++) {
      const job = jobs[jobIndex];
      const jobTitle = job.job_title || job.role_title || "Untitled";
      console.log(`\n📋 [${jobIndex + 1}/${jobs.length}] Job: ${jobTitle} at ${job.company_name}`);

      // Match with each candidate that has experience
      for (let candidateIndex = 0; candidateIndex < candidatesWithExperience.length; candidateIndex++) {
        const candidate = candidatesWithExperience[candidateIndex];
        totalMatches++;

        try {
          const result = await matchJobCandidate(job.id, candidate.id);
          successCount++;

          results.push({
            jobId: job.id,
            jobTitle,
            companyName: job.company_name,
            candidateId: candidate.id,
            candidateName: candidate.full_name,
            score: result.score,
          });

          // Show progress for every 5 matches
          if (totalMatches % 5 === 0) {
            console.log(`   ✓ Matched ${candidate.full_name} (${result.score.toFixed(2)}%) - Progress: ${totalMatches}/${jobs.length * candidatesWithExperience.length}`);
          }
        } catch (error: any) {
          errorCount++;
          console.error(`   ❌ Error matching ${candidate.full_name}: ${error.message}`);
        }
      }
    }

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("✅ MATCHING COMPLETE");
    console.log("=".repeat(70));
    console.log(`\n📊 Statistics:`);
    console.log(`   Total matches computed: ${totalMatches}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    // Top matches
    if (results.length > 0) {
      const topMatches = results
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      console.log(`\n🏆 Top 10 Matches:`);
      topMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.candidateName} → ${match.jobTitle} at ${match.companyName}: ${match.score.toFixed(2)}%`);
      });
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ All matches saved to job_candidate_matches table");
    console.log("=".repeat(70) + "\n");

  } catch (error: any) {
    console.error("❌ Error in test:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

testMatching();

