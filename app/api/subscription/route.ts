import {NextResponse} from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { error } from "console";


export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    // capture Payment

    try {
        const user = await prisma.user.findUnique({where: {id: userId}})
        
        if (!user) {
            return NextResponse.json({error: "User not found"}, {status: 401})    
        }

        const susbscriptionEnds = new Date();
        susbscriptionEnds.setMonth(susbscriptionEnds.getMonth() + 1);

        const updatedUser = await prisma.user.update({
            where: {id: userId},
            data: {
                isSubscribed: true,
                subscriptionEnds: susbscriptionEnds
            }
        });

        return NextResponse.json({
            message: "Subscription successfully",
            susbscriptionEnds: updatedUser.subscriptionEnds
        })
    } catch (err) {
        console.error("Error Updating subscription ",err);
        return NextResponse.json({
            error: "Internal Server Error"
        }, {status: 500}
    )
    }
}


export async function GET() {
    const {userId} = await auth();

    console.log(userId);

    if (!userId) {
        return NextResponse.json({error: "Unauthorized "}, { status: 401})
    }

    try {
        const user = await prisma.user.findUnique({
            where: {id: userId},
            select: {
                isSubscribed: true,
                subscriptionEnds: true
            }
        });

        
        if (!user) {
            return NextResponse.json({error: "User not found"}, { status: 401})
        }

        const now = new Date();

        if (user.subscriptionEnds && user.subscriptionEnds < now) {
            await prisma.user.update({
                where: {id: userId},
                data: {
                    isSubscribed: false,
                    subscriptionEnds: null
                }
            });

            return NextResponse.json({
                isSubscribed: false,
                subscriptionEnds: null
            });
        }

        return NextResponse.json({
            isSubscribed: user.isSubscribed,
            subscriptionEnds: user.subscriptionEnds
        })
        
    } catch (err) {
        console.error("Error Updating subscription", err);
        return NextResponse.json(
            {error: "Internal Server error"},
            {status: 500}
        )
    }
}