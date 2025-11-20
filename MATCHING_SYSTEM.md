# Automatic Job-Candidate Matching System

This system automatically computes match scores between jobs and candidates based on multiple criteria.

## Overview

The matching system evaluates candidates against jobs using four weighted components:

1. **Seniority** (25%): Compares job level requirements with candidate's seniority
2. **Skills** (35%): Matches required skills against candidate's experience
3. **Industry** (20%): Evaluates industry alignment
4. **Location & Language** (20%): Checks location preferences and language requirements

## Architecture

### Core Components

1. **`src/agents/computeJobCandidateMatch.ts`**
   - Pure function that computes match scores
   - Configurable weights via `MATCH_WEIGHTS` constant
   - Returns score (0-100) and detailed breakdown

2. **`src/agents/matchJobCandidate.ts`**
   - Service layer that fetches data and saves matches
   - Functions:
     - `matchJobCandidate(jobId, candidateId)`: Match one job with one candidate
     - `matchJobWithAllCandidates(jobId)`: Match a job with all candidates
     - `matchCandidateWithAllJobs(candidateId)`: Match a candidate with all jobs

3. **API Routes**
   - `POST /api/jobs/[id]/match`: Trigger matching for a job
   - `POST /api/candidates/[id]/match`: Trigger matching for a candidate

4. **Domain Functions**
   - `createJob(job, { triggerMatching: true })`: Create job and optionally trigger matching
   - `createCandidate(candidate, { triggerMatching: true })`: Create candidate and optionally trigger matching

## Database Schema

The `job_candidate_matches` table stores match results:

```sql
CREATE TABLE job_candidate_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  match_score NUMERIC(5,2) NOT NULL,  -- 0-100
  match_detail JSONB NOT NULL,         -- Detailed breakdown
  match_source TEXT DEFAULT 'auto',    -- 'auto' or 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, candidate_id)
);
```

## Usage

### Manual Matching

```typescript
import { matchJobCandidate } from "./agents/matchJobCandidate";

// Match a specific job with a specific candidate
const result = await matchJobCandidate(jobId, candidateId);
console.log(`Match score: ${result.score}%`);
console.log(`Details:`, result.detail);
```

### Trigger Matching After Insert

```typescript
import { createJob } from "./domain/jobs";
import { createCandidate } from "./domain/candidates";

// Create job and automatically match with all candidates
const job = await createJob(jobData, { triggerMatching: true });

// Create candidate and automatically match with all jobs
const candidate = await createCandidate(candidateData, { triggerMatching: true });
```

### API Endpoints

```bash
# Match a job with all candidates
curl -X POST http://localhost:3000/api/jobs/{jobId}/match

# Match a candidate with all jobs
curl -X POST http://localhost:3000/api/candidates/{candidateId}/match
```

### Testing

```bash
# Test the matching system
npm run test:matching
```

## Matching Logic Details

### Seniority Matching

- Exact match: 100%
- 1 level difference: 60-80%
- 2+ levels difference: 20-40%
- Infers from role titles if seniority not explicitly set

### Skills Matching

- Searches in: `current_job_title`, `industry`, and all `candidate_experience` fields
- Must-have skills: 70% weight, heavy penalty if missing
- Nice-to-have skills: 30% weight
- Uses keyword matching (case-insensitive)

### Industry Matching

- Exact industry match: 100%
- Related tech/product/SaaS: 40-60%
- Unrelated: 20%
- Uses keyword inference from company names and role titles

### Location & Language

- Location: Checks if candidate's country matches job preferences
- Supports "Latam" as a region (matches Mexico, Colombia, etc.)
- Remote jobs: Full credit if `remote_ok = true`
- Language: Heuristics based on candidate location (Latam → Spanish + English)

## Configuration

Weights can be adjusted in `src/agents/computeJobCandidateMatch.ts`:

```typescript
export const MATCH_WEIGHTS = {
  seniority: 0.25,
  skills: 0.35,
  industry: 0.20,
  location_language: 0.20,
};
```

## Match Detail Structure

The `match_detail` JSONB field contains:

```json
{
  "summary": "Strong match: Candidate has relevant experience...",
  "components": {
    "seniority": 0.7,
    "skills": 0.65,
    "industry": 0.4,
    "location_language": 0.95
  },
  "strong_fit": [
    "Strong seniority match...",
    "Strong skills match: product_management, mobile_apps..."
  ],
  "gaps": [
    "Missing key skills: geo_data, maps",
    "Limited experience in required industries: mobility, ev_charging"
  ]
}
```

## Performance Considerations

- Matching runs asynchronously to not block inserts
- Batch processing (10 candidates/jobs at a time) for bulk operations
- Results are upserted (updates existing matches)

## Future Enhancements

- Add language field to candidates table for more accurate language matching
- Machine learning model for more sophisticated scoring
- Real-time matching via database triggers (Postgres functions)
- Caching of match results
- Configurable weights per job or candidate type

