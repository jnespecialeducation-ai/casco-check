import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { generateLinkToken } from "@/lib/utils/tokenGenerator";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection("vehicles")
      .orderBy("createdAt", "desc")
      .get();

    const list: Record<string, unknown>[] = [];

    for (const d of snapshot.docs) {
      const data = d.data();
      let customerName: string | undefined;
      if (data.customerId) {
        const cSnap = await db.collection("customers").doc(data.customerId as string).get();
        const cData = cSnap.data();
        customerName = cData?.name || cData?.phone;
      }
      list.push({
        id: d.id,
        ...data,
        customerName,
      });
    }

    return NextResponse.json(list);
  } catch (e) {
    console.error("Admin vehicles GET error:", e);
    return NextResponse.json(
      { error: "차량 목록을 불러오는데 실패했습니다." },
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
    const { customerId, name, phone, carNumber, inspectionType, nextDueDate } = body as {
      customerId?: string;
      name?: string;
      phone?: string;
      carNumber?: string;
      inspectionType?: string;
      nextDueDate?: string;
    };

    if (!carNumber?.trim() || !nextDueDate) {
      return NextResponse.json(
        { error: "차량번호, 만료일을 입력해 주세요." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    let finalCustomerId: string;

    if (customerId) {
      finalCustomerId = customerId;
    } else if (name !== undefined && phone?.trim()) {
      const docRef = await db.collection("customers").add({
        name: name?.trim() || null,
        phone: phone.trim(),
        createdAt: FieldValue.serverTimestamp(),
      });
      finalCustomerId = docRef.id;
    } else {
      return NextResponse.json(
        { error: "고객 선택 또는 이름·연락처 직접 입력이 필요합니다." },
        { status: 400 }
      );
    }

    const vehiclesRef = db.collection("vehicles");
    let token: string;
    let attempts = 0;
    const maxAttempts = 5;
    do {
      token = generateLinkToken(10, 14);
      const existing = await vehiclesRef.where("linkToken", "==", token).limit(1).get();
      if (existing.empty) break;
      attempts++;
    } while (attempts < maxAttempts);

    const due = Timestamp.fromDate(new Date(nextDueDate));
    const docRef = await vehiclesRef.add({
      customerId: finalCustomerId,
      carNumber: carNumber.trim(),
      inspectionType: inspectionType || "periodic",
      nextDueDate: due,
      linkToken: token,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      id: docRef.id,
      token,
      vehicleId: docRef.id,
    });
  } catch (e) {
    console.error("Admin vehicles POST error:", e);
    return NextResponse.json(
      { error: "차량 등록에 실패했습니다." },
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
    const { id, customerId, name, phone, carNumber, inspectionType, nextDueDate } = body as {
      id?: string;
      customerId?: string;
      name?: string;
      phone?: string;
      carNumber?: string;
      inspectionType?: string;
      nextDueDate?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: "차량 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const ref = db.collection("vehicles").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "차량을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    let finalCustomerId: string | undefined = customerId;
    if (!customerId && name !== undefined && phone?.trim()) {
      const docRef = await db.collection("customers").add({
        name: name?.trim() || null,
        phone: phone.trim(),
        createdAt: FieldValue.serverTimestamp(),
      });
      finalCustomerId = docRef.id;
    }

    const updateData: Record<string, unknown> = {};
    if (finalCustomerId !== undefined) updateData.customerId = finalCustomerId;
    if (carNumber?.trim()) updateData.carNumber = carNumber.trim();
    if (inspectionType) updateData.inspectionType = inspectionType;
    if (nextDueDate) updateData.nextDueDate = Timestamp.fromDate(new Date(nextDueDate));

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "수정할 항목을 입력해 주세요." },
        { status: 400 }
      );
    }

    await ref.update(updateData);
    return NextResponse.json({ id });
  } catch (e) {
    console.error("Admin vehicles PATCH error:", e);
    return NextResponse.json(
      { error: "차량 수정에 실패했습니다." },
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
        { error: "차량 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const ref = db.collection("vehicles").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "차량을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await ref.delete();
    return NextResponse.json({ id });
  } catch (e) {
    console.error("Admin vehicles DELETE error:", e);
    return NextResponse.json(
      { error: "차량 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
