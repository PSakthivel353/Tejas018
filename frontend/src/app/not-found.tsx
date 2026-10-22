import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center space-y-4">
      <h2 className="font-display text-2xl font-bold">Page Not Found</h2>
      <p className="text-sm text-muted">The page you are looking for does not exist or has moved.</p>
      <Link href="/">
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  );
}

