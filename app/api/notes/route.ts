import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const notes = await prisma.note.findMany({
    include: { patient: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const patientId = formData.get("patientId") as string;
  const inputType = formData.get("inputType") as string;
  const textContent = formData.get("textContent") as string | null;
  const transcription = formData.get("transcription") as string | null;
  const audioFile = formData.get("audioFile") as File | null;

  if (!patientId) {
    return NextResponse.json(
      { error: "Patient ID is required" },
      { status: 400 }
    );
  }

  let rawContent = "";
  let audioData: Uint8Array<ArrayBuffer> | null = null;

  if (inputType === "text" && textContent) {
    rawContent = textContent;
  } else if (inputType === "audio" && transcription) {
    rawContent = transcription;
    if (audioFile) {
      const arrayBuffer = await audioFile.arrayBuffer();
      audioData = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
    }
  } else {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      patientId,
      inputType,
      rawContent,
      transcription: inputType === "audio" ? transcription : null,
      summary: null,
      audioData,
    },
    include: { patient: true },
  });

  return NextResponse.json(note);
}
