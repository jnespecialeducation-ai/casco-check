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
    const snapshot = await db.collection("sms_templates").get();

    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json(list);
  } catch (e) {
    console.error("Admin sms-templates GET error:", e);
    return NextResponse.json(
      { error: "템플릿 목록을 불러오는데 실패했습니다." },
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
    const { key, body: templateBody } = body as { key?: string; body?: string };

    if (!key?.trim()) {
      return NextResponse.json(
        { error: "key가 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const existing = await db
      .collection("sms_templates")
      .where("key", "==", key.trim())
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: `템플릿 키 "${key}"가 이미 존재합니다.` },
        { status: 400 }
      );
    }

    const docRef = await db.collection("sms_templates").add({
      key: key.trim(),
      body: templateBody?.trim() ?? "",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (e) {
    console.error("Admin sms-templates POST error:", e);
    return NextResponse.json(
      { error: "템플릿 추가에 실패했습니다." },
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
    const { id, body: templateBody } = body as { id?: string; body?: string };

    if (!id) {
      return NextResponse.json(
        { error: "id가 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    await db.collection("sms_templates").doc(id).update({
      body: templateBody ?? "",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin sms-templates PATCH error:", e);
    return NextResponse.json(
      { error: "템플릿 수정에 실패했습니다." },
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
        { error: "템플릿 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const ref = db.collection("sms_templates").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await ref.delete();
    return NextResponse.json({ id });
  } catch (e) {
    console.error("Admin sms-templates DELETE error:", e);
    return NextResponse.json(
      { error: "템플릿 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
