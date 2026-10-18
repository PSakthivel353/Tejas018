import { OfficerDashboard } from "@/components/officer/OfficerDashboard";
import { PageHeader } from "@/components/ui";

export default function OfficerPage() {
  return (
    <>
      <PageHeader
        title="District skills dashboard"
        description="See which trades will be short of workers, which have too many graduates, and export the district plan in one click."
      />
      <OfficerDashboard />
    </>
  );
}
