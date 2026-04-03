import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/transcription';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const fileEntry = formData.get('audio') || formData.get('file');

    if (!fileEntry) {
      return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 });
    }

    let fileToProcess: File | Blob;
    let fileName = 'upload.mp3';

    if (fileEntry instanceof File) {
      fileToProcess = fileEntry;
      fileName = fileEntry.name;
    } else {
      fileToProcess = new Blob([fileEntry as any]);
    }

    // IP for rate limiting
    let ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous-ip';
    // If multiple IPs, take the first one
    if (ip.includes(',')) ip = ip.split(',')[0].trim();

    const t0 = performance.now();
    console.log(`[POST /api/transcribe] Target file size: ${fileToProcess.size} bytes`);

    // The transcribeAudio function handles internal errors safely without crashing.
    const result = await transcribeAudio(fileToProcess, fileName, ip);

    console.log(`[POST /api/transcribe] Output length: ${result.transcript?.length || 0} extracted.`);

    if (result.success) {
      return NextResponse.json({
        success: true,
        provider: result.provider,
        transcript: result.transcript,
        processingTime: result.processingTime || (performance.now() - t0),
      });
    } else {
      // Respond safely gracefully
      return NextResponse.json({
        success: false,
        message: "AI service temporarily unavailable",
        errorInfo: result.error,
        processingTime: result.processingTime,
      }, { status: 429 }); // Use 429 for rate limit mapping or 503
    }
  } catch (err: any) {
    console.error('[POST /api/transcribe] Fatal Route Error:', err);
    return NextResponse.json({ success: false, message: 'AI service temporarily unavailable', details: err.message }, { status: 500 });
  }
}
