"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNav } from "@/lib/store";

// ─── Types ──────────────────────────────────────────────────────────────────

type VerificationStatus =
  | "NOT_SUBMITTED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "ADDITIONAL_INFO_REQUIRED"
  | "REJECTED";

interface CommunityVerificationRecord {
  id: string;
  status: VerificationStatus;
  photoPath: string | null;
  photoDescription: string | null;
  documentPath: string | null;
  documentType: string | null;
  additionalEvidencePath: string | null;
  writtenExplanation: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  additionalInfoRequested: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GetResponse {
  verification: CommunityVerificationRecord | null;
  error?: string;
}

interface SubmitResponse {
  ok?: boolean;
  status?: VerificationStatus;
  message?: string;
  error?: string;
}

interface UploadResponse {
  ok?: boolean;
  path?: string;
  type?: string;
  error?: string;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_DOC_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const DOCUMENT_TYPES = [
  "Community membership document",
  "Institutional document",
  "Volunteer service confirmation",
  "Other",
] as const;

// ─── Upload zone (reusable) ──────────────────────────────────────────────────

interface UploadZoneProps {
  label: string;
  description: string;
  icon: ReactNode;
  accept: string;
  uploading: boolean;
  preview: string;
  fileName: string;
  done: boolean;
  isDocument?: boolean;
  onFile: (file: File) => void;
}

function UploadZone({
  label,
  description,
  icon,
  accept,
  uploading,
  preview,
  fileName,
  done,
  isDocument = false,
  onFile,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <Label className="mb-1.5 block text-sm text-ivory/80">{label}</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex w-full items-stretch gap-3 rounded-lg border-2 border-dashed px-4 py-4 text-left transition-colors ${
          dragging
            ? "border-[#D6B77A] bg-[#D6B77A]/10"
            : done
              ? "border-[#D6B77A]/40 bg-white/[0.04]"
              : "border-[#D6B77A]/40 bg-white/[0.03] hover:border-[#D6B77A] hover:bg-white/[0.06]"
        }`}
        aria-label={`Upload ${label}`}
      >
        {uploading ? (
          <div className="flex items-center gap-3 py-1">
            <Loader2 className="h-5 w-5 animate-spin text-[#D6B77A]" />
            <div>
              <p className="text-sm text-ivory">Uploading…</p>
              <p className="text-xs text-ivory/50">Please wait a moment.</p>
            </div>
          </div>
        ) : done ? (
          <div className="flex w-full items-start gap-3">
            {preview ? (
              <img
                src={preview}
                alt=""
                className="h-12 w-12 rounded border border-[#D6B77A]/30 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-[#D6B77A]/30 bg-[#D6B77A]/10 text-[#D6B77A]">
                {isDocument ? (
                  <FileText className="h-6 w-6" />
                ) : (
                  <ImageIcon className="h-6 w-6" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                <span className="truncate text-sm text-ivory">{fileName}</span>
              </div>
              <span className="text-xs text-ivory/50">
                Uploaded — click to replace
              </span>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#D6B77A]/10 text-[#D6B77A]">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ivory">{label}</p>
              <p className="text-xs text-ivory/50">{description}</p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export default function CommunityVerificationView() {
  const setView = useNav((s) => s.setView);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<CommunityVerificationRecord | null>(
    null,
  );

  // Option A — Photograph in an Ismaili community setting
  const [photoPath, setPhotoPath] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoDescription, setPhotoDescription] = useState("");

  // Option B — Supporting documentation
  const [documentPath, setDocumentPath] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentPreview, setDocumentPreview] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentType, setDocumentType] = useState<string>("");

  // Option C — Additional verification
  const [additionalEvidencePath, setAdditionalEvidencePath] = useState("");
  const [additionalEvidenceName, setAdditionalEvidenceName] = useState("");
  const [additionalEvidencePreview, setAdditionalEvidencePreview] =
    useState("");
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [writtenExplanation, setWrittenExplanation] = useState("");

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/community-verification", {
        cache: "no-store",
      });
      if (res.status === 401) {
        toast.error("Please sign in to view your community verification.");
        setView("login");
        return;
      }
      const data = (await res.json()) as GetResponse;
      setRecord(data.verification ?? null);
    } catch {
      toast.error("Could not load your verification status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  // Reusable upload helper — posts multipart/form-data to /api/upload
  // and returns the stored file path.
  async function uploadFile(file: File, type: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json()) as UploadResponse;
    if (!res.ok || !data.ok || !data.path) {
      throw new Error(data.error ?? "Upload failed.");
    }
    return data.path;
  }

  function validateFile(file: File, allowPdf: boolean): boolean {
    const accepted = allowPdf ? ACCEPTED_DOC_TYPES : ACCEPTED_IMAGE_TYPES;
    if (!accepted.includes(file.type)) {
      toast.error(
        allowPdf
          ? "Please upload a JPEG, PNG, WebP image, or PDF document."
          : "Please upload a JPEG, PNG, or WebP image.",
      );
      return false;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File is too large. Maximum size is 5 MB.");
      return false;
    }
    return true;
  }

  async function handlePhotoSelect(file: File) {
    if (!validateFile(file, false)) return;
    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const path = await uploadFile(file, "community_photo");
      setPhotoPath(path);
      setPhotoName(file.name);
      toast.success("Community photograph uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
      setPhotoPath("");
      setPhotoName("");
      setPhotoPreview("");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleDocumentSelect(file: File) {
    if (!validateFile(file, true)) return;
    setDocumentPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
    setUploadingDocument(true);
    try {
      const path = await uploadFile(file, "community_document");
      setDocumentPath(path);
      setDocumentName(file.name);
      toast.success("Supporting document uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
      setDocumentPath("");
      setDocumentName("");
      setDocumentPreview("");
    } finally {
      setUploadingDocument(false);
    }
  }

  async function handleAdditionalSelect(file: File) {
    if (!validateFile(file, true)) return;
    setAdditionalEvidencePreview(
      file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    );
    setUploadingAdditional(true);
    try {
      const path = await uploadFile(file, "additional_evidence");
      setAdditionalEvidencePath(path);
      setAdditionalEvidenceName(file.name);
      toast.success("Additional evidence uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
      setAdditionalEvidencePath("");
      setAdditionalEvidenceName("");
      setAdditionalEvidencePreview("");
    } finally {
      setUploadingAdditional(false);
    }
  }

  function resetForm() {
    setPhotoPath("");
    setPhotoName("");
    setPhotoPreview("");
    setPhotoDescription("");
    setDocumentPath("");
    setDocumentName("");
    setDocumentPreview("");
    setDocumentType("");
    setAdditionalEvidencePath("");
    setAdditionalEvidenceName("");
    setAdditionalEvidencePreview("");
    setWrittenExplanation("");
  }

  async function handleSubmit() {
    const hasEvidence =
      photoPath ||
      documentPath ||
      additionalEvidencePath ||
      writtenExplanation.trim();
    if (!hasEvidence) {
      toast.error("Please provide at least one form of verification evidence.");
      return;
    }
    if ((photoPath || photoDescription.trim()) && (!photoPath || !photoDescription.trim())) {
      toast.error(
        photoPath
          ? "Please describe your community photograph."
          : "Please upload the photograph you are describing.",
      );
      return;
    }
    if ((documentPath || documentType) && (!documentPath || !documentType)) {
      toast.error(
        documentPath
          ? "Please select the type of document you uploaded."
          : "Please upload the document for the selected type.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/community-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoPath: photoPath || undefined,
          photoDescription: photoDescription.trim() || undefined,
          documentPath: documentPath || undefined,
          documentType: documentType || undefined,
          additionalEvidencePath: additionalEvidencePath || undefined,
          writtenExplanation: writtenExplanation.trim() || undefined,
        }),
      });
      const data = (await res.json()) as SubmitResponse;
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Submission failed.");
        setSubmitting(false);
        return;
      }
      toast.success(
        data.message ??
          "Your verification evidence has been submitted for review.",
      );
      resetForm();
      await loadStatus();
    } catch {
      toast.error("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  // ─── Status display ────────────────────────────────────────────────────────

  const status = record?.status ?? "NOT_SUBMITTED";

  function renderStatusBanner() {
    if (loading) return null;

    switch (status) {
      case "PENDING_REVIEW":
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="border-[#D6B77A]/40 bg-[#D6B77A]/[0.08] text-ivory">
              <Clock className="text-[#D6B77A]" />
              <AlertTitle className="text-ivory">
                Your verification is under review
              </AlertTitle>
              <AlertDescription className="text-ivory/70">
                An authorized administrator is reviewing your Ismaili community
                verification evidence. You will be notified once a decision is
                made. This is typically completed within a few business days.
                {record?.submittedAt && (
                  <span className="mt-1 block text-xs text-ivory/50">
                    Submitted{" "}
                    {new Date(record.submittedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        );

      case "VERIFIED":
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="border-green-500/40 bg-green-500/[0.08] text-ivory">
              <CheckCircle2 className="text-green-400" />
              <AlertTitle className="flex items-center gap-2 text-ivory">
                Verified
                <Badge
                  variant="outline"
                  className="border-green-500/50 bg-green-500/10 text-[10px] text-green-300"
                >
                  Community Verified
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-ivory/70">
                Your Ismaili community affiliation has been verified by an
                authorized administrator. This badge is now displayed on your
                matrimonial profile, signalling trust to other members.
                {record?.reviewedAt && (
                  <span className="mt-1 block text-xs text-ivory/50">
                    Reviewed{" "}
                    {new Date(record.reviewedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        );

      case "ADDITIONAL_INFO_REQUIRED":
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="border-amber-400/40 bg-amber-400/[0.08] text-ivory">
              <AlertCircle className="text-amber-300" />
              <AlertTitle className="text-ivory">
                Additional information is required
              </AlertTitle>
              <AlertDescription className="space-y-1 text-ivory/70">
                <p>
                  An administrator has reviewed your submission and requested
                  additional information before a decision can be made.
                </p>
                {record?.additionalInfoRequested && (
                  <p className="rounded-md border border-amber-400/20 bg-amber-400/[0.06] p-3 text-sm text-ivory/90">
                    <span className="font-semibold text-amber-200">
                      Administrator&apos;s request:&nbsp;
                    </span>
                    {record.additionalInfoRequested}
                  </p>
                )}
                <p className="text-xs text-ivory/50">
                  Please resubmit your evidence below, addressing the request.
                </p>
              </AlertDescription>
            </Alert>
          </motion.div>
        );

      case "REJECTED":
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="border-red-400/40 bg-red-400/[0.08] text-ivory">
              <XCircle className="text-red-300" />
              <AlertTitle className="text-ivory">
                Verification could not be approved
              </AlertTitle>
              <AlertDescription className="space-y-1 text-ivory/70">
                <p>
                  Your previous submission could not be approved. Please review
                  the reason below and submit updated evidence.
                </p>
                {record?.reviewNote && (
                  <p className="rounded-md border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-ivory/90">
                    <span className="font-semibold text-red-200">
                      Reason:&nbsp;
                    </span>
                    {record.reviewNote}
                  </p>
                )}
                <p className="text-xs text-ivory/50">
                  You can submit new evidence at any time using the form below.
                </p>
              </AlertDescription>
            </Alert>
          </motion.div>
        );

      default:
        return null;
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-navy-gradient flex min-h-screen items-center justify-center px-4 py-12">
        <Loader2
          className="h-8 w-8 animate-spin text-[#D6B77A]"
          aria-label="Loading"
        />
      </div>
    );
  }

  const showForm =
    status === "NOT_SUBMITTED" ||
    status === "ADDITIONAL_INFO_REQUIRED" ||
    status === "REJECTED";

  return (
    <div className="bg-navy-gradient min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto w-full max-w-3xl"
      >
        <Card className="glass-dark border border-[#D6B77A]/25 shadow-lux-lg text-ivory">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-2 text-[#D6B77A]">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-[0.25em] uppercase">
                GarMinas · Trust &amp; Safety
              </span>
            </div>
            <div>
              <CardTitle className="text-gold-gradient font-serif text-2xl sm:text-3xl">
                Ismaili Community Verification
              </CardTitle>
              <CardDescription className="mt-2 text-ivory/70">
                Community verification is required for all members. It ensures
                GarMinas remains a trusted, members-only space where every
                participant genuinely belongs to the global Ismaili community.
                Your evidence is reviewed discreetly by an authorized
                administrator and is never displayed publicly on your
                matrimonial profile.
              </CardDescription>
            </div>

            {/* Status badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-ivory/50">
                Current status:
              </span>
              <StatusBadge status={status} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status banner */}
            {renderStatusBanner()}

            {/* Submission form */}
            <AnimatePresence mode="wait">
              {showForm ? (
                <motion.div
                  key="submission-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="rounded-lg border border-[#D6B77A]/20 bg-white/[0.03] p-4">
                    <p className="text-sm text-ivory/80">
                      Provide evidence of your Ismaili community affiliation
                      using any combination of the three options below.{" "}
                      <span className="font-medium text-[#D6B77A]">
                        At least one option is required.
                      </span>
                    </p>
                  </div>

                  {/* Option A — Photograph in an Ismaili community setting */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-[#D6B77A]/40 bg-[#D6B77A]/10 text-[10px] uppercase tracking-wider text-[#D6B77A]"
                      >
                        Option A
                      </Badge>
                      <h3 className="font-serif text-base font-semibold text-ivory">
                        Photograph in an Ismaili Community Setting
                      </h3>
                    </div>
                    <UploadZone
                      label="Community photograph"
                      description="JPEG, PNG or WebP · max 5MB"
                      icon={<ImageIcon className="h-5 w-5" />}
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                      uploading={uploadingPhoto}
                      preview={photoPreview}
                      fileName={photoName}
                      done={photoPath !== ""}
                      onFile={handlePhotoSelect}
                    />
                    <div className="space-y-2">
                      <Label
                        htmlFor="photoDescription"
                        className="text-sm text-ivory/80"
                      >
                        Describe the photograph
                      </Label>
                      <Textarea
                        id="photoDescription"
                        value={photoDescription}
                        onChange={(e) => setPhotoDescription(e.target.value)}
                        placeholder="e.g. Inside a Jamatkhana, wearing volunteer attire during a community event, at an Ismaili Council function…"
                        className="min-h-[88px] resize-y border-white/15 bg-white/[0.04] text-ivory placeholder:text-ivory/40 focus:border-[#D6B77A]"
                      />
                    </div>
                  </section>

                  <div className="h-px bg-white/10" />

                  {/* Option B — Supporting documentation */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-[#D6B77A]/40 bg-[#D6B77A]/10 text-[10px] uppercase tracking-wider text-[#D6B77A]"
                      >
                        Option B
                      </Badge>
                      <h3 className="font-serif text-base font-semibold text-ivory">
                        Supporting Documentation
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-ivory/80">
                        Document type
                      </Label>
                      <Select
                        value={documentType}
                        onValueChange={setDocumentType}
                      >
                        <SelectTrigger className="border-white/15 bg-white/[0.04] text-ivory focus:border-[#D6B77A]">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <UploadZone
                      label="Supporting document"
                      description="Image (JPEG/PNG/WebP) or PDF · max 5MB"
                      icon={<FileText className="h-5 w-5" />}
                      accept={ACCEPTED_DOC_TYPES.join(",")}
                      uploading={uploadingDocument}
                      preview={documentPreview}
                      fileName={documentName}
                      done={documentPath !== ""}
                      isDocument
                      onFile={handleDocumentSelect}
                    />
                  </section>

                  <div className="h-px bg-white/10" />

                  {/* Option C — Additional verification */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-[#D6B77A]/40 bg-[#D6B77A]/10 text-[10px] uppercase tracking-wider text-[#D6B77A]"
                      >
                        Option C
                      </Badge>
                      <h3 className="font-serif text-base font-semibold text-ivory">
                        Additional Verification
                      </h3>
                    </div>
                    <UploadZone
                      label="Additional evidence"
                      description="Image (JPEG/PNG/WebP) or PDF · max 5MB"
                      icon={<Upload className="h-5 w-5" />}
                      accept={ACCEPTED_DOC_TYPES.join(",")}
                      uploading={uploadingAdditional}
                      preview={additionalEvidencePreview}
                      fileName={additionalEvidenceName}
                      done={additionalEvidencePath !== ""}
                      isDocument
                      onFile={handleAdditionalSelect}
                    />
                    <div className="space-y-2">
                      <Label
                        htmlFor="writtenExplanation"
                        className="text-sm text-ivory/80"
                      >
                        Written explanation or additional context
                      </Label>
                      <Textarea
                        id="writtenExplanation"
                        value={writtenExplanation}
                        onChange={(e) =>
                          setWrittenExplanation(e.target.value)
                        }
                        placeholder="Share any additional context that supports your Ismaili community affiliation — references, council involvement, volunteer service, Jamatkhana participation, etc."
                        className="min-h-[88px] resize-y border-white/15 bg-white/[0.04] text-ivory placeholder:text-ivory/40 focus:border-[#D6B77A]"
                      />
                    </div>
                  </section>

                  {/* Privacy notice */}
                  <Alert className="border-white/15 bg-white/[0.04] text-ivory">
                    <ShieldCheck className="text-[#D6B77A]" />
                    <AlertDescription className="text-ivory/70">
                      Verification photographs and documents are{" "}
                      <span className="font-medium text-ivory/90">
                        never publicly displayed
                      </span>{" "}
                      on matrimonial profiles. They are only accessible to
                      authorized administrators and you.
                    </AlertDescription>
                  </Alert>

                  {/* Important note */}
                  <Alert className="border-[#D6B77A]/30 bg-[#D6B77A]/[0.07] text-ivory">
                    <MessageSquare className="text-[#D6B77A]" />
                    <AlertDescription className="text-ivory/80">
                      Do not be discouraged if you cannot provide a Jamatkhana
                      photograph. Alternative credible evidence and manual
                      review are available — every submission is assessed on
                      its overall credibility by an authorized reviewer.
                    </AlertDescription>
                  </Alert>

                  {/* Submit */}
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setView("dashboard")}
                      className="text-ivory/70 hover:bg-white/5 hover:text-ivory"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Submit Verification
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="no-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-6 text-center"
                >
                  <ShieldCheck className="h-8 w-8 text-[#D6B77A]" />
                  <p className="text-sm text-ivory/70">
                    {status === "VERIFIED"
                      ? "Your Ismaili community verification is complete. No further action is required."
                      : "Your submission is being reviewed. You will be notified once a decision is made."}
                  </p>
                  <Button
                    type="button"
                    onClick={() => setView("dashboard")}
                    className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
                  >
                    Return to Dashboard
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── Status badge helper ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case "VERIFIED":
      return (
        <Badge
          variant="outline"
          className="border-green-500/40 bg-green-500/10 text-green-300"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Verified
        </Badge>
      );
    case "PENDING_REVIEW":
      return (
        <Badge
          variant="outline"
          className="border-[#D6B77A]/40 bg-[#D6B77A]/10 text-[#D6B77A]"
        >
          <Clock className="mr-1 h-3 w-3" />
          Pending Review
        </Badge>
      );
    case "ADDITIONAL_INFO_REQUIRED":
      return (
        <Badge
          variant="outline"
          className="border-amber-400/40 bg-amber-400/10 text-amber-300"
        >
          <AlertCircle className="mr-1 h-3 w-3" />
          Additional Info Required
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="border-red-400/40 bg-red-400/10 text-red-300"
        >
          <XCircle className="mr-1 h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="border-white/20 bg-white/[0.04] text-ivory/60"
        >
          Not Submitted
        </Badge>
      );
  }
}
