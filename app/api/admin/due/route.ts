import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filterDays = Number(searchParams.get("days")) || 30;

  try {
    const db = getAdminFirestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + filterDays);
    endDate.setHours(23, 59, 59, 999);

    const snapshot = await db
      .collection("vehicles")
      .where("nextDueDate", ">=", Timestamp.fromDate(today))
      .where("nextDueDate", "<=", Timestamp.fromDate(endDate))
      .orderBy("nextDueDate", "asc")
      .get();

    const list: Record<string, unknown>[] = [];

    for (const v of snapshot.docs) {
      const data = v.data();
      const nextDue = data.nextDueDate;
      const dueDate =
        nextDue && typeof (nextDue as { seconds?: number }).seconds === "number"
          ? new Date((nextDue as { seconds: number }).seconds * 1000)
          : new Date();

      let customerName: string | undefined;
      let customerPhone: string | undefined;
      if (data.customerId) {
        const cSnap = await db.collection("customers").doc(data.customerId as string).get();
        const c = cSnap.exists ? cSnap.data() : undefined;
        customerName = c?.name;
        customerPhone = c?.phone;
      }

      list.push({
        id: v.id,
        carNumber: data.carNumber,
        nextDueDate: dueDate.toISOString(),
        linkToken: data.linkToken,
        customerName,
        customerPhone,
      });
    }

    return NextResponse.json(list);
  } catch (e) {
    console.error("Admin due GET error:", e);
    return NextResponse.json(
      { error: "만료 예정 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
