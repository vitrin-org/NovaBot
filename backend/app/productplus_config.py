from app.config import settings

DB_CONFIG = {
    'host': settings.productplus_host,
    'port': settings.productplus_port,
    'dbname': settings.productplus_db,
    'user': settings.productplus_user,
    'password': settings.productplus_password,
}

CATEGORY_MAP = {
    'health-tech': 'healthcare',
    'operations-supply': 'supply-chain',
    'hr-saas': 'hr',
    'fintech-infra': 'fintech',
    'retail-commerce': 'e-commerce',
    'climate-industry': 'climate',
    'legal-services': 'legal',
    'finance-services': 'finance',
    'growth-services': 'marketing',
    'product-operations': 'product-management',
}

STATUS_MAP = {
    'published': 'active',
    'scheduled': 'active',
    'pending_review': 'pending',
    'draft': 'inactive',
    'rejected': 'inactive',
}

SPONSOR_TIER_FROM_STATUS = {
    'published': 2,
    'scheduled': 1,
    'pending_review': 1,
    'draft': 0,
    'rejected': 0,
}