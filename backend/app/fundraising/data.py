# Ponytail: mock platforms & templates from actual docs (حلال فاند + ارزیابی اولیه). Upgrade to DB later.
from app.fundraising.schemas import FundingPlatform, DocumentTemplate

PLATFORMS = [
    FundingPlatform(
        id="halal-fund",
        name="سکوی تامین مالی جمعی حلال فاند",
        type="crowdfunding",
        logo="🌙",
        required_doc_ids=["financial-2y", "trial-balance", "credit-report", "consent-letter", "guarantee-letter"]
    ),
    FundingPlatform(
        id="karen-crowd",
        name="کراد فاندینگ کارن کراد",
        type="crowdfunding",
        logo="🚀",
        required_doc_ids=["reg-docs", "financial-2y", "business-plan", "tech-info", "hr-info"]
    ),
    FundingPlatform(
        id="vc-pishgaman",
        name="صندوق سرمایه‌گذاری پیشگامان",
        type="vc",
        logo="⚡",
        required_doc_ids=["business-plan", "tech-info", "financial-2y", "asset-list"]
    ),
]

TEMPLATES = [
    DocumentTemplate(
        id="reg-docs",
        name="اطلاعات ثبتی شرکت",
        category="registration",
        description="روزنامه رسمی، اساسنامه، آگهی آخرین تغییرات",
        required_by=["karen-crowd"],
        ai_validation_rule="بررسی شناسه ملی، تاریخ آگهی تغییرات و نام صاحبان امضا",
        sample_format="PDF"
    ),
    DocumentTemplate(
        id="financial-2y",
        name="صورتهای مالی دو سال آخر حسابرسی شده",
        category="financial",
        description="صورت‌های مالی حسابرسی شده دو سال اخیر همراه با گزارش حسابرس",
        required_by=["halal-fund", "karen-crowd", "vc-pishgaman"],
        ai_validation_rule="بررسی امضای حسابرس رسمی، تطابق ترازنامه و کامل بودن دو سال مالی",
        sample_format="PDF, XLSX"
    ),
    DocumentTemplate(
        id="trial-balance",
        name="تراز آزمایشی کل و معین سال جاری",
        category="financial",
        description="تراز آزمایشی به روز سال جاری با مهر حسابدار",
        required_by=["halal-fund"],
        ai_validation_rule="بررسی تراز بودن کل و معین و تاریخ به روز",
        sample_format="XLSX, PDF"
    ),
    DocumentTemplate(
        id="credit-report",
        name="استعلام رتبه‌بندی اعتباری (nics24.ir)",
        category="credit",
        description="استعلام رتبه‌بندی اعتباری اشخاص حقیقی و حقوقی",
        required_by=["halal-fund"],
        ai_validation_rule="بررسی گواهی nics24 و عدم وجود چک برگشتی رفع سوء‌اثر نشده",
        sample_format="PDF"
    ),
    DocumentTemplate(
        id="consent-letter",
        name="اجازه‌نامه استعلام اعتباری",
        category="legal",
        description="فرم اجازه‌نامه اعتبارسنجی با مهر و امضای مجاز",
        required_by=["halal-fund"],
        ai_validation_rule="بررسی مهر و امضا و تطابق با آخرین صاحبان امضا",
        sample_format="PDF, JPG"
    ),
    DocumentTemplate(
        id="guarantee-letter",
        name="پیش‌نویس ضمانت‌نامه بانکی یا صندوق",
        category="legal",
        description="پیش‌نویس ضمانت‌نامه تعهد پرداخت مطابق شرایط سکو",
        required_by=["halal-fund"],
        ai_validation_rule="بررسی ذینفع (حساب یاری امین ملل)، تعهد پرداخت بدون قید و شرط و مدت ۱ سال",
        sample_format="PDF"
    ),
    DocumentTemplate(
        id="business-plan",
        name="مدل کسب و کار و بیزینس پلن",
        category="product",
        description="مستند کامل مدل درآمدی، بازار هدف، رقبا و پیش‌بینی مالی",
        required_by=["karen-crowd", "vc-pishgaman"],
        ai_validation_rule="بررسی وجود بوم مدل کسب و کار، تحلیل بازار و پیش‌بینی مالی",
        sample_format="DOCX, PDF, PPTX"
    ),
    DocumentTemplate(
        id="tech-info",
        name="مستندات فنی و معماری محصول",
        category="technical",
        description="شرح محصول، معماری فنی، stack، فاز توسعه",
        required_by=["karen-crowd", "vc-pishgaman"],
        ai_validation_rule="بررسی شفافیت دک فنی و وجود نمودار معماری یا توضیحات stack",
        sample_format="PDF"
    ),
    DocumentTemplate(
        id="asset-list",
        name="لیست دارایی‌ها و تسهیلات شرکت",
        category="asset",
        description="لیست دارایی‌های ثابت، جاری و وام‌های دریافتی",
        required_by=["vc-pishgaman"],
        ai_validation_rule="بررسی جزییات تسهیلات و اسناد مالکیت دارایی‌ها",
        sample_format="XLSX, PDF"
    ),
    DocumentTemplate(
        id="hr-info",
        name="اطلاعات سهامداران و کلید پرسنل (منابع انسانی)",
        category="hr",
        description="جدول سهامداری، سوابق تیم کلیدی و ساختار سازمانی",
        required_by=["karen-crowd"],
        ai_validation_rule="بررسی درصد سهامداری (مجموع ۱۰۰٪) و رزومه افراد کلیدی",
        sample_format="XLSX, PDF"
    ),
]
