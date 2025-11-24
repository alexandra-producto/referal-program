import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/db/supabaseClient";

/**
 * POST /api/jobs/upload-document
 * Sube un documento PDF a Supabase Storage y retorna la URL pública
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar que sea un PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 10MB" },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `job-documents/${timestamp}-${randomString}-${file.name}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from("job-documents") // Bucket name
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: false, // No sobrescribir si existe
      });

    if (error) {
      console.error("Error subiendo archivo a Supabase Storage:", error);
      
      // Si el bucket no existe, crear un mensaje más claro
      if (error.message?.includes("Bucket not found")) {
        return NextResponse.json(
          {
            error: "Bucket de almacenamiento no configurado. Contacta al administrador.",
            details: "El bucket 'job-documents' no existe en Supabase Storage",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Error al subir el archivo",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    // Obtener URL pública del archivo
    const {
      data: { publicUrl },
    } = supabase.storage.from("job-documents").getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: data.path,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Error en POST /api/jobs/upload-document:", error);
    return NextResponse.json(
      {
        error: "Error al procesar el archivo",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

