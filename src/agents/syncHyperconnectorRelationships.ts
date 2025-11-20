/**
 * Service to automatically detect and sync relationships between hyperconnectors and candidates
 * based on overlapping work experience at the same company.
 * 
 * Algorithm:
 * 1. For each (hyperconnector, candidate) pair:
 *    - Get all experience records for both
 *    - Find companies where they both worked (case-insensitive match)
 *    - Check if date ranges overlap
 *    - Calculate confidence_score based on overlap duration
 * 2. Insert into hyperconnector_candidates with:
 *    - relationship_type = 'worked_together'
 *    - relationship_source = 'experience_overlap'
 *    - confidence_score (0-100)
 * 3. Prevent duplicates by checking existing relationships
 */

import { supabase } from "../db/supabaseClient";
import { getExperienceForCandidate } from "../domain/candidateExperience";
import { getAllCandidates } from "../domain/candidates";
import { getAllHyperconnectors } from "../domain/hyperconnectors";

interface ExperienceRecord {
  id: string;
  candidate_id: string;
  company_name: string | null;
  start_date: string | null;
  end_date: string | null;
  role_title: string | null;
  is_current?: boolean | null;
}

interface OverlapResult {
  hyperconnectorId: string;
  candidateId: string;
  companyName: string;
  overlapMonths: number;
  confidenceScore: number;
  hciExperience: ExperienceRecord;
  candidateExperience: ExperienceRecord;
}

/**
 * Normalizes company name for comparison
 * - Lowercase
 * - Trim whitespace
 * - Optionally strip common suffixes (S.A., Inc., LLC, etc.)
 */
function normalizeCompanyName(companyName: string | null): string {
  if (!companyName) return "";
  
  let normalized = companyName.toLowerCase().trim();
  
  // Remove common suffixes (optional, for better matching)
  const suffixes = [
    /\s+s\.a\.$/i,
    /\s+s\.a\.\s+de\s+c\.v\.$/i,
    /\s+inc\.?$/i,
    /\s+llc\.?$/i,
    /\s+ltd\.?$/i,
    /\s+corp\.?$/i,
  ];
  
  for (const suffix of suffixes) {
    normalized = normalized.replace(suffix, "");
  }
  
  return normalized.trim();
}

/**
 * Checks if two date ranges overlap
 * Treats NULL end_date as current date (or max date)
 */
function dateRangesOverlap(
  start1: string | null,
  end1: string | null,
  start2: string | null,
  end2: string | null
): { overlaps: boolean; overlapMonths: number } {
  if (!start1 || !start2) {
    return { overlaps: false, overlapMonths: 0 };
  }

  const now = new Date();
  const maxDate = new Date("2099-12-31"); // Far future date for NULL end_date

  const date1Start = new Date(start1);
  const date1End = end1 ? new Date(end1) : maxDate;
  const date2Start = new Date(start2);
  const date2End = end2 ? new Date(end2) : maxDate;

  // Check if ranges overlap
  const overlaps = date1Start <= date2End && date2Start <= date1End;

  if (!overlaps) {
    return { overlaps: false, overlapMonths: 0 };
  }

  // Calculate overlap duration
  const overlapStart = date1Start > date2Start ? date1Start : date2Start;
  const overlapEnd = date1End < date2End ? date1End : date2End;

  // Calculate months of overlap
  const monthsDiff =
    (overlapEnd.getFullYear() - overlapStart.getFullYear()) * 12 +
    (overlapEnd.getMonth() - overlapStart.getMonth());

  // Add partial month if days are significant
  const daysDiff = overlapEnd.getDate() - overlapStart.getDate();
  const partialMonth = daysDiff > 15 ? 1 : daysDiff > 0 ? 0.5 : 0;

  const overlapMonths = Math.max(0, monthsDiff + partialMonth);

  return { overlaps: true, overlapMonths };
}

/**
 * Finds overlapping work experiences between a hyperconnector and a candidate
 * Returns the best overlap (highest confidence score)
 * 
 * @param hyperconnectorId - The hyperconnector ID (needed for the result)
 * @param hciExperiences - Experience records for the hyperconnector (from their linked candidate profile)
 * @param candidateId - The candidate ID (needed for the result)
 * @param candidateExperiences - Experience records for the candidate
 */
