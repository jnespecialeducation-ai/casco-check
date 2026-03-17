/**
 * SMS 발송 (알리고 API 연동)
 * SMS_ENABLED=true 이고 ALIGO_* 환경변수가 설정된 경우에만 실제 발송
 * 알리고: https://smartsms.aligo.in
 */

const ALIGO_SEND_URL = "https://apis.aligo.in/send/";

export interface SendSmsResult {
  success: boolean;
  resultCode?: number;
  message?: string;
  msgId?: number;
}

export async function sendSms(
  to: string,
  message: string
): Promise<SendSmsResult> {
  const key = process.env.ALIGO_API_KEY;
  const userId = process.env.ALIGO_USER_ID;
  const sender = process.env.ALIGO_SENDER;

  if (process.env.SMS_ENABLED !== "true" || !key || !userId || !sender) {
    console.log("[SMS mock] 발송 건너뜀", {
      to,
      reason:
        process.env.SMS_ENABLED !== "true"
          ? "SMS_ENABLED != true"
          : "ALIGO_* 환경변수 미설정",
    });
    return { success: false, message: "SMS 미활성화 또는 설정 누락" };
  }

  const receiver = to.replace(/\D/g, "");
  const msgType = message.length > 80 ? "LMS" : "SMS";
  const testMode = process.env.ALIGO_TESTMODE === "true" ? "Y" : undefined;

  const params: Record<string, string> = {
    key,
    user_id: userId,
    sender,
    receiver,
    msg: message,
    msg_type: msgType,
  };
  if (testMode) params.testmode_yn = testMode;

  try {
    const res = await fetch(ALIGO_SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      body: new URLSearchParams(params).toString(),
    });

    const data = (await res.json()) as {
      result_code?: number;
      message?: string;
      msg_id?: number;
      success_cnt?: number;
      error_cnt?: number;
    };

    const resultCode = data.result_code ?? -999;
    const ok = resultCode >= 0;

    if (!ok) {
      console.error("[SMS 알리고 실패]", { to, resultCode, msg: data.message });
    }

    return {
      success: ok,
      resultCode,
      message: data.message,
      msgId: data.msg_id,
    };
  } catch (e) {
    console.error("[SMS 알리고 오류]", e);
    return {
      success: false,
      message: (e as Error).message,
    };
  }
}
