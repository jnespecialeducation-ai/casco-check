import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const ids = body.ids as string[] | undefined;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "삭제할 로그 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const batch = db.batch();
    for (const id of ids) {
      const ref = db.collection("sms_logs").doc(id);
      batch.delete(ref);
    }
    await batch.commit();

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (e) {
    console.error("Admin sms-logs DELETE error:", e);
    return NextResponse.json(
      { error: "로그 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection("sms_logs")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json(list);
  } catch (e) {
    console.error("Admin sms-logs GET error:", e);
    return NextResponse.json(
      { error: "발송 로그를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
