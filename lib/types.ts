export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  patientId: string;
  patient: Patient;
  inputType: string;
  rawContent: string;
  transcription: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}
