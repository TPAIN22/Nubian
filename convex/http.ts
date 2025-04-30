import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from 'svix';
import { api } from "./_generated/api";
const http = httpRouter();

http.route({
  method: "POST",
  path: "/clerk-webhook",
  handler: httpAction(async (ctx, req) => {
    const webhookSecret = process.env.clerkSecret;
    if (!webhookSecret) {
      throw new Error("Missing webhook secret");
    }
    
    const svix_id = req.headers.get("svix-id");
    const svix_timestamp = req.headers.get("svix-timestamp");
    const svix_signature = req.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);
    const wh = new Webhook(webhookSecret);

    let evt: any;
    try {
      evt = wh.verify(
        body,
        {
          "svix-id": svix_id,
          "svix-timestamp": svix_timestamp,
          "svix-signature": svix_signature
        }
      );
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return new Response("Invalid signature", { status: 400 });
    }

    const eventType = evt.type;
    if (eventType === "user.created") {
      const { id, email_addresses, first_name, image_url } = evt.data;
      const email = email_addresses[0].email_address;
      const username = email.split("@")[0];

      try {
        await ctx.runMutation(api.users.createUser.createUser,{
          clerkId: id,
          email,
          first_name,
          image_url,
          isAdmin: false,
          username,
        });
      } catch (error) {
        console.error("Error creating user:", error);
        return new Response("Error creating user", { status: 400 });
      }
    } else {
      console.log("Unhandled event type:", eventType);
    }

    return new Response("OK", { status: 200 });
  })
});

export default http