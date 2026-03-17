import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") || "";
    const end = searchParams.get("end") || "";
    const type = searchParams.get("type") || "all";
    const category = searchParams.get("category") || "";
    const keyword = searchParams.get("keyword") || "";

    const db = getAdminFirestore();
    const snapshot = await db
      .collection("financeRecords")
      .orderBy("date", "desc")
      .get();

    let list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
      id: string;
      type: string;
      date: string;
      title: string;
      amount: number;
      category: string;
      paymentMethod: string;
      memo?: string;
      createdAt?: { seconds: number };
    }>;

    if (type === "income" || type === "expense") {
      list = list.filter((r) => r.type === type);
    }
    if (start) {
      list = list.filter((r) => r.date >= start);
    }
    if (end) {
      list = list.filter((r) => r.date <= end);
    }
    if (category) {
      list = list.filter((r) => r.category === category);
    }
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(k) ||
          r.category?.toLowerCase().includes(k) ||
          r.memo?.toLowerCase().includes(k)
      );
    }

    return NextResponse.json(list);
  } catch (e) {
    console.error("Admin finance records GET error:", e);
    return NextResponse.json(
      { error: "수입·지출 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, date, title, amount, category, paymentMethod, memo } = body as {
      type?: string;
      date?: string;
      title?: string;
      amount?: number;
      category?: string;
      paymentMethod?: string;
      memo?: string;
    };

    if (!type || !["income", "expense"].includes(type)) {
      return NextResponse.json(
        { error: "구분(수입/지출)을 선택해 주세요." },
        { status: 400 }
      );
    }
    if (!date?.trim()) {
      return NextResponse.json(
        { error: "날짜를 입력해 주세요." },
        { status: 400 }
      );
    }
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "항목명을 입력해 주세요." },
        { status: 400 }
      );
    }
    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json(
        { error: "올바른 금액을 입력해 주세요." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const docRef = await db.collection("financeRecords").add({
      type,
      date: date.trim(),
      title: title.trim(),
      amount,
      category: category?.trim() || "",
      paymentMethod: paymentMethod?.trim() || "",
      memo: memo?.trim() || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (e) {
    console.error("Admin finance records POST error:", e);
    return NextResponse.json(
      { error: "등록에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      id,
      type,
      date,
      title,
      amount,
      category,
      paymentMethod,
      memo,
    } = body as {
      id?: string;
      type?: string;
      date?: string;
      title?: string;
      amount?: number;
      category?: string;
      paymentMethod?: string;
      memo?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: "수정할 레코드 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const ref = db.collection("financeRecords").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "레코드를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (type && ["income", "expense"].includes(type)) updateData.type = type;
    if (date?.trim()) updateData.date = date.trim();
    if (title !== undefined) updateData.title = title?.trim() || "";
    if (typeof amount === "number" && amount >= 0) updateData.amount = amount;
    if (category !== undefined) updateData.category = category?.trim() || "";
    if (paymentMethod !== undefined)
      updateData.paymentMethod = paymentMethod?.trim() || "";
    if (memo !== undefined) updateData.memo = memo?.trim() || null;

    if (Object.keys(updateData).length > 0) {
      await ref.update(updateData);
    }

    return NextResponse.json({ id });
  } catch (e) {
    console.error("Admin finance records PATCH error:", e);
    return NextResponse.json(
      { error: "수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let id: string | undefined;
    const { searchParams } = new URL(req.url);
    id = searchParams.get("id") ?? undefined;
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = (body as { id?: string })?.id;
    }
    if (!id) {
      return NextResponse.json(
        { error: "삭제할 레코드 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const ref = db.collection("financeRecords").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "레코드를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await ref.delete();
    return NextResponse.json({ id });
  } catch (e) {
    console.error("Admin finance records DELETE error:", e);
    return NextResponse.json(
      { error: "삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
