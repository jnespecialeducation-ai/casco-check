import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection("customers")
      .orderBy("createdAt", "desc")
      .get();

    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json(list);
  } catch (e) {
    console.error("Admin customers GET error:", e);
    return NextResponse.json(
      { error: "고객 목록을 불러오는데 실패했습니다." },
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
    const { name, phone, carNumber, gender } = body as {
      name?: string;
      phone?: string;
      carNumber?: string;
      gender?: string | null;
    };

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "휴대폰 번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const docRef = await db.collection("customers").add({
      name: name?.trim() || null,
      phone: phone.trim(),
      carNumber: carNumber?.trim() || null,
      gender: gender && ["male", "female"].includes(gender) ? gender : null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (e) {
    console.error("Admin customers POST error:", e);
    return NextResponse.json(
      { error: "고객 등록에 실패했습니다." },
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
    const { id, name, phone, carNumber, gender } = body as {
      id?: string;
      name?: string;
      phone?: string;
      carNumber?: string;
      gender?: string | null;
    };

    if (!id) {
      return NextResponse.json(
        { error: "고객 ID가 필요합니다." },
        { status: 400 }
      );
    }
    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "휴대폰 번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const ref = db.collection("customers").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "고객을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const updateData: Record<string, string | null> = {
      phone: phone.trim(),
      name: name?.trim() || null,
      carNumber: carNumber?.trim() || null,
      gender: gender && ["male", "female"].includes(gender) ? gender : null,
    };
    await ref.update(updateData);

    return NextResponse.json({ id });
  } catch (e) {
    console.error("Admin customers PATCH error:", e);
    return NextResponse.json(
      { error: "고객 수정에 실패했습니다." },
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
        { error: "고객 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const vehiclesSnap = await db
      .collection("vehicles")
      .where("customerId", "==", id)
      .limit(1)
      .get();

    if (!vehiclesSnap.empty) {
      return NextResponse.json(
        {
          error:
            "연결된 차량이 있어 삭제할 수 없습니다. 먼저 차량 관리에서 삭제해 주세요.",
        },
        { status: 400 }
      );
    }

    await db.collection("customers").doc(id).delete();
    return NextResponse.json({ id });
  } catch (e) {
    console.error("Admin customers DELETE error:", e);
    return NextResponse.json(
      { error: "고객 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