function findWorkOverlaps(
  hyperconnectorId: string,
  hciExperiences: ExperienceRecord[],
  candidateId: string,
  candidateExperiences: ExperienceRecord[]
): OverlapResult | null {
  let bestOverlap: OverlapResult | null = null;
  let maxConfidence = 0;

  for (const hciExp of hciExperiences) {
    if (!hciExp.company_name) continue;

    const normalizedHciCompany = normalizeCompanyName(hciExp.company_name);

    for (const candidateExp of candidateExperiences) {
      if (!candidateExp.company_name) continue;

      const normalizedCandidateCompany = normalizeCompanyName(candidateExp.company_name);

      // Check if same company (case-insensitive, normalized)
      if (normalizedHciCompany !== normalizedCandidateCompany) continue;

      // Check date overlap
      const { overlaps, overlapMonths } = dateRangesOverlap(
        hciExp.start_date,
        hciExp.end_date,
        candidateExp.start_date,
        candidateExp.end_date
      );

      if (!overlaps) continue;

      // Calculate confidence score
      // Algorithm: Use overlap months, capped at 100
      // If overlap is >= 12 months, score is 100
      // Otherwise, score is (overlapMonths / 12) * 100, minimum 10
      const confidenceScore = overlapMonths >= 12 
        ? 100 
        : Math.max(10, Math.min(100, Math.round((overlapMonths / 12) * 100)));

      // Keep track of the best overlap (highest confidence)
      if (confidenceScore > maxConfidence) {
        maxConfidence = confidenceScore;
        bestOverlap = {
          hyperconnectorId,
          candidateId,
          companyName: hciExp.company_name,
          overlapMonths,
          confidenceScore,
          hciExperience: hciExp,
          candidateExperience: candidateExp,
        };
      }
    }
  }

  return bestOverlap;
}

/**
 * Gets all candidates in a hyperconnector's network
 * This could be from candidate_connections or hyperconnector_candidates
 */
async function getCandidatesInHyperconnectorNetwork(
  hyperconnectorId: string
): Promise<string[]> {
  // Try candidate_connections first (new table)
  const { data: connections } = await supabase
    .from("candidate_connections")
    .select("candidate_id")
    .eq("hyperconnector_id", hyperconnectorId);

  if (connections && connections.length > 0) {
    return connections.map((c: any) => c.candidate_id);
  }

  // Fallback to hyperconnector_candidates
  const { data: hciCandidates } = await supabase
    .from("hyperconnector_candidates")
    .select("candidate_id")
    .eq("hyperconnector_id", hyperconnectorId);

  if (hciCandidates && hciCandidates.length > 0) {
    return hciCandidates.map((c: any) => c.candidate_id);
  }

  return [];
}

/**
 * Gets the candidate_id for a hyperconnector
 * (Hyperconnectors might have a linked candidate profile)
 */
async function getHyperconnectorCandidateId(hyperconnectorId: string): Promise<string | null> {
  // Check if hyperconnector has a candidate_id field or linked candidate
  const { data: hci } = await supabase
    .from("hyperconnectors")
    .select("candidate_id")
    .eq("id", hyperconnectorId)
    .maybeSingle();

  return hci?.candidate_id || null;
}

/**
 * Checks if a relationship already exists
 * Checks both hyperconnector_candidates and candidate_connections
 */
async function relationshipExists(
  hyperconnectorId: string,
  candidateId: string,
  relationshipType: string = "worked_together"
): Promise<boolean> {
  // Check in candidate_connections first (new table with source field)
  const { data: connection, error: connError } = await supabase
    .from("candidate_connections")
    .select("id")
    .eq("hyperconnector_id", hyperconnectorId)
    .eq("candidate_id", candidateId)
    .eq("source", "experience_overlap")
    .maybeSingle();

  if (connError && connError.code !== "PGRST116") {
    console.warn("Error checking candidate_connections:", connError.message);
  }

  if (connection) return true;

  // Fallback: check in hyperconnector_candidates
  const { data: hciCandidate, error: hciError } = await supabase
    .from("hyperconnector_candidates")
    .select("id")
    .eq("hyperconnector_id", hyperconnectorId)
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (hciError && hciError.code !== "PGRST116") {
    console.warn("Error checking hyperconnector_candidates:", hciError.message);
  }

  return !!hciCandidate;
}

/**
 * Creates or updates a relationship
 * Uses candidate_connections for the new relationship with source and connection_strength
 * Also updates hyperconnector_candidates for backward compatibility
 */
