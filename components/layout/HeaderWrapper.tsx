import { auth } from "@clerk/nextjs/server";
import Header from "./Header";

export default async function HeaderWrapper() {
  const { has } = await auth();
  const isPro = !!has({ plan: "pro_plan" });

  return <Header isPro={isPro} />;
}