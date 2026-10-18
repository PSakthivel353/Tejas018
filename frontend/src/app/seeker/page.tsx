import { SeekerPortal } from "@/components/seeker/SeekerPortal";
import { PageHeader } from "@/components/ui";

export default function SeekerPage() {
  return (
    <>
      <PageHeader
        title="Find work near home"
        description="Upload your CV and see openings in your district that match your trade, with a short course for any skill you are missing."
      />
      <SeekerPortal />
    </>
  );
}
