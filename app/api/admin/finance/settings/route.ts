import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

const DEFAULT_INCOME_CATEGORIES = ["검사수입", "재검수입", "기타수입"];
const DEFAULT_EXPENSE_CATEGORIES = [
  "소모품비",
  "사무용품비",
  "장비유지비",
  "공과금",
  "인건비",
  "기타지출",
];
const DEFAULT_PAYMENT_METHODS = ["현금", "카드", "계좌이체", "기타"];

const SETTINGS_DOC_ID = "config";

type SettingsType = "incomeCategory" | "expenseCategory" | "paymentMethod";

function getArrayKey(type: SettingsType): string {
  if (type === "incomeCategory") return "incomeCategories";
  if (type === "expenseCategory") return "expenseCategories";
  return "paymentMethods";
}

function getDefaultFor(type: SettingsType): string[] {
  if (type === "incomeCategory") return DEFAULT_INCOME_CATEGORIES;
  if (type === "expenseCategory") return DEFAULT_EXPENSE_CATEGORIES;
  return DEFAULT_PAYMENT_METHODS;
}

async function getSettings(db: ReturnType<typeof getAdminFirestore>) {
  const snap = await db
    .collection("finance_settings")
    .doc(SETTINGS_DOC_ID)
    .get();

  if (!snap.exists) {
    return {
      incomeCategories: [...DEFAULT_INCOME_CATEGORIES],
      expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
      paymentMethods: [...DEFAULT_PAYMENT_METHODS],
    };
  }
  const data = snap.data();
  return {
    incomeCategories:
      data?.incomeCategories ?? DEFAULT_INCOME_CATEGORIES,
    expenseCategories:
      data?.expenseCategories ?? DEFAULT_EXPENSE_CATEGORIES,
    paymentMethods: data?.paymentMethods ?? DEFAULT_PAYMENT_METHODS,
  };
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const settings = await getSettings(db);
    return NextResponse.json(settings);
  } catch (e) {
    console.error("Admin finance settings GET error:", e);
    return NextResponse.json(
      { error: "설정을 불러오는데 실패했습니다." },
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
    const { type, value } = body as { type?: SettingsType; value?: string };

    if (
      !type ||
      !["incomeCategory", "expenseCategory", "paymentMethod"].includes(type)
    ) {
      return NextResponse.json(
        { error: "올바른 설정 타입이 필요합니다." },
        { status: 400 }
      );
    }
    if (!value?.trim()) {
      return NextResponse.json(
        { error: "값을 입력해 주세요." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const settings = await getSettings(db);
    const key = getArrayKey(type);
    const arr = settings[key as keyof typeof settings] as string[];
    if (arr.includes(value.trim())) {
      return NextResponse.json(
        { error: "이미 존재하는 항목입니다." },
        { status: 400 }
      );
    }

    const newArr = [...arr, value.trim()];
    const updated = { ...settings, [key]: newArr };
    await db
      .collection("finance_settings")
      .doc(SETTINGS_DOC_ID)
      .set(updated, { merge: true });

    return NextResponse.json({ [key]: newArr });
  } catch (e) {
    console.error("Admin finance settings POST error:", e);
    return NextResponse.json(
      { error: "항목 추가에 실패했습니다." },
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
    const { type, oldValue, newValue } = body as {
      type?: SettingsType;
      oldValue?: string;
      newValue?: string;
    };

    if (
      !type ||
      !["incomeCategory", "expenseCategory", "paymentMethod"].includes(type)
    ) {
      return NextResponse.json(
        { error: "올바른 설정 타입이 필요합니다." },
        { status: 400 }
      );
    }
    if (!oldValue?.trim() || !newValue?.trim()) {
      return NextResponse.json(
        { error: "기존 값과 새 값을 입력해 주세요." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const settings = await getSettings(db);
    const key = getArrayKey(type);
    const arr = settings[key as keyof typeof settings] as string[];
    const idx = arr.indexOf(oldValue.trim());
    if (idx < 0) {
      return NextResponse.json(
        { error: "해당 항목을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const newArr = [...arr];
    newArr[idx] = newValue.trim();
    const updated = { ...settings, [key]: newArr };
    await db
      .collection("finance_settings")
      .doc(SETTINGS_DOC_ID)
      .set(updated, { merge: true });

    if (type === "incomeCategory" || type === "expenseCategory") {
      const recordsSnap = await db
        .collection("financeRecords")
        .where("category", "==", oldValue.trim())
        .get();
      const batch = db.batch();
      for (const doc of recordsSnap.docs) {
        batch.update(doc.ref, { category: newValue.trim() });
      }
      if (!recordsSnap.empty) {
        await batch.commit();
      }
    }

    return NextResponse.json({ [key]: newArr });
  } catch (e) {
    console.error("Admin finance settings PATCH error:", e);
    return NextResponse.json(
      { error: "항목 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let type: SettingsType | undefined;
    let value: string | undefined;
    const { searchParams } = new URL(req.url);
    type = searchParams.get("type") as SettingsType | null ?? undefined;
    value = searchParams.get("value") ?? undefined;
    if (!type || !value) {
      const body = await req.json().catch(() => ({}));
      const b = body as { type?: SettingsType; value?: string };
      type = type ?? b.type;
      value = value ?? b.value;
    }
    if (
      !type ||
      !["incomeCategory", "expenseCategory", "paymentMethod"].includes(type)
    ) {
      return NextResponse.json(
        { error: "올바른 설정 타입이 필요합니다." },
        { status: 400 }
      );
    }
    if (!value?.trim()) {
      return NextResponse.json(
        { error: "삭제할 값을 입력해 주세요." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const settings = await getSettings(db);
    const key = getArrayKey(type);
    const arr = settings[key as keyof typeof settings] as string[];
    const newArr = arr.filter((x) => x !== value!.trim());
    if (newArr.length === arr.length) {
      return NextResponse.json(
        { error: "해당 항목을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const updated = { ...settings, [key]: newArr };
    await db
      .collection("finance_settings")
      .doc(SETTINGS_DOC_ID)
      .set(updated, { merge: true });

    return NextResponse.json({ [key]: newArr });
  } catch (e) {
    console.error("Admin finance settings DELETE error:", e);
    return NextResponse.json(
      { error: "항목 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
