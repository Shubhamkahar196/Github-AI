// "use server"

// import Razorpay from "razorpay";
// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// // import payments from "razorpay/dist/types/payments";
// // import { Currency } from "lucide-react";
// // import products from "razorpay/dist/types/products";
// // import { success } from "zod/v4";
// // import { metadata } from "@/app/layout";
// import { redirect } from "next/dist/server/api-utils";

// const razorpay = new Razorpay({
//   key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });

// export async function POST(req: Request) {
//   const body = await req.json();
//   const { amount, currency, receipt } = body;

//   try {
//     const options = {
//       amount: amount * 100, // in paise
//       currency: currency || "INR",
//       receipt: receipt || "receipt#1",
//     };

//     const order = await razorpay.orders.create(options);

//     return NextResponse.json(order);
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
//   }
// }

// export async function createCheckoutSession(credits: number){
//     const {userId} = await auth()
//     if(!userId){
//         throw new Error("unauthorized")
//     }

//     const session = await razorpay.checkout.session({
//         payments_method_types: ['card'],
//         line_items: [
//             {
//                 price_data: {
//                     Currency: "INR",
//                     products_data:{
//                         name: `${credits} GitHub-AI credits`
//                     },
//                     unit_amount: Math.round((credits/50)*100)
//                 },
//                 quantity: 1
//             }
//         ],
//         customer_creation: 'always',
//         mode: 'payment',
//         success_url: `${process.env.NEXT_PUBLIC_APP_URL}/create`,
//         cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
//         client_reference_id: userId.toString(),
//         metadata: {
//             credits
//         }
//     })

//     return redirect(session.url!)
// }




"use server"

import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Backend API: Create Razorpay order
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { credits } = body;

  if (!credits || credits <= 0) {
    return NextResponse.json({ error: "Invalid credits amount" }, { status: 400 });
  }

  try {
    // Price per credit = ₹2 (example)
    const amountInPaise = Math.round(credits * 2 * 100); // Razorpay requires paise

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId,
        credits,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  }
}





export async function createCheckoutSession(credits: number) {
  try {
    // 1️⃣ Create Razorpay order from backend
    const { data: order } = await axios.post("/api/payment", { credits });

    // 2️⃣ Open Razorpay Checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "GitHub AI",
      description: `${credits} credits purchase`,
      order_id: order.id,
      handler: function (response: any) {
        alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
      },
      prefill: {
        name: "Shubham Kahar",
        email: "shubham@example.com",
        contact: "9999999999",
      },
      theme: { color: "#2563eb" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error("Payment failed:", error);
    alert("Payment failed");
  }
}
