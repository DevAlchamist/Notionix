import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

/** Legacy URL: /summaries/[id] → dashboard detail view */
export default async function LegacySummaryRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/summaries/${id}`);
}
