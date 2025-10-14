// "use client"

// import { Button } from '@/components/ui/button'
// import { Slider } from '@/components/ui/slider'
// import { createCheckoutSession } from '@/lib/stripe'
// import { api } from '@/trpc/react'
// import { Info } from 'lucide-react'
// import React ,{useState} from 'react'

// const BillingPage = () => {
//     const {data: user} = api.project.getMyCredits.useQuery()
//     const [creditsToBuy, setCreditsToBuy] = useState<number[]>([100])
//     const creditsToBuyAmount = creditsToBuy[0]!
//     const price = (creditsToBuyAmount/50).toFixed(2)
//   return (
//     <div>
          
//           <h1 className='text-xl font-semibold'>Billing</h1>
//           <div className='h-2'></div>
//           <p className='text-sm text-gray-500'>
//             You currently have {user?.credits} credits
//           </p>

//           <div className="h-2"></div>

//           <div className='bg-blue-50 px-4 py-2 rounded-md border bordeer-blue-200 text-blue-700'>
//             <div className='flex itmes-center gap-2'>
//                 <Info className='size-4' />
//                 <p className='text-sm'>Each credit allows you to index 1 file in a repository</p>
//             </div>
//             <p className='text-sm'>E.g. If your project has 100 files. you will need 100 credits to index it.</p>
//           </div>

//           <div className="h-4"></div>
//           <Slider defaultValue={[100]} max={1000} min={10} step={10} onValueChange={value => setCreditsToBuy(value)} value={creditsToBuy} />

//             <div className="h-4"></div>

//             <Button onClick={() =>{
//                 createCheckoutSession(creditsToBuyAmount)
//             }}>
//                 Buy {creditsToBuyAmount} credits for ₹{price}
//             </Button>

//     </div>
//   )
// }

// export default BillingPage






"use client"

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Info } from 'lucide-react'
import React, { useState } from 'react'
import { api } from '@/trpc/react'
import axios from 'axios'

const BillingPage = () => {
  // Get user credits from TRPC
  const { data: user } = api.project.getMyCredits.useQuery()
  
  // Slider state for credits to buy
  const [creditsToBuy, setCreditsToBuy] = useState<number[]>([100])
  const credits = creditsToBuy[0]!

  // Price calculation: ₹2 per credit
  const price = (credits * 2).toFixed(2)

  const handleBuyCredits = async () => {
    try {
      // 1️⃣ Call backend API to create Razorpay order
      const { data: order } = await axios.post("/api/payment", { credits })

      // 2️⃣ Configure Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "GitHub AI",
        description: `${credits} credits purchase`,
        order_id: order.id,
        handler: function (response: any) {
          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`)
        },
        prefill: {
          name: "Shubham Kahar",
          email: "shubham@example.com",
          contact: "9999999999",
        },
        theme: { color: "#2563eb" },
      }

      // 3️⃣ Open Razorpay checkout
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error("Payment failed:", err)
      alert("Payment failed. Please try again.")
    }
  }

  return (
    <div className='max-w-xl mx-auto p-4'>
      <h1 className='text-xl font-semibold'>Billing</h1>
      <div className='h-2' />

      <p className='text-sm text-gray-500'>
        You currently have <strong>{user?.credits || 0}</strong> credits
      </p>

      <div className="h-4" />

      <div className='bg-blue-50 px-4 py-2 rounded-md border border-blue-200 text-blue-700'>
        <div className='flex items-center gap-2'>
          <Info className='w-4 h-4' />
          <p className='text-sm'>Each credit allows you to index 1 file in a repository</p>
        </div>
        <p className='text-sm mt-1'>E.g., if your project has 100 files, you will need 100 credits to index it.</p>
      </div>

      <div className="h-4" />

      <Slider
        defaultValue={[100]}
        max={1000}
        min={10}
        step={10}
        onValueChange={value => setCreditsToBuy(value)}
        value={creditsToBuy}
      />

      <div className="h-4" />

      <Button onClick={handleBuyCredits}>
        Buy {credits} credits for ₹{price}
      </Button>
    </div>
  )
}

export default BillingPage
