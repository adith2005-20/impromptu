import { HydrateClient } from "@/trpc/server";
import HomeComponent from "@/components/ui/HomeComponent";

export default async function page() {
  return (
    <HydrateClient>
      <HomeComponent/>
    </HydrateClient>
  );
}
