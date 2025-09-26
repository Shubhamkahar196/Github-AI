// import Link from "next/link";

// import { LatestPost } from "@/app/_components/post";
// import { api, HydrateClient } from "@/trpc/server";
import { Button } from "@/components/ui/button";


export default async function Home() {
  return (
    <div>
      <h1>Welcome to the Home page</h1>
      <Button onClick={() => console.log("Button clicked")}>Click me</Button>
    </div>
  );
}
