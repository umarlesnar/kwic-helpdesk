//app/api/media/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getS3Service } from "@/lib/services/s3Service";
import { Media } from "@/lib/schemas/media.schema";
import { z } from "zod";

export const dynamic = "force-dynamic";

const confirmUploadSchema = z.object({
  s3Key: z.string().min(1, "S3 Key is required"),
  actualSize: z.number().optional(),
  filename: z.string().min(1, 'Filename is required'),
  originalName: z.string().min(1, 'Original name is required'),
  mimeType: z.string().min(1, 'Mime type is required'),
  uploadedBy: z.string().min(1, 'Uploader is required'),
  associatedWith: z.object({
    type: z.enum(['ticket', 'user', 'comment', 'system']),
    id: z.string().min(1, 'Associated ID is required')
  }),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  expiresAt: z.any().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/media/confirm
 * Confirm file upload completion
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Media upload confirmation request received");

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = confirmUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 422 }
      );
    }

    const { s3Key, actualSize, metadata, filename, originalName, mimeType, uploadedBy, associatedWith, tags, isPublic, expiresAt } = validation.data;

    const s3Service = getS3Service();

    // Confirm upload and create DB record
    const createdMedia = await s3Service.confirmUpload(
      s3Key,
      actualSize,
      {
        filename,
        originalName,
        mimeType,
        uploadedBy,
        associatedWith,
        tags,
        isPublic,
        expiresAt,
        metadata
      }
    );

    if (!createdMedia) {
      return NextResponse.json(
        { error: "Failed to confirm upload" },
        { status: 500 }
      );
    }

    // Generate thumbnail for images
    if (createdMedia.mimeType.startsWith("image/")) {
      try {
        await s3Service.generateThumbnail(createdMedia._id);
      } catch (error) {
        console.error("Error generating thumbnail:", error);
        // Don't fail the request if thumbnail generation fails
      }
    }

    console.log(`Confirmed upload for media ${createdMedia._id}`);

    return NextResponse.json({
      success: true,
      media: {
        id: createdMedia._id,
        filename: createdMedia.filename,
        originalName: createdMedia.originalName,
        mimeType: createdMedia.mimeType,
        size: createdMedia.size,
        url: createdMedia.url,
        thumbnailUrl: createdMedia.thumbnailUrl,
        isProcessed: createdMedia.isProcessed,
        createdAt: createdMedia.createdAt,
      },
    });
  } catch (error) {
    console.error("Media confirmation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
