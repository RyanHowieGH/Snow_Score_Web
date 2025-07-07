// lib/definitions.ts

// Basic event structure for lists (public and admin)
export interface SnowEvent {
    event_id: number;
    name: string;
    start_date: Date; // Expect this to be a Date object after fetching
    end_date: Date;   // Expect this to be a Date object after fetching
    location: string;
    status?: string; // Optional: if you want to show status in lists
}

// Full event details structure
export interface EventDetails extends SnowEvent {
    status: string; // Make status required for detailed view
    discipline_id?: number;
    discipline_name?: string;
    divisions: Division[];
    athletes: RegisteredAthlete[];
    judges: Judge[];
    headJudge?: HeadJudge[]; // Changed to optional as it might not always be present
}

export interface Division {
    division_id: number;
    division_name: string;
    num_rounds: number; // Number of rounds for this division
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
}

export interface HeadJudge {
    event_id: number;
    user_id: number; // Assuming this is the ss_users.user_id
    event_role: string;
    first_name: string;
    last_name: string;
    email: string;
    role_id: number; // Assuming this is ss_roles.role_id
}

export interface Discipline {
    discipline_id: string;
    category_name: string;
    subcategory_name: string;
    discipline_name: string;
}

export interface Athlete {
    athlete_id: number;
    last_name: string;
    first_name: string;
    dob: Date;
    gender: string;
    nationality: string | null;
    stance: string | null;
    fis_num: string | null; // Can be string if it contains non-numeric, or number if purely numeric
}

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
    // 'name' stands for the event's name
}

export type HeatForSchedule = {
  round_heat_id: number;
  heat_num: number;
  start_time: string | null; // Timestamps can be returned as strings
  end_time: string | null;
  round_name: string;
  division_name: string;
};

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

// A discriminated union for our flat schedule list
// This is the structure for every item on our unified timeline.
// It's a "discriminated union" based on the 'type' property.
// This is the new structure for our list. Each item is a heat
// that knows about its parent round and division.
export type ScheduleHeatItem = {
  id: string;
  heat_id: number;
  heat_num: number;
  round_name: string;
  division_name: string;
  start_time: string | null;
  end_time: string | null; // <-- ADD THIS LINE
  schedule_sequence: number | null;
};
// Add other shared types here as your application grows