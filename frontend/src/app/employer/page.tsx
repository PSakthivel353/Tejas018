import { EmployerPortal } from "@/components/employer/EmployerPortal";
import { PageHeader } from "@/components/ui";

export default function EmployerPage() {
  return (
    <>
      <PageHeader
        title="Hire trained people nearby"
        description="Post a vacancy and review candidates who live close by. Rejecting takes two clicks, and the reason helps the district plan training."
      />
      <EmployerPortal />
    </>
  );
}
