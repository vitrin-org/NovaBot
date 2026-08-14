"use client";

import { useState, useEffect } from "react";
import {
  listPlatforms,
  mergeRequirements,
  createApplication,
  uploadDocument,
  getApplicationStatus,
  submitApplication,
} from "@/lib/fundraisingApi";
import {
  FundingPlatform,
  DocumentTemplate,
  UploadedFile,
  ApplicationStatus,
  DocumentStatus,
} from "@/lib/fundraisingApi";

type Step = "platforms" | "documents" | "review" | "done";

export default function FundraisingWizard() {
  const [step, setStep] = useState<Step>("platforms");
  const [platforms, setPlatforms] = useState<FundingPlatform[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [startupName, setStartupName] = useState("");
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      const data = await listPlatforms();
      setPlatforms(data);
    } catch (err) {
      setError("Failed to load platforms");
    }
  };

  const handlePlatformToggle = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleNextToDocuments = async () => {
    if (!startupName.trim() || selectedPlatforms.length === 0) {
      setError("نام استارتاپ و حداقل یک پلتفرم الزامی است");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const merged = await mergeRequirements(selectedPlatforms);
      setTemplates(merged);
      const app = await createApplication(startupName, selectedPlatforms);
      setApplicationId(app.id);
      const initialDocs: DocumentStatus[] = merged.map((t) => ({
        template: t,
        file: null,
        status: "missing" as const,
      }));
      setDocuments(initialDocs);
      setStep("documents");
    } catch (err) {
      setError("خطا در ایجاد درخواست");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (templateId: string, file: File) => {
    if (!applicationId) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.template.id === templateId
          ? { ...d, status: "validating" as const }
          : d
      )
    );
    try {
      const result = await uploadDocument(applicationId, templateId, file);
      // Sync with server to ensure consistency
      const status = await getApplicationStatus(applicationId);
      setDocuments(status.documents);
    } catch (err) {
      // On error, sync with server anyway
      const status = await getApplicationStatus(applicationId);
      setDocuments(status.documents);
    }
  };

  const handleNextToReview = async () => {
    if (!applicationId) return;
    const status = await getApplicationStatus(applicationId);
    setDocuments(status.documents);
    setStep("review");
  };

  const handleSubmit = async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      await submitApplication(applicationId);
      setSuccess("درخواست با موفقیت ارسال شد!");
      setStep("done");
    } catch (err) {
      setError("خطا در ارسال درخواست");
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "validating":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "تایید شده";
      case "rejected":
        return "رد شده";
      case "validating":
        return "در حال بررسی";
      case "pending":
        return "در انتظار";
      default:
        return "بارگذاری نشده";
    }
  };

  const renderPlatformsStep = () => (
    <div className="max-w-3xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">انتخاب پلتفرم‌های سرمایه‌گذاری</h1>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">نام استارتاپ</label>
        <input
          type="text"
          value={startupName}
          onChange={(e) => setStartupName(e.target.value)}
          placeholder="مثال: فناوری پایا"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
        />
      </div>
      <p className="text-sm text-gray-600 mb-4">
        پلتفرم‌هایی را که می‌خواهید برای آن‌ها اپلای کنید انتخاب کنید:
      </p>
      <div className="space-y-3">
        {platforms.map((p) => (
          <label
            key={p.id}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
              selectedPlatforms.includes(p.id)
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedPlatforms.includes(p.id)}
              onChange={() => handlePlatformToggle(p.id)}
              className="w-5 h-5 text-primary-600 rounded"
            />
            <span className="text-2xl">{p.logo}</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{p.name}</div>
              <div className="text-sm text-gray-500">
                {p.type === "vc" ? "VC" : "کراد فاندینگ"}
              </div>
            </div>
          </label>
        ))}
      </div>
      {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      <button
        onClick={handleNextToDocuments}
        disabled={loading}
        className="mt-6 w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? "در حال پردازش..." : "ادامه به مدارک"}
      </button>
    </div>
  );

  const renderDocumentsStep = () => (
    <div className="max-w-3xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-2">بارگذاری مدارک</h1>
      <p className="text-gray-600 mb-6">
        برای هر مدرک فایل را آپلود کنید. هوش مصنوعی به طور خودکار بررسی می‌کند.
      </p>
      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.template.id}
            className={`rounded-xl border-2 p-4 ${
              doc.status === "approved"
                ? "border-green-300 bg-green-50"
                : doc.status === "rejected"
                ? "border-red-300 bg-red-50"
                : doc.status === "validating"
                ? "border-yellow-300 bg-yellow-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{doc.template.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(doc.status)}`}>
                    {statusLabel(doc.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{doc.template.description}</p>
                <p className="text-xs text-gray-500">
                  فرمت: {doc.template.sample_format} | لازم برای: {doc.template.required_by.join(", ")}
                </p>
                {doc.file?.ai_feedback && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
                    <strong>بازخورد AI:</strong> {doc.file.ai_feedback}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {doc.status === "approved" ? (
                  <span className="text-green-600 font-medium">✓ تایید شده</span>
                ) : doc.status === "rejected" ? (
                  <button
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".pdf,.docx,.xlsx,.jpg,.png";
                      input.onchange = () => input.files?.[0] && handleUpload(doc.template.id, input.files[0]);
                      input.click();
                    }}
                    className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                  >
                    آپلود مجدد
                  </button>
                ) : doc.status === "validating" ? (
                  <span className="text-yellow-600">در حال بررسی...</span>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.docx,.xlsx,.jpg,.png"
                      onChange={(e) => e.target.files?.[0] && handleUpload(doc.template.id, e.target.files[0])}
                      className="hidden"
                      id={`upload-${doc.template.id}`}
                    />
                    <label
                      htmlFor={`upload-${doc.template.id}`}
                      className="bg-primary-100 text-primary-700 px-4 py-2 rounded cursor-pointer hover:bg-primary-200"
                    >
                      انتخاب فایل
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setStep("platforms")}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-100"
        >
          بازگشت
        </button>
        <button
          onClick={handleNextToReview}
          disabled={loading || documents.some((d) => d.status === "validating")}
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "بررسی..." : "مرحله نهایی"}
        </button>
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const missingCount = documents.filter((d) => d.status === "missing" || d.status === "rejected").length;
    const ready = missingCount === 0;

    return (
      <div className="max-w-3xl mx-auto p-6" dir="rtl">
        <h1 className="text-2xl font-bold mb-2">مرور و ارسال</h1>
        <p className="text-gray-600 mb-6">
          وضعیت تمام مدارک را بررسی کنید. {ready ? "همه مدارک تایید شده‌اند." : `${missingCount} مدرک ناقص یا رد شده.`}
        </p>
        <div className="space-y-3 mb-6">
          {documents.map((doc) => (
            <div
              key={doc.template.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                doc.status === "approved"
                  ? "bg-green-50"
                  : doc.status === "rejected"
                  ? "bg-red-50"
                  : "bg-yellow-50"
              }`}
            >
              <span className="font-medium">{doc.template.name}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(doc.status)}`}>
                {statusLabel(doc.status)}
              </span>
            </div>
          ))}
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
        <div className="flex gap-3">
          <button
            onClick={() => setStep("documents")}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-100"
          >
            بازگشت
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !ready}
            className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "در حال ارسال..." : "ارسال نهایی"}
          </button>
        </div>
      </div>
    );
  };

  const renderDoneStep = () => (
    <div className="max-w-3xl mx-auto p-6 text-center" dir="rtl">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold mb-2">درخواست با موفقیت ارسال شد</h1>
      <p className="text-gray-600 mb-6">اطلاعات شما به پلتفرم‌های انتخاب شده ارسال گردید.</p>
      <button
        onClick={() => {
          setStep("platforms");
          setStartupName("");
          setSelectedPlatforms([]);
          setTemplates([]);
          setApplicationId(null);
          setDocuments([]);
        }}
        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
      >
        درخواست جدید
      </button>
    </div>
  );

  if (step === "platforms") return renderPlatformsStep();
  if (step === "documents") return renderDocumentsStep();
  if (step === "review") return renderReviewStep();
  return renderDoneStep();
}