async function createOrUpdateRelationship(
  hyperconnectorId: string,
  candidateId: string,
  overlap: OverlapResult
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Insert/update in candidate_connections (new table with source and connection_strength)
  try {
    const { error: connError } = await supabase
      .from("candidate_connections")
      .upsert(
        {
          hyperconnector_id: hyperconnectorId,
          candidate_id: candidateId,
          source: "experience_overlap",
          connection_strength: overlap.confidenceScore,
          created_at: now,
          updated_at: now,
        },
        {
          onConflict: "hyperconnector_id,candidate_id",
        }
      );

    if (connError) {
      console.warn("⚠️ Could not insert into candidate_connections:", connError.message);
      console.warn("   Error details:", JSON.stringify(connError, null, 2));
      // Continue to try hyperconnector_candidates
    } else {
      console.log(`   📝 Created/updated candidate_connection with strength ${overlap.confidenceScore}`);
    }
  } catch (error: any) {
    console.warn("⚠️ Error with candidate_connections:", error.message);
    console.warn("   Stack:", error.stack);
  }

  // 2. Also insert/update in hyperconnector_candidates for backward compatibility
  try {
    // First check if record exists
    const { data: existing, error: checkError } = await supabase
      .from("hyperconnector_candidates")
      .select("id")
      .eq("hyperconnector_id", hyperconnectorId)
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.warn("⚠️ Error checking existing hyperconnector_candidates:", checkError.message);
    }

    if (existing) {
      // Update existing record
      const { data: updated, error: updateError } = await supabase
        .from("hyperconnector_candidates")
        .update({
          relationship_type: "worked_together",
          relationship_source: "automatic_match",
        })
        .eq("id", existing.id)
        .select();

      if (updateError) {
        console.error("❌ Error updating hyperconnector_candidates:", updateError.message);
        console.error("   Error details:", JSON.stringify(updateError, null, 2));
        console.error("   Hyperconnector ID:", hyperconnectorId);
        console.error("   Candidate ID:", candidateId);
      } else {
        console.log(`   📝 Updated hyperconnector_candidates record (ID: ${existing.id})`);
      }
    } else {
      // Insert new record
      const { data: inserted, error: insertError } = await supabase
        .from("hyperconnector_candidates")
        .insert({
          hyperconnector_id: hyperconnectorId,
          candidate_id: candidateId,
          relationship_type: "worked_together",
          relationship_source: "automatic_match",
        })
        .select();

      if (insertError) {
        console.error("❌ Error inserting into hyperconnector_candidates:", insertError.message);
        console.error("   Error details:", JSON.stringify(insertError, null, 2));
        console.error("   Hyperconnector ID:", hyperconnectorId);
        console.error("   Candidate ID:", candidateId);
        console.error("   Error code:", insertError.code);
        console.error("   Error hint:", insertError.hint);
      } else {
        console.log(`   📝 Created new hyperconnector_candidates record (ID: ${inserted?.[0]?.id})`);
      }
    }
  } catch (error: any) {
    console.error("❌ Exception in hyperconnector_candidates operation:", error.message);
    console.error("   Stack:", error.stack);
  }
}

/**
 * Main function: Syncs relationships for a specific candidate
 * When a new candidate is created, check against all hyperconnectors
 */
export async function syncHyperconnectorCandidateRelationshipsForCandidate(
  candidateId: string
): Promise<void> {
  console.log(`🔄 Syncing relationships for candidate: ${candidateId}`);

  // Get candidate's experience
  const candidateExperiences = await getExperienceForCandidate(candidateId);
  if (candidateExperiences.length === 0) {
    console.log(`   ⚠️ No experience found for candidate ${candidateId}`);
    return;
  }

  // Get all hyperconnectors
  const hyperconnectors = await getAllHyperconnectors();
  if (hyperconnectors.length === 0) {
    console.log("   ⚠️ No hyperconnectors found");
    return;
  }

  const relationshipsCreated: OverlapResult[] = [];

  // For each hyperconnector, check if they worked together
  for (const hci of hyperconnectors) {
    // Get hyperconnector's candidate_id (if they have a linked candidate profile)
    const hciCandidateId = await getHyperconnectorCandidateId(hci.id);
    
    if (!hciCandidateId) {
      // If hyperconnector doesn't have a candidate_id, skip
      // (We need experience data to compare)
      continue;
    }

    // Get hyperconnector's experience
    const hciExperiences = await getExperienceForCandidate(hciCandidateId);
    if (hciExperiences.length === 0) continue;

    // Find overlaps
    const overlap = findWorkOverlaps(hci.id, hciExperiences, candidateId, candidateExperiences);

    if (overlap) {
      // Check if relationship already exists
      const exists = await relationshipExists(hci.id, candidateId);
      
      if (!exists) {
        await createOrUpdateRelationship(hci.id, candidateId, overlap);
        relationshipsCreated.push(overlap);
        console.log(
          `   ✅ Found overlap: ${hci.full_name} ↔ candidate ${candidateId} at ${overlap.companyName} (${overlap.overlapMonths.toFixed(1)} months)`
        );
      } else {
        console.log(
          `   ⏭️  Relationship already exists: ${hci.full_name} ↔ candidate ${candidateId}`
        );
      }
    }
  }

  console.log(`✅ Sync complete: ${relationshipsCreated.length} new relationships created`);
}

