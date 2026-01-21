"use client";

import { useState, useEffect, useRef } from "react";
import { Patient, Note } from "@/lib/types";

type View = "list" | "create" | "detail";

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
  }
  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
  }
}

export default function Home() {
  const [view, setView] = useState<View>("list");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [inputType, setInputType] = useState<"text" | "audio">("text");
  const [textContent, setTextContent] = useState("");
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const fetchPatients = async () => {
    const res = await fetch("/api/patients");
    const data = await res.json();
    setPatients(data);
  };

  const fetchNotes = async () => {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchPatients();
      await fetchNotes();
    };
    fetchData();
  }, []);

  const startRecording = async () => {
    const SpeechRecognition = window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscription((prev) => prev + " " + finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch {
      console.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("patientId", selectedPatient);
    formData.append("inputType", inputType);

    if (inputType === "text") {
      formData.append("textContent", textContent);
    } else {
      formData.append("transcription", transcription.trim());
      if (audioBlob) {
        formData.append("audioFile", audioBlob, "recording.webm");
      }
    }

    await fetch("/api/notes", { method: "POST", body: formData });
    setIsSubmitting(false);
    setTextContent("");
    setTranscription("");
    setAudioBlob(null);
    setSelectedPatient("");
    fetchNotes();
    setView("list");
  };

  const viewNote = (note: Note) => {
    setSelectedNote(note);
    setView("detail");
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-black border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">AI Scribe Notes</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setView("list");
                setSelectedNote(null);
              }}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                view === "list"
                  ? "bg-white text-black"
                  : "bg-transparent text-white border border-neutral-700 hover:border-neutral-500"
              }`}
            >
              Notes List
            </button>
            <button
              onClick={() => setView("create")}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                view === "create"
                  ? "bg-white text-black"
                  : "bg-transparent text-white border border-neutral-700 hover:border-neutral-500"
              }`}
            >
              + New Note
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === "list" && (
          <div className="bg-neutral-900 rounded-xl border border-neutral-800">
            <div className="p-4 border-b border-neutral-800">
              <h2 className="text-lg font-semibold text-white">
                Clinical Notes
              </h2>
            </div>
            {notes.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                No notes yet. Create your first note!
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => viewNote(note)}
                    className="p-4 hover:bg-neutral-800 cursor-pointer transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">
                          {note.patient.name}
                        </h3>
                        <p className="text-sm text-neutral-400">
                          {formatDate(note.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          note.inputType === "audio"
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}
                      >
                        {note.inputType}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-300 line-clamp-2">
                      {note.rawContent}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "create" && (
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
            <h2 className="text-lg font-semibold mb-6 text-white">
              Create New Note
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Select Patient
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-white focus:border-white"
                  required
                >
                  <option value="">-- Select a patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({calculateAge(p.dob)} y/o, {p.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Input Type
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setInputType("text")}
                    className={`flex-1 p-3 rounded-lg border-2 transition ${
                      inputType === "text"
                        ? "border-white bg-white/10 text-white"
                        : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                    }`}
                  >
                    <span className="text-2xl">📝</span>
                    <p className="mt-1 font-medium">Text Input</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputType("audio")}
                    className={`flex-1 p-3 rounded-lg border-2 transition ${
                      inputType === "audio"
                        ? "border-white bg-white/10 text-white"
                        : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                    }`}
                  >
                    <span className="text-2xl">🎤</span>
                    <p className="mt-1 font-medium">Voice Recording</p>
                  </button>
                </div>
              </div>

              {inputType === "text" ? (
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Note Content
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={8}
                    className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-white focus:border-white"
                    placeholder="Enter clinical notes here..."
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Voice Recording
                  </label>
                  <div className="border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center">
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`px-6 py-3 rounded-full font-medium transition ${
                        isRecording
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-white text-black hover:bg-neutral-200"
                      }`}
                    >
                      {isRecording ? "⏹ Stop Recording" : "🎤 Start Recording"}
                    </button>
                    <p className="mt-2 text-sm text-neutral-400">
                      {isRecording
                        ? "Recording... speak clearly"
                        : "Click to start voice recording (English)"}
                    </p>
                    {transcription && (
                      <div className="mt-4 p-4 bg-neutral-800 rounded-lg text-left">
                        <p className="text-sm font-medium text-neutral-300 mb-1">
                          Transcription:
                        </p>
                        <p className="text-neutral-200">{transcription}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedPatient ||
                  (inputType === "text" ? !textContent : !transcription)
                }
                className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? "Saving..." : "Save Note"}
              </button>
            </form>
          </div>
        )}

        {view === "detail" && selectedNote && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-neutral-900 rounded-xl border border-neutral-800">
              <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">
                  Note Details
                </h2>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedNote.inputType === "audio"
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {selectedNote.inputType === "audio" ? "🎤 Voice" : "📝 Text"}
                </span>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-2">
                    Raw Content
                  </h3>
                  <div className="p-4 bg-neutral-800 rounded-lg whitespace-pre-wrap text-neutral-200">
                    {selectedNote.rawContent}
                  </div>
                </div>
                {selectedNote.summary && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-400 mb-2">
                      AI Summary (SOAP Format)
                    </h3>
                    <div className="p-4 bg-emerald-500/10 rounded-lg whitespace-pre-wrap border border-emerald-500/30 text-emerald-200">
                      {selectedNote.summary}
                    </div>
                  </div>
                )}
                <p className="text-sm text-neutral-500">
                  Created: {formatDate(selectedNote.createdAt)}
                </p>
              </div>
            </div>
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 h-fit">
              <div className="p-4 border-b border-neutral-800">
                <h2 className="text-lg font-semibold text-white">
                  Patient Info
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-neutral-500">Name</p>
                  <p className="font-medium text-white">
                    {selectedNote.patient.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Date of Birth</p>
                  <p className="font-medium text-white">
                    {new Date(selectedNote.patient.dob).toLocaleDateString()} (
                    {calculateAge(selectedNote.patient.dob)} years old)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Gender</p>
                  <p className="font-medium text-white">
                    {selectedNote.patient.gender}
                  </p>
                </div>
                {selectedNote.patient.phone && (
                  <div>
                    <p className="text-sm text-neutral-500">Phone</p>
                    <p className="font-medium text-white">
                      {selectedNote.patient.phone}
                    </p>
                  </div>
                )}
                {selectedNote.patient.address && (
                  <div>
                    <p className="text-sm text-neutral-500">Address</p>
                    <p className="font-medium text-white">
                      {selectedNote.patient.address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
