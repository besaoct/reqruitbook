import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in request." },
        { status: 400 },
      );
    }

    // Size limit: 5 MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds maximum allowed limit of 5 MB." },
        { status: 400 },
      );
    }

    // Allowed extensions / MIME types
    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const originalName = file.name || "resume.pdf";
    const ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file format. Only PDF, DOC, and DOCX files are supported." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/resumes
    const uploadDir = join(process.cwd(), "public", "uploads", "resumes");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const cleanBaseName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/\.[^/.]+$/, "");
    const uniqueFileName = `${cleanBaseName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext}`;
    const filePath = join(uploadDir, uniqueFileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/resumes/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
      fileName: originalName,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file." },
      { status: 500 },
    );
  }
}
