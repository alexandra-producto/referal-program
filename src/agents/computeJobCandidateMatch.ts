/**
 * Automatic Job-Candidate Matching System
 * 
 * Computes a match score (0-100) between a job and a candidate based on:
 * - Seniority (25%)
 * - Role/Skills (35%)
 * - Industry fit (20%)
 * - Location & Language (20%)
 */

// Configuration: weights for each component (should sum to 1.0)
export const MATCH_WEIGHTS = {
  seniority: 0.25,
  skills: 0.35,
  industry: 0.20,
  location_language: 0.20,
} as const;

// Seniority levels mapping
const SENIORITY_LEVELS: Record<string, number> = {
  intern: 1,
  junior: 2,
  mid: 3,
  mid_senior: 3.5,
  senior: 4,
  lead: 5,
  principal: 5,
  director: 6,
  vp: 7,
  c_level: 8,
};

// Industry keywords mapping for inference
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  mobility: ["mobility", "transport", "uber", "lyft", "ride", "taxi", "delivery", "logistics"],
  ev_charging: ["ev", "electric", "charging", "vehicle", "tesla", "battery"],
  consumer_apps: ["consumer", "mobile", "app", "ios", "android", "b2c"],
  saas: ["saas", "software", "b2b", "enterprise", "platform"],
  fintech: ["fintech", "finance", "payment", "banking", "crypto"],
  ecommerce: ["ecommerce", "retail", "marketplace", "shopping"],
};

// Type definitions
export interface Job {
  id: string;
  company_name: string;
  job_title: string;
  job_level?: string | null;
  location?: string | null;
  remote_ok?: boolean | null;
  description?: string | null;
  requirements_json?: {
    languages?: string[];
    seniority?: string;
    industries?: string[];
    must_have_skills?: string[];
    location_preference?: string[];
    nice_to_have_skills?: string[];
  } | null;
}

export interface Candidate {
  id: string;
  full_name: string;
  email?: string | null;
  linkedin_url?: string | null;
  current_job_title?: string | null;
  current_company?: string | null;
  industry?: string | null;
  seniority?: string | null;
  country?: string | null;
}

export interface CandidateExperience {
  id: string;
  candidate_id: string;
  company_name?: string | null;
  role_title?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  description?: string | null;
  experience_source?: string | null;
}

export interface MatchResult {
  score: number; // 0-100 with 2 decimal precision
  detail: {
    summary: string;
    components: {
      seniority: number; // 0-1
      skills: number; // 0-1
      industry: number; // 0-1
      location_language: number; // 0-1
    };
    strong_fit: string[];
    gaps: string[];
  };
}

/**
 * Normalizes text for comparison (lowercase, trim)
 */
function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text.toLowerCase().trim();
}

/**
 * Checks if a text contains any of the given keywords
 */
function containsKeywords(text: string, keywords: string[]): boolean {
  const normalized = normalizeText(text);
  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)));
}

/**
 * Calculates seniority match score (0-1)
 */
function calculateSeniorityScore(
  jobSeniority: string | null | undefined,
  candidateSeniority: string | null | undefined,
  experiences: CandidateExperience[]
): number {
  const jobLevel = normalizeText(jobSeniority);
  const candidateLevel = normalizeText(candidateSeniority);

  // Exact match
  if (jobLevel && candidateLevel && jobLevel === candidateLevel) {
    return 1.0;
  }

  // If both have seniority, compare levels
  if (jobLevel && candidateLevel) {
    const jobNum = SENIORITY_LEVELS[jobLevel] || 3;
    const candidateNum = SENIORITY_LEVELS[candidateLevel] || 3;
    const diff = Math.abs(jobNum - candidateNum);

    if (diff === 0) return 1.0;
    if (diff === 0.5) return 0.8;
    if (diff === 1) return 0.6;
    if (diff === 2) return 0.4;
    return 0.2; // Large gap
  }

  // Infer from job titles in experience
  if (jobLevel && !candidateLevel && experiences.length > 0) {
    const roleTitles = experiences
      .map((exp) => normalizeText(exp.role_title))
      .join(" ");

    // Check for seniority indicators in role titles
    const hasSenior = roleTitles.includes("senior") || roleTitles.includes("lead") || roleTitles.includes("principal");
    const hasMid = roleTitles.includes("mid");
    const hasJunior = roleTitles.includes("junior") || roleTitles.includes("intern");

    if (jobLevel.includes("senior") && hasSenior) return 0.8;
    if (jobLevel.includes("senior") && hasMid) return 0.5;
    if (jobLevel.includes("mid") && hasMid) return 0.8;
    if (jobLevel.includes("junior") && hasJunior) return 0.8;

    // Count years of experience (rough estimate)
    const yearsOfExperience = experiences.length * 2; // Rough estimate
    if (jobLevel.includes("senior") && yearsOfExperience >= 5) return 0.7;
    if (jobLevel.includes("mid") && yearsOfExperience >= 2) return 0.7;
  }

  // Default partial score if we can't determine
  return 0.5;
}

