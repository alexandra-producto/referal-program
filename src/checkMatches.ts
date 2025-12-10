import "./config/env";
import { supabase } from "./db/supabaseClient";

async function checkMatches() {
  const jobId = "12cb6910-8019-449e-ae27-b1fb14a8cf6f";
  
  const { data: matches, error } = await supabase
    .from("job_candidate_matches")
    .select("candidate_id, match_score, match_source")
    .eq("job_id", jobId)
    .gt("match_score", 60)
    .order("match_score", { ascending: false })
    .limit(20);
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Matches con score > 60%:");
  console.log("");
  matches?.forEach((m, idx) => {
    console.log(`${idx + 1}. Candidate ${m.candidate_id.substring(0, 8)}... - Score: ${m.match_score}% - Source: ${m.match_source || "N/A"}`);
  });
  
  console.log("");
  console.log("Total:", matches?.length || 0);
  
  // Verificar distribución por source
  const bySource = new Map();
  matches?.forEach((m: any) => {
    const source = m.match_source || "null";
    bySource.set(source, (bySource.get(source) || 0) + 1);
  });
  
  console.log("");
  console.log("Distribución por source:");
  bySource.forEach((count, source) => {
    console.log(`  - ${source}: ${count}`);
  });
  
  // Verificar cuántos cumplen los criterios
  const validMatches = matches?.filter((m: any) => {
    return m.match_score > 60 && m.match_source !== "auto";
  }) || [];
  
  console.log("");
  console.log(`Matches válidos (score > 60% y source != 'auto'): ${validMatches.length}`);
}

checkMatches();

