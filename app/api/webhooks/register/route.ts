import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {

  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET to .env");
  }

  const headerPayload = await headers();
  console.log("headerPayload-svix-id: ",headerPayload.get("svix-id"))
  console.log("headerPayload-svix-timestamp: ",headerPayload.get("svix-timestamp"))
  console.log("headerPayload-svix-signature: ",headerPayload.get("svix-signature"))

  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred - No Svix headers", { status: 400 });
  }

  const body = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;

    console.log(evt)

    console.log("Webhook verified:", evt.type);

  } catch (err) {
    console.error("Error verifying webhook", err);
    return new Response("Verification failed", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    try {

      const { email_addresses, primary_email_address_id } = evt.data;
      console.log("email_addresses: ", email_addresses);
      

      const primaryEmail = email_addresses.find(
        (email) => email.id === primary_email_address_id
      );

      if (!primaryEmail) {
        return new Response("No primary email found", { status: 400 });
      }

      const newUser = await prisma.user.create({
        data: {
          id: evt.data.id,
          email: primaryEmail.email_address,
          isSubscribed: false
        }
      });

      console.log("New User Created:", newUser);

    } catch (error) {
      console.error("Database error:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  return new Response("Webhook received successfully", { status: 200 });
}