/**
 * Main function: Syncs relationships for a specific hyperconnector
 * Checks candidates in candidate_connections that are not yet in hyperconnector_candidates
 * If there's work overlap, creates record in hyperconnector_candidates
 */
export async function syncHyperconnectorCandidateRelationshipsForHyperconnector(
  hyperconnectorId: string
): Promise<void> {
  console.log(`🔄 Syncing relationships for hyperconnector: ${hyperconnectorId}`);

  // Get hyperconnector's candidate_id
  const hciCandidateId = await getHyperconnectorCandidateId(hyperconnectorId);
  if (!hciCandidateId) {
    console.log(`   ⚠️ Hyperconnector ${hyperconnectorId} has no linked candidate profile`);
    return;
  }

  // Get hyperconnector's experience
  const hciExperiences = await getExperienceForCandidate(hciCandidateId);
  if (hciExperiences.length === 0) {
    console.log(`   ⚠️ No experience found for hyperconnector ${hyperconnectorId}`);
    return;
  }

  // Get candidates in hyperconnector's network from candidate_connections
  const { data: connections, error: connError } = await supabase
    .from("candidate_connections")
    .select("candidate_id")
    .eq("hyperconnector_id", hyperconnectorId);

  if (connError) {
    console.error(`   ❌ Error fetching candidate_connections: ${connError.message}`);
    return;
  }

  if (!connections || connections.length === 0) {
    console.log(`   ℹ️  No candidates found in candidate_connections for this hyperconnector`);
    return;
  }

  const candidateIds = connections.map((c: any) => c.candidate_id);
  console.log(`   📋 Found ${candidateIds.length} candidate(s) in network`);

  // Get candidates already in hyperconnector_candidates
  const { data: existingRelations, error: existingError } = await supabase
    .from("hyperconnector_candidates")
    .select("candidate_id")
    .eq("hyperconnector_id", hyperconnectorId);

  if (existingError) {
    console.warn(`   ⚠️ Error checking existing relationships: ${existingError.message}`);
  }

  const existingCandidateIds = new Set(
    (existingRelations || []).map((r: any) => r.candidate_id)
  );

  // Filter to only candidates NOT in hyperconnector_candidates
  const candidatesToCheck = candidateIds.filter(
    (candidateId: string) => !existingCandidateIds.has(candidateId) && candidateId !== hciCandidateId
  );

  if (candidatesToCheck.length === 0) {
    console.log(`   ✅ All candidates in network already have relationships in hyperconnector_candidates`);
    return;
  }

  console.log(`   🔍 Checking ${candidatesToCheck.length} candidate(s) without existing relationships`);

  const relationshipsCreated: OverlapResult[] = [];

  // For each candidate, check if they worked together
  for (const candidateId of candidatesToCheck) {
    const candidateExperiences = await getExperienceForCandidate(candidateId);
    if (candidateExperiences.length === 0) {
      console.log(`   ⏭️  Skipping candidate ${candidateId}: no experience found`);
      continue;
    }

    // Find overlaps
    const overlap = findWorkOverlaps(hyperconnectorId, hciExperiences, candidateId, candidateExperiences);

    if (overlap) {
      // Create relationship in hyperconnector_candidates only
      try {
        const { data: inserted, error: insertError } = await supabase
          .from("hyperconnector_candidates")
          .insert({
            hyperconnector_id: hyperconnectorId,
            candidate_id: candidateId,
            relationship_type: "worked_together",
            relationship_source: "automatic_match",
          })
          .select();

        if (insertError) {
          console.error(`   ❌ Error inserting for candidate ${candidateId}: ${insertError.message}`);
          console.error(`   Error details:`, JSON.stringify(insertError, null, 2));
        } else {
          relationshipsCreated.push(overlap);
          console.log(
            `   ✅ Created relationship: candidate ${candidateId} at ${overlap.companyName} (${overlap.overlapMonths.toFixed(1)} months)`
          );
        }
      } catch (error: any) {
        console.error(`   ❌ Exception inserting for candidate ${candidateId}: ${error.message}`);
      }
    } else {
      console.log(`   ⏭️  No overlap found for candidate ${candidateId}`);
    }
  }

  console.log(`✅ Sync complete: ${relationshipsCreated.length} new relationships created in hyperconnector_candidates`);
}