/**
 * Calculates skills match score (0-1)
 */
function calculateSkillsScore(
  job: Job,
  candidate: Candidate,
  experiences: CandidateExperience[]
): number {
  const requirements = job.requirements_json;
  if (!requirements) return 0.5; // Default if no requirements

  const mustHaveSkills = requirements.must_have_skills || [];
  const niceToHaveSkills = requirements.nice_to_have_skills || [];

  if (mustHaveSkills.length === 0 && niceToHaveSkills.length === 0) {
    return 0.5; // No skills to match
  }

  // Build searchable text from candidate
  const searchableText = [
    normalizeText(candidate.current_job_title),
    normalizeText(candidate.industry),
    ...experiences.map((exp) => normalizeText(exp.role_title)),
    ...experiences.map((exp) => normalizeText(exp.description)),
    ...experiences.map((exp) => normalizeText(exp.company_name)),
  ].join(" ");

  // Count matches
  let mustHaveMatches = 0;
  let niceToHaveMatches = 0;

  for (const skill of mustHaveSkills) {
    if (containsKeywords(searchableText, [skill])) {
      mustHaveMatches++;
    }
  }

  for (const skill of niceToHaveSkills) {
    if (containsKeywords(searchableText, [skill])) {
      niceToHaveMatches++;
    }
  }

  // Calculate score: must-have skills are more important
  const mustHaveWeight = 0.7;
  const niceToHaveWeight = 0.3;

  const mustHaveScore =
    mustHaveSkills.length > 0
      ? mustHaveMatches / mustHaveSkills.length
      : 0;
  const niceToHaveScore =
    niceToHaveSkills.length > 0
      ? niceToHaveMatches / niceToHaveSkills.length
      : 0;

  // Penalize heavily for missing must-have skills
  const baseScore =
    mustHaveScore * mustHaveWeight + niceToHaveScore * niceToHaveWeight;

  // If we have 0 must-have matches but there are must-have skills, heavily penalize
  if (mustHaveSkills.length > 0 && mustHaveMatches === 0) {
    return baseScore * 0.3; // Heavy penalty
  }

  return Math.min(1.0, baseScore);
}

/**
 * Calculates industry match score (0-1)
 */
function calculateIndustryScore(
  job: Job,
  candidate: Candidate,
  experiences: CandidateExperience[]
): number {
  const requirements = job.requirements_json;
  const jobIndustries = requirements?.industries || [];

  if (jobIndustries.length === 0) return 0.5; // Default if no industry specified

  // Build searchable text
  const searchableText = [
    normalizeText(candidate.industry),
    ...experiences.map((exp) => normalizeText(exp.company_name)),
    ...experiences.map((exp) => normalizeText(exp.role_title)),
    ...experiences.map((exp) => normalizeText(exp.description)),
  ].join(" ");

  // Check for exact industry matches
  let industryMatches = 0;
  for (const industry of jobIndustries) {
    const keywords = INDUSTRY_KEYWORDS[industry] || [industry];
    if (containsKeywords(searchableText, keywords)) {
      industryMatches++;
    }
  }

  // Exact match
  if (industryMatches === jobIndustries.length) return 1.0;
  if (industryMatches > 0) return 0.6 + (industryMatches / jobIndustries.length) * 0.3;

  // Check if it's still tech/product/SaaS (partial credit)
  const techKeywords = ["tech", "software", "saas", "product", "startup", "digital"];
  const isTechRelated = containsKeywords(searchableText, techKeywords);
  if (isTechRelated) return 0.4;

  // Completely unrelated
  return 0.2;
}

