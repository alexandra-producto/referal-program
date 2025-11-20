import { supabase } from "./db/supabaseClient";

async function main() {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .limit(1);

  console.log("DATA:", data);
  console.log("ERROR:", error);
  console.log("ENV URL:", process.env.SUPABASE_URL);
  console.log("ENV KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 6) + "...");

}

main();
