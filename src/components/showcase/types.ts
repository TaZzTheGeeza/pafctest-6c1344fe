export interface ShowcasePlayer {
  name: string;
  number: number;
  role: string;
  photo: string;
  appearances?: number;
  goals?: number;
  assists?: number;
  potm?: number;
}

export interface ShowcaseCoach {
  name: string;
  role: string;
  photo: string;
}

export interface ShowcaseProps {
  teamName: string;
  players: ShowcasePlayer[];
  coaches: ShowcaseCoach[];
}
