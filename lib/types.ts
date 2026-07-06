// Shared types for the Journey Planner feature

export interface StationMatch {
  id: string;
  name: string;
  modes: string[];
}

export interface ParsedJourney {
  from: string;
  to: string;
  arriveBy: string | null;
  departAt: string | null;
}

export interface JourneyLeg {
  mode: string;
  lineName: string;
  duration: number;
  instruction: string;
  from: string;
  to: string;
  departureTime: string | null;
  arrivalTime: string | null;
}

export interface Journey {
  duration: number;
  departureTime: string | null;
  arrivalTime: string | null;
  fare: number | null;
  legs: JourneyLeg[];
}

export interface LineStatus {
  id: string;
  name: string;
  status: string;
  reason: string | null;
}
