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
    discipline_id?: number;
    discipline_name?: string;
    divisions: Division[];
    athletes: RegisteredAthlete[];
    judges: Judge[];
    headJudge?: HeadJudge[];
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
    stance: string | null;
    fis_num: number | null; // The database stores this as a number
}

// Represents a simple view of an athlete registered for an event.
//export interface RegisteredAthlete {
 //   athlete_id: number;
 //   first_name: string;
 //   last_name: string;
 //   bib_num?: string | null;
//}

// Extends RegisteredAthlete to include their specific division for roster lists.
export interface RegisteredAthleteWithDivision extends RegisteredAthlete {
    division_id: number;
    division_name: string;
}


// --- Athlete Registration Workflow Types ---

// Represents an athlete after the CSV is parsed and checked against the DB.
// This is what the server sends to the client for the review table.
export interface CheckedAthleteClient {
    csvIndex: number;
    status: 'matched' | 'new' | 'error';
    
    // Data as it appeared in the CSV file
    csvData: {
        last_name?: string;
        first_name?: string;
        dob?: string;
        gender?: string;
        nationality?: string | null;
        stance?: 'Regular' | 'Goofy' | '' | null;
        fis_num?: string | null;
    };

    // Details from the server's check
    validationError?: string;
    dbAthleteId?: number | null;
    dbDetails?: { // Data as it exists in the database
        first_name: string;
        last_name: string;
        dob: string;
        gender: string;
        nationality: string | null;
        stance: string | null;
        fis_num: number | null;
    };
    
    // UI state, managed on the client
    isSelected?: boolean;
    assigned_division_id?: number | null;
    suggested_division_id?: number | null;
    suggested_division_name?: string | null;
}

// Represents the final, cleaned data sent to the registration server action.
export interface AthleteToRegister {
    csvIndex: number;
    status: 'matched' | 'new';
    division_id: number;
    // We send the CSV data back, as it might have been corrected by the user.
    last_name?: string;
    first_name?: string;
    dob?: string;
    gender?: string;
    nationality?: string | null;
    stance?: string | null;
    fis_num?: number | null; // Note: number, as expected by the DB
    dbAthleteId?: number | null; // The ID if the athlete was matched
}

// Represents the outcome of a single athlete's registration attempt.
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