/**
 * Calculates location and language match score (0-1)
 */
function calculateLocationLanguageScore(
  job: Job,
  candidate: Candidate,
  experiences: CandidateExperience[]
): number {
  const requirements = job.requirements_json;
  const locationPreferences = requirements?.location_preference || [];
  const requiredLanguages = requirements?.languages || [];

  let locationScore = 0.5; // Default
  let languageScore = 0.5; // Default

  // Location matching
  if (locationPreferences.length > 0 && candidate.country) {
    const candidateCountry = normalizeText(candidate.country);
    const candidateLocation = normalizeText(
      experiences.find((exp) => exp.location)?.location || ""
    );

    for (const pref of locationPreferences) {
      const normalizedPref = normalizeText(pref);
      if (
        candidateCountry.includes(normalizedPref) ||
        normalizedPref.includes(candidateCountry) ||
        candidateLocation.includes(normalizedPref)
      ) {
        locationScore = 1.0;
        break;
      }

      // Check for "Latam" as a region
      if (
        (normalizedPref.includes("latam") || normalizedPref.includes("latin")) &&
        (candidateCountry.includes("mexico") ||
          candidateCountry.includes("colombia") ||
          candidateCountry.includes("argentina") ||
          candidateCountry.includes("chile") ||
          candidateCountry.includes("brazil") ||
          candidateCountry.includes("peru"))
      ) {
        locationScore = 0.9;
      }
    }

    // If remote_ok, give partial credit even if location doesn't match
    if (job.remote_ok && locationScore < 0.5) {
      locationScore = 0.6;
    }
  } else if (job.remote_ok) {
    // If remote_ok and no location preference, give full credit
    locationScore = 1.0;
  }

  // Language matching
  if (requiredLanguages.length > 0) {
    // For now, assume Latam-based product managers likely speak Spanish and some English
    // This is a heuristic - in the future, we could add a languages field to candidates
    const isLatamBased =
      candidate.country &&
      containsKeywords(normalizeText(candidate.country), [
        "mexico",
        "colombia",
        "argentina",
        "chile",
        "peru",
        "brazil",
      ]);

    if (isLatamBased) {
      const needsSpanish = requiredLanguages.some((lang) =>
        normalizeText(lang).includes("spanish")
      );
      const needsEnglish = requiredLanguages.some((lang) =>
        normalizeText(lang).includes("english")
      );

      if (needsSpanish) languageScore += 0.3; // Spanish likely
      if (needsEnglish) languageScore += 0.2; // English likely (partial)
    }

    // If only English required and candidate is from English-speaking country
    if (
      requiredLanguages.length === 1 &&
      normalizeText(requiredLanguages[0]).includes("english") &&
      candidate.country &&
      containsKeywords(normalizeText(candidate.country), [
        "usa",
        "united states",
        "uk",
        "united kingdom",
        "canada",
        "australia",
      ])
    ) {
      languageScore = 1.0;
    }

    languageScore = Math.min(1.0, languageScore);
  } else {
    languageScore = 1.0; // No language requirement
  }

  // Average of location and language
  return (locationScore + languageScore) / 2;
}

/**
 * Generates human-readable summary and gaps
 */
