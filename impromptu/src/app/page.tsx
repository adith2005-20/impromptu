import Link from "next/link";

import { LatestPost } from "@/app/_components/post";
import { api, HydrateClient } from "@/trpc/server";
import HomeComponent from "@/components/ui/HomeComponent";

export default async function page() {
  return (
    <HydrateClient>
      <HomeComponent/>
    </HydrateClient>
  );
}
