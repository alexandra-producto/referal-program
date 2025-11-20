/**
 * Integration test for hyperconnector-candidate relationship sync
 * 
 * Tests the automatic detection of work overlaps between hyperconnectors and candidates
 * using real data from the database (Emilio as hyperconnector/candidate).
 * 
 * To run: tsx src/testSyncRelationships.ts
 */

import "./config/env";
import { supabase } from "./db/supabaseClient";
import {
  syncHyperconnectorCandidateRelationshipsForCandidate,
  syncHyperconnectorCandidateRelationshipsForHyperconnector,
} from "./agents/syncHyperconnectorRelationships";
import { getCandidateById } from "./domain/candidates";
import { getHyperconnectorById } from "./domain/hyperconnectors";

const EMILIO_CANDIDATE_ID = "07a27df4-23f6-43b7-9724-9f082e5debb2";

async function testSyncRelationships() {
  console.log("🧪 Testing Hyperconnector-Candidate Relationship Sync");
  console.log("=".repeat(70));
  console.log();

  try {
    // 1. Get Emilio's candidate data
    console.log("📋 Step 1: Fetching Emilio's candidate data...");
    const emilioCandidate = await getCandidateById(EMILIO_CANDIDATE_ID);
    
    if (!emilioCandidate) {
      console.error(`❌ Candidate not found with ID: ${EMILIO_CANDIDATE_ID}`);
      console.log("\n💡 Tip: Verify the candidate ID exists in the candidates table");
      console.log("   You can check available candidates with:");
      console.log("   SELECT id, full_name FROM candidates LIMIT 10;");
      return;
    }
    console.log(`✅ Found candidate: ${emilioCandidate.full_name} (${emilioCandidate.id})`);
    console.log();

    // 2. Get Emilio's experience
    console.log("📋 Step 2: Fetching Emilio's experience...");
    const { data: emilioExperience, error: expError } = await supabase
      .from("candidate_experience")
      .select("*")
      .eq("candidate_id", EMILIO_CANDIDATE_ID)
      .order("start_date", { ascending: false });

    if (expError) {
      console.error("❌ Error fetching experience:", expError.message);
      return;
    }

    if (!emilioExperience || emilioExperience.length === 0) {
      console.log("⚠️  No experience found for Emilio");
      console.log("   Please ensure Emilio has experience records in candidate_experience");
      return;
    }

    console.log(`✅ Found ${emilioExperience.length} experience record(s):`);
    emilioExperience.forEach((exp: any, index: number) => {
      console.log(
        `   ${index + 1}. ${exp.company_name} - ${exp.role_title || "N/A"} (${exp.start_date || "N/A"} to ${exp.end_date || "Current"})`
      );
    });
    console.log();

    // 3. Find hyperconnector linked to Emilio (or create one for testing)
    console.log("📋 Step 3: Finding or creating hyperconnector for Emilio...");
    let emilioHyperconnector = null;

    // Try to find existing hyperconnector with candidate_id = Emilio's ID
    const { data: existingHci } = await supabase
      .from("hyperconnectors")
      .select("*")
      .eq("candidate_id", EMILIO_CANDIDATE_ID)
      .maybeSingle();

    if (existingHci) {
      emilioHyperconnector = existingHci;
      console.log(`✅ Found existing hyperconnector: ${emilioHyperconnector.full_name} (${emilioHyperconnector.id})`);
    } else {
      // Create a test hyperconnector for Emilio
      console.log("   Creating test hyperconnector for Emilio...");
      const { data: newHci, error: createError } = await supabase
        .from("hyperconnectors")
        .insert({
          full_name: emilioCandidate.full_name,
          email: emilioCandidate.email || `emilio-test-${Date.now()}@test.com`,
          candidate_id: EMILIO_CANDIDATE_ID,
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating hyperconnector:", createError.message);
        return;
      }

      emilioHyperconnector = newHci;
      console.log(`✅ Created test hyperconnector: ${emilioHyperconnector.id}`);
    }
    console.log();

    // 4. Get all candidates with experience to test against
    console.log("📋 Step 4: Fetching all candidates with experience...");
    const { data: allExperience, error: allExpError } = await supabase
      .from("candidate_experience")
      .select("candidate_id")
      .not("candidate_id", "is", null);

    if (allExpError) {
      console.error("❌ Error fetching all experience:", allExpError.message);
      return;
    }

    const candidateIdsWithExperience = [...new Set((allExperience || []).map((e: any) => e.candidate_id))];
    console.log(`✅ Found ${candidateIdsWithExperience.length} candidate(s) with experience`);
    console.log();

    // 5. Check existing relationships before sync
    console.log("📋 Step 5: Checking existing relationships...");
    const { data: existingConnections } = await supabase
      .from("candidate_connections")
      .select("*")
      .eq("hyperconnector_id", emilioHyperconnector.id)
      .eq("source", "experience_overlap");

    const { data: existingHciCandidates } = await supabase
      .from("hyperconnector_candidates")
      .select("*")
      .eq("hyperconnector_id", emilioHyperconnector.id);

    console.log(`   Existing candidate_connections: ${existingConnections?.length || 0}`);
    console.log(`   Existing hyperconnector_candidates: ${existingHciCandidates?.length || 0}`);
    console.log();

    // 6. Run sync for hyperconnector
    console.log("📋 Step 6: Running sync for hyperconnector...");
    console.log("=".repeat(70));
    await syncHyperconnectorCandidateRelationshipsForHyperconnector(emilioHyperconnector.id);
    console.log("=".repeat(70));
    console.log();

    // 7. Verify results
    console.log("📋 Step 7: Verifying results...");
    const { data: newConnections, error: newConnError } = await supabase
      .from("candidate_connections")
      .select("*")
      .eq("hyperconnector_id", emilioHyperconnector.id)
      .eq("source", "experience_overlap");

    const { data: newHciCandidates, error: newHciError } = await supabase
      .from("hyperconnector_candidates")
      .select("*")
      .eq("hyperconnector_id", emilioHyperconnector.id);

    if (newConnError) {
      console.warn("⚠️  Error fetching new connections:", newConnError.message);
    } else {
      console.log(`✅ Found ${newConnections?.length || 0} candidate_connections with source='experience_overlap'`);
      if (newConnections && newConnections.length > 0) {
        console.log("\n   Connections created:");
        for (const conn of newConnections) {
          const { data: candidate } = await supabase
            .from("candidates")
            .select("full_name")
            .eq("id", conn.candidate_id)
            .single();

          console.log(
            `   - ${candidate?.full_name || conn.candidate_id}: strength=${conn.connection_strength}, source=${conn.source}`
          );
        }
      }
    }

    if (newHciError) {
      console.warn("⚠️  Error fetching new hyperconnector_candidates:", newHciError.message);
    } else {
      console.log(`✅ Found ${newHciCandidates?.length || 0} hyperconnector_candidates`);
      if (newHciCandidates && newHciCandidates.length > 0) {
        console.log("\n   Relationships in hyperconnector_candidates:");
        for (const hciCandidate of newHciCandidates.slice(0, 5)) {
          const { data: candidate } = await supabase
            .from("candidates")
            .select("full_name")
            .eq("id", hciCandidate.candidate_id)
            .single();

          const relationshipType = hciCandidate.relationship_type || "N/A";
          const relationshipSource = hciCandidate.relationship_source || "N/A";
          
          console.log(
            `   - ${candidate?.full_name || hciCandidate.candidate_id}:`
          );
          console.log(`     relationship_type: ${relationshipType}`);
          console.log(`     relationship_source: ${relationshipSource}`);
        }
        if (newHciCandidates.length > 5) {
          console.log(`   ... and ${newHciCandidates.length - 5} more`);
        }
      }
    }
    console.log();

    // 8. Test idempotency - run sync again
    console.log("📋 Step 8: Testing idempotency (running sync again)...");
    const beforeCount = newConnections?.length || 0;
    await syncHyperconnectorCandidateRelationshipsForHyperconnector(emilioHyperconnector.id);

    const { data: afterConnections } = await supabase
      .from("candidate_connections")
      .select("*")
      .eq("hyperconnector_id", emilioHyperconnector.id)
      .eq("source", "experience_overlap");

    const afterCount = afterConnections?.length || 0;

    if (beforeCount === afterCount) {
      console.log(`✅ Idempotency test passed: ${beforeCount} connections before and after`);
    } else {
      console.log(`⚠️  Idempotency test: ${beforeCount} before, ${afterCount} after (expected same)`);
    }
    console.log();

    // 9. Summary
    console.log("=".repeat(70));
    console.log("✅ TEST COMPLETE");
    console.log("=".repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   Hyperconnector: ${emilioHyperconnector.full_name} (${emilioHyperconnector.id})`);
    console.log(`   Candidate: ${emilioCandidate.full_name} (${emilioCandidate.id})`);
    console.log(`   Experience records: ${emilioExperience.length}`);
    console.log(`   Total candidates with experience: ${candidateIdsWithExperience.length}`);
    console.log(`   Relationships created: ${newConnections?.length || 0}`);
    console.log();

    // 10. Show specific test case: Emilio ↔ Alexandra (if exists)
    console.log("📋 Step 9: Checking for specific relationship (Emilio ↔ Alexandra)...");
    const { data: alexandraCandidate } = await supabase
      .from("candidates")
      .select("id, full_name")
      .ilike("full_name", "%alexandra%")
      .limit(1)
      .maybeSingle();

    if (alexandraCandidate) {
      const { data: emilioAlexConnection } = await supabase
        .from("candidate_connections")
        .select("*")
        .eq("hyperconnector_id", emilioHyperconnector.id)
        .eq("candidate_id", alexandraCandidate.id)
        .eq("source", "experience_overlap")
        .maybeSingle();

      if (emilioAlexConnection) {
        console.log(
          `✅ Found relationship: ${emilioHyperconnector.full_name} ↔ ${alexandraCandidate.full_name}`
        );
        console.log(`   Connection strength: ${emilioAlexConnection.connection_strength}`);
        console.log(`   Source: ${emilioAlexConnection.source}`);
      } else {
        console.log(
          `ℹ️  No relationship found between ${emilioHyperconnector.full_name} and ${alexandraCandidate.full_name}`
        );
        console.log("   (They may not have overlapping work experience)");
      }
    } else {
      console.log("ℹ️  Alexandra candidate not found in database");
    }

    console.log("\n" + "=".repeat(70));
  } catch (error: any) {
    console.error("❌ Error in test:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

testSyncRelationships();


