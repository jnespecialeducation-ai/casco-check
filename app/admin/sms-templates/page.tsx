"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface TemplateDoc {
  id: string;
  key: string;
  body: string;
  updatedAt?: { seconds: number };
}

const PLACEHOLDER_HINT = "사용 가능: {CAR}, {DUE}, {LINK}, {TYPE}, {DATE}, {TIME}";

export default function AdminSmsTemplatesPage() {
  const toast = useToast();
  const [templates, setTemplates] = useState<TemplateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addKey, setAddKey] = useState("");
  const [addBody, setAddBody] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/sms-templates", { credentials: "include" });
      if (!res.ok) throw new Error("템플릿 목록을 불러오는데 실패했습니다.");
      const list = (await res.json()) as TemplateDoc[];
      setTemplates(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (id: string) => {
    try {
      const res = await fetch("/api/admin/sms-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, body: editBody }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      toast?.show("저장되었습니다.");
      setEditing(null);
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleEdit = (t: TemplateDoc) => {
    setEditing(t.id);
    setEditBody(t.body);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addKey.trim()) {
      setAddError("키를 입력해 주세요.");
      return;
    }
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/admin/sms-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: addKey.trim(), body: addBody.trim() }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "템플릿 추가에 실패했습니다.");
      toast?.show("템플릿이 추가되었습니다.");
      setAddOpen(false);
      setAddKey("");
      setAddBody("");
      load();
    } catch (e) {
      setAddError((e as Error).message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/sms-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "템플릿 삭제에 실패했습니다.");
      toast?.show("템플릿이 삭제되었습니다.");
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary">문자 템플릿</h1>
        <Button variant="accent" onClick={() => setAddOpen(true)}>
          템플릿 추가
        </Button>
      </div>
      {loading ? (
        <p className="text-slate-600">로딩 중...</p>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-secondary">{t.key}</span>
                <div className="flex gap-2">
                  {editing === t.id ? (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => handleSave(t.id)}
                        className="text-sm px-3 py-2"
                      >
                        저장
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditing(null)}
                        className="text-sm px-3 py-2"
                      >
                        취소
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(t)}
                        className="text-sm px-3 py-2"
                      >
                        수정
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="text-sm px-3 py-2"
                      >
                        {deletingId === t.id ? "삭제 중..." : "삭제"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {editing === t.id ? (
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 h-32 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              ) : (
                <pre className="text-sm text-slate-600 whitespace-pre-wrap">
                  {t.body}
                </pre>
              )}
            </Card>
          ))}
          {templates.length === 0 && (
            <p className="text-slate-600">템플릿이 없습니다. 위의 &apos;템플릿 추가&apos; 버튼으로 추가해 주세요.</p>
          )}
        </div>
      )}

      <Modal
        isOpen={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddError(null);
        }}
        title="템플릿 추가"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">키 (예: due7, due30)</label>
            <Input
              type="text"
              value={addKey}
              onChange={(e) => setAddKey(e.target.value)}
              placeholder="due7"
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">문자 내용</label>
            <textarea
              value={addBody}
              onChange={(e) => setAddBody(e.target.value)}
              placeholder={PLACEHOLDER_HINT}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 h-40 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">{PLACEHOLDER_HINT}</p>
          </div>
          {addError && <p className="text-red-600 text-sm">{addError}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              취소
            </Button>
            <Button type="submit" variant="accent" disabled={addLoading}>
              {addLoading ? "저장 중..." : "추가"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
