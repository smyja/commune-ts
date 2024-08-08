"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { z } from "zod";

import { useCommune } from "@commune-ts/providers/use-commune";
import { toast } from "@commune-ts/providers/use-toast";

import { api } from "~/trpc/react";

enum ReportReason {
  spam = "spam",
  harassment = "harassment",
  hateSpeech = "hateSpeech",
  violence = "violence",
  sexualContent = "sexualContent",
}

const reportSchema = z.object({
  reason: z.nativeEnum(ReportReason),
  content: z.string().min(10).max(500),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportCommentProps {
  commentId: string;
}

export function ReportComment({ commentId }: ReportCommentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({
    reason: ReportReason.spam,
    content: "",
  });
  const [errors, setErrors] = useState<Partial<ReportFormData>>({});

  const { selectedAccount } = useCommune();

  const reportCommentMutation =
    api.proposalComment.createCommentReport.useMutation({
      onSuccess: () => {
        setModalOpen(false);
        setFormData({ reason: ReportReason.spam, content: "" });
        setErrors({});
      },
    });

  function toggleModalMenu() {
    setModalOpen(!modalOpen);
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "reason") {
      setFormData((prev) => ({ ...prev, [name]: value as ReportReason }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    try {
      reportSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.formErrors
          .fieldErrors as Partial<ReportFormData>;
        setErrors(fieldErrors);
      } else {
        console.error("Unexpected error during form validation:", error);
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      reportCommentMutation.mutate({
        commentId,
        userKey: selectedAccount?.address,
        reason: formData.reason,
        content: formData.content,
      });

      toast.success("Comment reported successfully.");
    }
  };

  return (
    <>
      <button
        onClick={toggleModalMenu}
        type="button"
        className="border border-red-500 p-1 text-red-500 opacity-30 transition duration-200 hover:bg-red-500/10 hover:opacity-100"
      >
        <ExclamationTriangleIcon className="h-4 w-4" />
      </button>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={toggleModalMenu}
          />
          <div className="z-60 w-[90%] max-w-screen-md animate-fade-in-down overflow-hidden border border-white/20 bg-[#898989]/5 text-left text-white backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 border-b border-gray-500 bg-cover bg-center bg-no-repeat p-1">
              <h3 className="pl-2 text-xl font-bold leading-6" id="modal-title">
                Report Comment
              </h3>
              <button
                className="p-2 transition duration-200"
                onClick={toggleModalMenu}
                type="button"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold">Reason</label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 bg-black/40  p-2"
                >
                  <option value={ReportReason.spam}>Spam</option>
                  <option value={ReportReason.harassment}>Harassment</option>
                  <option value={ReportReason.hateSpeech}>Hate Speech</option>
                  <option value={ReportReason.violence}>Violence</option>
                  <option value={ReportReason.sexualContent}>
                    Sexual Content
                  </option>
                </select>
                {errors.reason && (
                  <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold">
                  Description
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 bg-black/40 p-2"
                  rows={4}
                ></textarea>
                {errors.content && (
                  <p className="mt-1 text-xs text-red-500">{errors.content}</p>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="border border-red-500 bg-red-500/10 px-4 py-2 text-white transition duration-200 hover:bg-red-500/20"
                  disabled={reportCommentMutation.isPending}
                >
                  {reportCommentMutation.isPending ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}