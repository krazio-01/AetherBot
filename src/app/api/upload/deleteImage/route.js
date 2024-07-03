import { NextResponse } from "next/server";
import cloudinary from "@/utils/cloudinaryConfig";

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);

    const imgUrl = searchParams.get("imgUrl");
    const Id = imgUrl.split("/").pop().split(".")[0];
    const publicId = `AetherBot/${Id}`;

    try {
        await cloudinary.uploader.destroy(publicId);
        return NextResponse.json({ message: "Image deleted" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}