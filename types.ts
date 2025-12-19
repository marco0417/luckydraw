
export interface Participant {
  id: string;
  name: string;
  department?: string;
}

export interface Prize {
  id: string;
  category: string; // e.g., 一等奖
  name: string;     // e.g., iPhone 15
  count: number;
  remaining: number;
  image?: string;
  rank: number;
}

export interface Winner {
  id: string;
  participantId: string;
  participantName: string;
  participantDepartment?: string;
  prizeId: string;
  prizeCategory: string;
  prizeName: string;
  timestamp: number;
}

export interface PresetWinner {
  prizeId: string;
  participantNames: string[]; // Names that MUST win this prize
}

export enum AppView {
  LOTTERY = 'LOTTERY',
  ADMIN = 'ADMIN'
}

export enum DrawEffect {
  GALACTIC = 'GALACTIC',
  MATRIX = 'MATRIX'
}
