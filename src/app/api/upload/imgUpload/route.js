import { NextResponse } from "next/server";
import cloudinary from "@/utils/cloudinaryConfig";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        const buffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);

        const result = await new Promise((resolve) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        resource_type: "auto",
                        folder: `AetherBot`,
                        upload_preset: "AetherBot",
                        quality: 70,
                    },
                    async (error, result) => {
                        if (error) return;
                        else resolve(result);
                    }
                )
                .end(fileBuffer);
        });

        return NextResponse.json(
            { imgUrl: result.secure_url },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ message: error.Message }, { status: 500 });
    }
}