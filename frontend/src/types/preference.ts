export interface PreferenceData {
    budget: number;
    styles: string[];
    mustGo: string[];
    mustAvoid: string[];
    activeTimes: string[];
    freeText: string;
}

export interface MemberPreference extends PreferenceData {
    id: number;
    name: string;
}