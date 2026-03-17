import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { SITE } from "@/lib/constants";
import { sendSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { vehicleId, vehicleIds, templateKey, date, time } = body as {
      vehicleId?: string;
      vehicleIds?: string[];
      templateKey?: string;
      date?: string;
      time?: string;
    };

    const ids: string[] = vehicleIds && vehicleIds.length > 0
      ? vehicleIds
      : vehicleId
        ? [vehicleId]
        : [];

    if (ids.length === 0 || !templateKey) {
      return NextResponse.json(
        { error: "vehicleId/vehicleIds와 templateKey가 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const baseUrl = SITE.baseUrl;

    const results: { vehicleId: string; success: boolean; error?: string }[] = [];

    for (const vid of ids) {
      const vehicleSnap = await db.collection("vehicles").doc(vid).get();
      if (!vehicleSnap.exists) {
        results.push({ vehicleId: vid, success: false, error: "차량을 찾을 수 없습니다." });
        continue;
      }

      const vehicle = vehicleSnap.data()!;
      const customerSnap = await db.collection("customers").doc(vehicle.customerId as string).get();
      const customer = customerSnap.data();
      const phone = customer?.phone || "";

      if (!phone) {
        results.push({ vehicleId: vid, success: false, error: "연락처 없음" });
        continue;
      }

      const templateSnap = await db
        .collection("sms_templates")
        .where("key", "==", templateKey)
        .limit(1)
        .get();

      if (templateSnap.empty) {
        return NextResponse.json(
          { error: `템플릿 "${templateKey}"을 찾을 수 없습니다.` },
          { status: 404 }
        );
      }

      const template = templateSnap.docs[0].data();
      const carNumber = vehicle.carNumber || "차량";
      let dueStr = "";
      if (vehicle.nextDueDate) {
        const nd = vehicle.nextDueDate as Timestamp | { seconds: number };
        const d = nd instanceof Timestamp ? nd.toDate() : new Date(nd.seconds * 1000);
        dueStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
      }
      const link = `${baseUrl}/v/${vehicle.linkToken || ""}`;

      const typeStr =
        vehicle.inspectionType === "comprehensive" ? "종합검사" : "정기검사";

      const dateStr = templateKey === "reservationConfirmed" ? date || "" : "";
      const timeStr = templateKey === "reservationConfirmed" ? time || "" : "";

      const bodyText = (template.body as string)
        .replace(/\{CAR\}/g, carNumber)
        .replace(/\{DUE\}/g, dueStr)
        .replace(/\{LINK\}/g, link)
        .replace(/\{TYPE\}/gi, typeStr)
        .replace(/\{DATE\}/g, dateStr)
        .replace(/\{TIME\}/g, timeStr);

      try {
        const smsResult = await sendSms(phone, bodyText);

        const logResult = smsResult.success
          ? `SENT${smsResult.msgId ? ` (${smsResult.msgId})` : ""}`
          : `FAIL: ${smsResult.message || "알 수 없음"}`;

        await db.collection("sms_logs").add({
          phone,
          templateKey,
          body: bodyText,
          vehicleId: vid,
          createdAt: FieldValue.serverTimestamp(),
          result: logResult,
        });

        if (smsResult.success) {
          await db.collection("vehicles").doc(vid).update({
            lastSmsSentAt: FieldValue.serverTimestamp(),
          });
        }

        results.push({
          vehicleId: vid,
          success: smsResult.success,
          error: smsResult.success ? undefined : smsResult.message,
        });
      } catch (err) {
        results.push({ vehicleId: vid, success: false, error: (err as Error).message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return NextResponse.json({
      success: true,
      results,
      successCount,
      totalCount: ids.length,
    });
  } catch (e) {
    console.error("Admin send-sms error:", e);
    return NextResponse.json(
      { error: "문자 발송에 실패했습니다." },
      { status: 500 }
    );
  }
}
