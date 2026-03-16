import { NextRequest, NextResponse } from "next/server";
import {auth} from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const ITEMS_PER_PAGE = 10;

export async function GET(req: NextRequest) {
    const {userId} =await auth();

    if (!userId) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {searchParams} = new URL(req.url);
    console.log("Search Params: ", searchParams);

    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || ""

}

export async function POST() {
    
}