import DueList from "@/components/admin/DueList";
import Card from "@/components/ui/Card";

export default function AdminDuePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">만료예정 차량</h1>
      <Card>
        <DueList />
      </Card>
    </div>
  );
}
