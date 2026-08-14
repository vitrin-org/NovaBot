from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
from app.fundraising.schemas import FundingPlatform, DocumentTemplate, Application, UploadedFile
from app.fundraising.data import PLATFORMS, TEMPLATES
from app.fundraising.services.validator import validate_document, merge_templates, get_template

router = APIRouter(prefix="/api/v1/fundraising", tags=["fundraising"])

# In-memory storage (ponytail). Replace with DB.
applications_db = {}
uploaded_files_db = {}

# ---- Platforms ----
@router.get("/platforms", response_model=List[FundingPlatform])
async def list_platforms():
    return PLATFORMS

@router.get("/platforms/{platform_id}", response_model=FundingPlatform)
async def get_platform(platform_id: str):
    plat = next((p for p in PLATFORMS if p.id == platform_id), None)
    if not plat:
        raise HTTPException(404, "Platform not found")
    return plat

# ---- Templates / Requirements ----
@router.get("/templates", response_model=List[DocumentTemplate])
async def list_templates():
    return TEMPLATES

@router.get("/platforms/{platform_id}/requirements", response_model=List[DocumentTemplate])
async def get_platform_requirements(platform_id: str):
    from app.fundraising.services.validator import get_templates_for_platform
    return get_templates_for_platform(platform_id)

@router.post("/requirements/merge", response_model=List[DocumentTemplate])
async def merge_requirements(platform_ids: List[str]):
    """Get deduped requirements for multiple platforms."""
    return merge_templates(platform_ids)

# ---- Applications ----
@router.post("/applications", response_model=Application)
async def create_application(
    startup_name: str = Form(...),
    platform_ids: List[str] = Form(...)
):
    import uuid
    app_id = str(uuid.uuid4())
    app = Application(
        id=app_id,
        startup_name=startup_name,
        platforms=platform_ids,
        status="draft"
    )
    applications_db[app_id] = app
    return app

@router.get("/applications/{app_id}", response_model=Application)
async def get_application(app_id: str):
    app = applications_db.get(app_id)
    if not app:
        raise HTTPException(404, "Application not found")
    return app

@router.post("/applications/{app_id}/upload")
async def upload_document(
    app_id: str,
    template_id: str = Form(...),
    file: UploadFile = File(...)
):
    app = applications_db.get(app_id)
    if not app:
        raise HTTPException(404, "Application not found")

    import uuid
    file_id = str(uuid.uuid4())
    file_path = f"/tmp/fundraising_uploads/{file_id}_{file.filename}"

    import os
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    uf = UploadedFile(
        id=file_id,
        template_id=template_id,
        file_name=file.filename,
        file_path=file_path,
        status="validating"
    )
    # Replace any existing file for this template, or append if new
    app.files = [f for f in app.files if f.template_id != template_id]
    app.files.append(uf)

    # AI Validation
    result = await validate_document(template_id, file_path)
    uf.status = "approved" if result["approved"] else "rejected"
    uf.ai_feedback = "\n".join(result["issues"]) if result["issues"] else "مدرک تایید شد"

    return {
        "file": uf,
        "validation": result
    }

@router.post("/applications/{app_id}/submit")
async def submit_application(app_id: str):
    app = applications_db.get(app_id)
    if not app:
        raise HTTPException(404, "Application not found")

    # Check all required docs are approved
    required = merge_templates(app.platforms)
    required_ids = {t.id for t in required}
    uploaded_ids = {f.template_id for f in app.files if f.status == "approved"}

    missing = required_ids - uploaded_ids
    if missing:
        raise HTTPException(400, f"Missing required documents: {list(missing)}")

    app.status = "submitted"
    # In real: send to each platform via their API/email
    return {"status": "submitted", "platforms": app.platforms, "files_count": len(app.files)}

@router.get("/applications/{app_id}/status")
async def get_application_status(app_id: str):
    app = applications_db.get(app_id)
    if not app:
        raise HTTPException(404, "Application not found")

    required = merge_templates(app.platforms)
    status_per_template = []
    for t in required:
        f = next((u for u in app.files if u.template_id == t.id), None)
        status_per_template.append({
            "template": t,
            "file": f,
            "status": f.status if f else "missing"
        })

    return {
        "application_id": app_id,
        "startup_name": app.startup_name,
        "platforms": app.platforms,
        "overall_status": app.status,
        "documents": status_per_template,
        "ready_to_submit": all(s["status"] == "approved" for s in status_per_template)
    }