function generateMatchDetail(
  job: Job,
  candidate: Candidate,
  experiences: CandidateExperience[],
  components: MatchResult["detail"]["components"]
): { summary: string; strong_fit: string[]; gaps: string[] } {
  const strongFit: string[] = [];
  const gaps: string[] = [];

  // Strong fits
  if (components.seniority >= 0.7) {
    strongFit.push(
      `Strong seniority match: ${candidate.seniority || "experienced"} candidate for ${job.job_level || "role"} position.`
    );
  }

  if (components.skills >= 0.7) {
    const requirements = job.requirements_json;
    const matchedSkills = (requirements?.must_have_skills || []).filter((skill) => {
      const searchableText = [
        normalizeText(candidate.current_job_title),
        ...experiences.map((exp) => normalizeText(exp.role_title)),
      ].join(" ");
      return containsKeywords(searchableText, [skill]);
    });
    if (matchedSkills.length > 0) {
      strongFit.push(
        `Strong skills match: ${matchedSkills.join(", ")} experience found.`
      );
    }
  }

  if (components.industry >= 0.7) {
    strongFit.push(
      `Strong industry fit: ${candidate.industry || "relevant industry"} experience aligns with job requirements.`
    );
  }

  if (components.location_language >= 0.8) {
    strongFit.push(
      `Location and language alignment: ${candidate.country || "location"} matches preferences.`
    );
  }

  // Gaps
  if (components.skills < 0.5) {
    const requirements = job.requirements_json;
    const missingSkills = (requirements?.must_have_skills || []).filter((skill) => {
      const searchableText = [
        normalizeText(candidate.current_job_title),
        ...experiences.map((exp) => normalizeText(exp.role_title)),
      ].join(" ");
      return !containsKeywords(searchableText, [skill]);
    });
    if (missingSkills.length > 0) {
      gaps.push(`Missing key skills: ${missingSkills.join(", ")}.`);
    }
  }

  if (components.industry < 0.5) {
    const requirements = job.requirements_json;
    const industries = requirements?.industries || [];
    if (industries.length > 0) {
      gaps.push(
        `Limited experience in required industries: ${industries.join(", ")}.`
      );
    }
  }

  if (components.seniority < 0.5) {
    gaps.push(
      `Seniority mismatch: candidate level may not align with ${job.job_level || "required"} position.`
    );
  }

  // Generate summary
  const totalScore =
    components.seniority * MATCH_WEIGHTS.seniority +
    components.skills * MATCH_WEIGHTS.skills +
    components.industry * MATCH_WEIGHTS.industry +
    components.location_language * MATCH_WEIGHTS.location_language;

  let summary = "";
  if (totalScore >= 0.7) {
    summary = `Strong match: ${candidate.full_name} has relevant experience and aligns well with ${job.job_title} at ${job.company_name}.`;
  } else if (totalScore >= 0.5) {
    summary = `Moderate match: ${candidate.full_name} has some relevant experience but may have gaps in specific requirements.`;
  } else {
    summary = `Weak match: ${candidate.full_name} has limited alignment with the job requirements.`;
  }

  return { summary, strong_fit: strongFit, gaps };
}

/**
 * Main function: computes job-candidate match score
 */
export function computeJobCandidateMatch(
  job: Job,
  candidate: Candidate,
  experiences: CandidateExperience[]
): MatchResult {
  // Calculate component scores
  const seniorityScore = calculateSeniorityScore(
    job.job_level || job.requirements_json?.seniority,
    candidate.seniority,
    experiences
  );

  const skillsScore = calculateSkillsScore(job, candidate, experiences);

  const industryScore = calculateIndustryScore(job, candidate, experiences);

  const locationLanguageScore = calculateLocationLanguageScore(
    job,
    candidate,
    experiences
  );

  const components = {
    seniority: seniorityScore,
    skills: skillsScore,
    industry: industryScore,
    location_language: locationLanguageScore,
  };

  // Calculate weighted total score
  const totalScore =
    components.seniority * MATCH_WEIGHTS.seniority +
    components.skills * MATCH_WEIGHTS.skills +
    components.industry * MATCH_WEIGHTS.industry +
    components.location_language * MATCH_WEIGHTS.location_language;

  // Round to 2 decimal places and convert to 0-100 scale
  const finalScore = Math.round(totalScore * 100 * 100) / 100;

  // Generate detail
  const { summary, strong_fit, gaps } = generateMatchDetail(
    job,
    candidate,
    experiences,
    components
  );

  return {
    score: finalScore,
    detail: {
      summary,
      components,
      strong_fit,
      gaps,
    },
  };
}

