import { QuizData, ProductBasket, ChatMessage } from "./types";

export interface FundingPlatform {
  id: string;
  name: string;
  type: "vc" | "crowdfunding";
  logo: string;
  required_doc_ids: string[];
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  required_by: string[];
  ai_validation_rule: string;
  sample_format: string;
}

export interface UploadedFile {
  id: string;
  template_id: string;
  file_name: string;
  file_path: string;
  status: "pending" | "validating" | "rejected" | "approved";
  ai_feedback: string | null;
  uploaded_at: string;
}

export interface Application {
  id: string;
  startup_name: string;
  platforms: string[];
  status: "draft" | "validating" | "ready" | "submitted";
  files: UploadedFile[];
  created_at: string;
}

export interface DocumentStatus {
  template: DocumentTemplate;
  file: UploadedFile | null;
  status: "missing" | "pending" | "validating" | "rejected" | "approved";
}

export interface ApplicationStatus {
  application_id: string;
  startup_name: string;
  platforms: string[];
  overall_status: string;
  documents: DocumentStatus[];
  ready_to_submit: boolean;
}

const API_BASE = "http://localhost:8001/api/v1";

export async function listPlatforms(): Promise<FundingPlatform[]> {
  const res = await fetch(`${API_BASE}/fundraising/platforms`);
  if (!res.ok) throw new Error("Failed to fetch platforms");
  return res.json();
}

export async function mergeRequirements(platformIds: string[]): Promise<DocumentTemplate[]> {
  const res = await fetch(`${API_BASE}/fundraising/requirements/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(platformIds),
  });
  if (!res.ok) throw new Error("Failed to merge requirements");
  return res.json();
}

export async function createApplication(
  startupName: string,
  platformIds: string[]
): Promise<Application> {
  const form = new FormData();
  form.append("startup_name", startupName);
  platformIds.forEach((id) => form.append("platform_ids", id));

  const res = await fetch(`${API_BASE}/fundraising/applications`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Failed to create application");
  return res.json();
}

export async function uploadDocument(
  appId: string,
  templateId: string,
  file: File
): Promise<{ file: UploadedFile; validation: { approved: boolean; issues: string[] } }> {
  const form = new FormData();
  form.append("template_id", templateId);
  form.append("file", file);

  const res = await fetch(`${API_BASE}/fundraising/applications/${appId}/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Failed to upload document");
  return res.json();
}

export async function getApplicationStatus(appId: string): Promise<ApplicationStatus> {
  const res = await fetch(`${API_BASE}/fundraising/applications/${appId}/status`);
  if (!res.ok) throw new Error("Failed to fetch application status");
  return res.json();
}

export async function submitApplication(appId: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/fundraising/applications/${appId}/submit`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to submit application");
  return res.json();
}