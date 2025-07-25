// lib\definitions.ts

// --- Core Application Models ---

export interface SnowEvent {
    event_id: number;
    name: string;
    start_date: Date;
    end_date: Date;
    location: string;
    status?: string;
}

export interface EventDetails extends SnowEvent {
    status: string;
    discipline_id?: string; // Discipline ID can be a string
    discipline_name?: string;
    // --- VVV ADD THESE NEW OPTIONAL FIELDS VVV ---
    category_name?: string;
    subcategory_name?: string;
    // --- ^^^ END OF NEW FIELDS ^^^ ---
    divisions: Division[];
    athletes: RegisteredAthlete[];
    judges: Judge[];
    headJudge?: HeadJudge[];
    rounds?: RoundWithHeats[];
}

export interface Division {
    division_id: number;
    division_name: string;
    num_rounds: number;
}

export interface Judge {
    personnel_id: string;
    header: string;
    name: string;
    event_id: number;
}


export interface RegisteredAthlete {
    athlete_id: number;
    first_name: string;
    last_name: string;
    bib_num?: string | null; // Made bib_num optional string or null
    division_id: number;
}


export interface HeadJudge {
    event_id: number;
    user_id: number;
    event_role: string;
    first_name: string;
    last_name: string;
    email: string;
    role_id: number;
}

export interface Discipline {
    discipline_id: string;
    category_name: string;
    subcategory_name: string;
    discipline_name: string;
}

// Represents an athlete profile as stored in the `ss_athletes` table.
export interface Athlete {
    athlete_id: number;
    last_name: string;
    first_name: string;
    dob: Date;
    gender: string;
    nationality: string | null;
    stance: 'Regular' | 'Goofy' | null;
    fis_num: number | null;
    // ADDED POINTS
    fis_hp_points: number | null;
    fis_ss_points: number | null;
    fis_ba_points: number | null;
    wspl_points: number | null;
}

export interface RegisteredAthleteWithDivision extends RegisteredAthlete {
    division_id: number;
    division_name: string;
}

// --- Athlete Registration Workflow Types ---

// Helper type for what an athlete from the DB looks like when stringified for the UI
export type AthleteAsString = {
    athlete_id: number;
    last_name: string;
    first_name: string;
    dob: string; // dob is a string here
    gender: string;
    nationality: string | null;
    stance: 'Regular' | 'Goofy' | null;
    fis_num: number | null; // Keep as number to match Athlete type
    fis_hp_points: number | null;
    fis_ss_points: number | null;
    fis_ba_points: number | null;
    wspl_points: number | null;
};

export interface CheckedAthleteClient {
    csvIndex: number;
    status: 'matched' | 'new' | 'error' | 'conflict';
    csvData: {
        last_name: string;
        first_name: string;
        dob: string;
        gender: string;
        nationality: string | null;
        stance: 'Regular' | 'Goofy' | '' | null;
        fis_num: string | null;
        fis_hp_points?: any;
        fis_ss_points?: any;
        fis_ba_points?: any;
        wspl_points?: any;
    };
    validationError?: string;
    dbAthleteId?: number | null;
    dbDetails?: AthleteAsString;
    conflictDetails?: {
        conflictOn: 'fis_num' | 'name+dob';
        conflictingAthlete: AthleteAsString;
    };
    // UI state
    isSelected?: boolean;
    isOverwrite?: boolean;
    assigned_division_id?: number | null;
    suggested_division_id?: number | null;
    suggested_division_name?: string | null;
}

export interface AthleteToRegister {
    csvIndex: number;
    status: 'matched' | 'new';
    division_id: number;
    last_name: string;
    first_name: string;
    dob: string;
    gender: string;
    nationality: string | null;
    stance: 'Regular' | 'Goofy' | null;
    fis_num: number | null;
    dbAthleteId?: number | null;
    isOverwrite?: boolean;
    // ADDED POINTS
    fis_hp_points?: number | null;
    fis_ss_points?: number | null;
    fis_ba_points?: number | null;
    wspl_points?: number | null;
}


export interface RegistrationResultDetail {
    athleteName: string;
    status: string;
    error?: string;
}


// --- Scheduling Types ---

export interface JudgingPanelPerEvent {
    event_id: number;
    division_id: number;
    division_name: string;
    round_id: number;
    round_heat_id: number;
    heat_num: number;
    personnel_id: number;
    name: string;
    round_name: string;
    judge_name: string;
    judge_header: string;
    passcode: number;
}

export type Heat = {
  round_heat_id: number;
  heat_num: number;
  start_time: string | null;
  end_time: string | null;
  heat_sequence: number;
};

export type RoundWithHeats = {
  round_id: number;
  round_name: string;
  round_sequence: number;
  division_id: number;
  division_name: string;
  heats: Heat[];
};

export type HeatForSchedule = {
  round_heat_id: number;
  heat_num: number;
  start_time: string | null;
  end_time: string | null;
  round_name: string;
  division_name: string;
};

export type ScheduleHeatItem = {
  id: string;
  heat_id: number;
  heat_num: number;
  round_name: string;
  division_name: string;
  start_time: string | null;
  end_time: string | null;
  schedule_sequence: number | null;
};

// --- Article Generation Types ---

export interface PodiumAthlete {
    rank: number;
    first_name: string;
    last_name: string;
    nationality: string | null;
}

export interface EventResult {
    division_name: string;
    podium: PodiumAthlete[];
}

export interface ArticleData extends EventDetails {
    results: EventResult[];
    top_canadians: PodiumAthlete[];
}

export type UserWithRole = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_name: string;
  auth_provider_user_id: string; // This is the Clerk ID needed for deletion
};


export type CompetitionHJData = {
    event_name: string,
    divisions: DivisionHJData[], 
}

export type DivisionHJData = {
  division_id: number;
  division_name: string;
  rounds: RoundHJData[];
};

export type RoundHJData = {
  round_id: number;
  round_name: string;
  num_heats: number;
  heats: HeatHJData[];
};

export type HeatHJData = {
    round_heat_id: number,
    heat_num: number,
    num_runs: number,
    start_time: Date,
    end_time: Date,
}

export type ScoresHJData = {
    athlete_id: number;
    run_average: number;
    best_heat_average: number;
    scores: RunScoresHJData[];
}

export type RunScoresHJData = {
    run_result_id: number;
    personnel_id: number;
    header: string;
    name: string;
    run_num: number;
    score: number;
}
