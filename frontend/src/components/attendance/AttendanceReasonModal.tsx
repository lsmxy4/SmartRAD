"use client";

import { useState } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import Modal, { ModalCancelButton, ModalPrimaryButton } from "@/components/common/Modal";
import { resolveFileUrl } from "@/lib/fileUrl";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Props {
  attendanceId: number;
  title: string;
  description?: string;
  initialReason?: string | null;
  initialAttachmentName?: string | null;
  initialAttachmentUrl?: string | null;
  skipLabel?: string;
  onClose: () => void;
  onSaved: (response: { reason: string | null; attachmentUrl: string | null; attachmentName: string | null }) => void;
}

export default function AttendanceReasonModal({
  attendanceId,
  title,
  description,
  initialReason,
  initialAttachmentName,
  initialAttachmentUrl,
  skipLabel = "취소",
  onClose,
  onSaved,
}: Props) {
  const [reason, setReason] = useState(initialReason ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasonInvalid, setReasonInvalid] = useState(false);

  const submit = async () => {
    if (submitting) return;
    if (!reason.trim()) {
      setReasonInvalid(true);
      setError("사유를 입력해주세요.");
      return;
    }
    setReasonInvalid(false);
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("reason", reason);
      if (file) formData.append("attachment", file);
      const res = await fetch(`${API_BASE_URL}/attendances/${attendanceId}/reason`, {
        method: "PATCH",
        headers: authHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "사유 저장에 실패했습니다.");
      }
      const saved = (await res.json()) as { reason: string | null; attachmentUrl: string | null; attachmentName: string | null };
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "사유 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      icon={PencilSquareIcon}
      title={title}
      onClose={onClose}
      maxWidth="lg"
      footer={
        <>
          <ModalCancelButton onClick={onClose} disabled={submitting}>
            {skipLabel}
          </ModalCancelButton>
          <ModalPrimaryButton type="button" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "저장 중..." : "제출"}
          </ModalPrimaryButton>
        </>
      }
    >
          {description && <p className="text-sm leading-relaxed text-gray-500">{description}</p>}
          <label className="block text-sm font-medium text-gray-700">
            사유 <b className="text-rose-500">*</b>
            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonInvalid && event.target.value.trim()) setReasonInvalid(false);
              }}
              rows={4}
              maxLength={500}
              placeholder="사유를 입력해주세요."
              className={`mt-1 block w-full resize-none rounded-md border p-3 text-sm outline-none ${
                reasonInvalid ? "border-rose-400 bg-rose-50/40 ring-1 ring-rose-200 focus:border-rose-500" : "border-gray-200 focus:border-blue-500"
              }`}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            첨부파일 <span className="font-normal text-gray-400">(선택)</span>
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border file:border-gray-200 file:bg-gray-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-600 hover:file:bg-gray-100"
            />
            {!file && initialAttachmentName && (
              <p className="mt-1 text-xs text-gray-400">
                등록된 파일:{" "}
                {initialAttachmentUrl ? (
                  <a href={resolveFileUrl(initialAttachmentUrl)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {initialAttachmentName}
                  </a>
                ) : (
                  initialAttachmentName
                )}
              </p>
            )}
          </label>
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}
    </Modal>
  );
}
