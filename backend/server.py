from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import secrets
import resend
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_admin: bool = False
    created_at: datetime

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category_id: str = Field(default_factory=lambda: f"cat_{uuid.uuid4().hex[:12]}")
    name_en: str
    name_pt: str
    description_en: Optional[str] = None
    description_pt: Optional[str] = None
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name_en: str
    name_pt: str
    description_en: Optional[str] = None
    description_pt: Optional[str] = None
    order: int = 0

class CategoryUpdate(BaseModel):
    name_en: Optional[str] = None
    name_pt: Optional[str] = None
    description_en: Optional[str] = None
    description_pt: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class Option(BaseModel):
    model_config = ConfigDict(extra="ignore")
    option_id: str = Field(default_factory=lambda: f"opt_{uuid.uuid4().hex[:12]}")
    category_id: str
    name_en: str
    name_pt: str
    description_en: str
    description_pt: str
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OptionCreate(BaseModel):
    category_id: str
    name_en: str
    name_pt: str
    description_en: str
    description_pt: str
    order: int = 0

class OptionUpdate(BaseModel):
    name_en: Optional[str] = None
    name_pt: Optional[str] = None
    description_en: Optional[str] = None
    description_pt: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class AccessToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    token_id: str = Field(default_factory=lambda: f"tok_{uuid.uuid4().hex[:12]}")
    token: str = Field(default_factory=lambda: secrets.token_urlsafe(16))
    couple_name: str
    couple_email: Optional[str] = None
    max_uses: int = 1
    current_uses: int = 0
    birth_plan_id: Optional[str] = None  # Link to birth plan
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime

class TokenCreate(BaseModel):
    couple_name: str
    couple_email: Optional[str] = None
    max_uses: int = 1
    expires_at: datetime

class BirthPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    plan_id: str = Field(default_factory=lambda: f"plan_{uuid.uuid4().hex[:12]}")
    token_id: str
    couple_name: str
    couple_email: Optional[str] = None
    selected_options: List[str] = []
    visited_categories: List[str] = []
    current_category_index: int = 0
    comments: Optional[str] = ""
    is_completed: bool = False
    status: str = "in_progress"  # in_progress, pending_review, approved
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None

class BirthPlanUpdate(BaseModel):
    selected_options: List[str]
    visited_categories: List[str]
    current_category_index: int
    comments: Optional[str] = None

class ContactSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    submission_id: str = Field(default_factory=lambda: f"sub_{uuid.uuid4().hex[:12]}")
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

class EmailTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    template_id: str
    name: str
    subject_en: str
    subject_pt: str
    body_en: str
    body_pt: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailTemplateUpdate(BaseModel):
    subject_en: Optional[str] = None
    subject_pt: Optional[str] = None
    body_en: Optional[str] = None
    body_pt: Optional[str] = None

# ============== EMAIL HELPERS ==============

async def send_email(to_email: str, subject: str, html_content: str):
    """Send email using Resend"""
    if not resend.api_key:
        logger.warning("Resend API key not configured, skipping email")
        return None
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {result}")
        return result
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return None

async def get_email_template(template_id: str):
    """Get email template from database"""
    template = await db.email_templates.find_one({"template_id": template_id}, {"_id": 0})
    return template

async def send_token_email(couple_email: str, couple_name: str, token: str, expires_at: datetime, language: str = "pt"):
    """Send token email to couple"""
    template = await get_email_template("token_generated")
    if not template:
        return None
    
    subject = template.get(f"subject_{language}", template.get("subject_en"))
    body = template.get(f"body_{language}", template.get("body_en"))
    
    # Replace placeholders
    birth_plan_url = f"{os.environ.get('FRONTEND_URL', 'https://birth-plan-builder-1.preview.emergentagent.com')}/birth-plan"
    body = body.replace("{{couple_name}}", couple_name)
    body = body.replace("{{token}}", token)
    body = body.replace("{{expires_at}}", expires_at.strftime("%d/%m/%Y"))
    body = body.replace("{{birth_plan_url}}", birth_plan_url)
    
    await send_email(couple_email, subject, body)

async def send_plan_completed_email(couple_email: str, couple_name: str, plan_id: str, language: str = "pt"):
    """Send notification that birth plan is pending review"""
    template = await get_email_template("plan_completed")
    if not template:
        return None
    
    subject = template.get(f"subject_{language}", template.get("subject_en"))
    body = template.get(f"body_{language}", template.get("body_en"))
    
    body = body.replace("{{couple_name}}", couple_name)
    
    await send_email(couple_email, subject, body)

async def send_plan_approved_email(couple_email: str, couple_name: str, plan_id: str, language: str = "pt"):
    """Send notification that birth plan is approved"""
    template = await get_email_template("plan_approved")
    if not template:
        return None
    
    subject = template.get(f"subject_{language}", template.get("subject_en"))
    body = template.get(f"body_{language}", template.get("body_en"))
    
    view_url = f"{os.environ.get('FRONTEND_URL', 'https://birth-plan-builder-1.preview.emergentagent.com')}/birth-plan/{plan_id}"
    body = body.replace("{{couple_name}}", couple_name)
    body = body.replace("{{view_url}}", view_url)
    
    await send_email(couple_email, subject, body)

async def send_admin_notification(plan_id: str, couple_name: str):
    """Notify admin of new pending birth plan"""
    # Get admin email from settings or use default
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@dhyanagarey.ie')
    
    subject = f"New Birth Plan Pending Review - {couple_name}"
    body = f"""
    <h2>New Birth Plan Submitted</h2>
    <p>A new birth plan has been submitted and is pending your review.</p>
    <p><strong>Couple:</strong> {couple_name}</p>
    <p><strong>Plan ID:</strong> {plan_id}</p>
    <p>Please log in to the admin panel to review and approve.</p>
    """
    
    await send_email(admin_email, subject, body)

# ============== AUTH HELPERS ==============

async def get_current_user(request: Request) -> User:
    """Get current user from session token"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Require admin access"""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== AUTH ROUTES ==============

class AdminLogin(BaseModel):
    email: str
    password: str

@api_router.post("/auth/login")
async def admin_login(data: AdminLogin, response: Response):
    """Admin login with email/password"""
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@dhyanagarey.ie')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Dhyana2026!')
    
    if data.email != ADMIN_EMAIL or data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    existing_user = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": ADMIN_EMAIL,
            "name": "Dhyana Garey",
            "picture": None,
            "is_admin": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = secrets.token_urlsafe(32)
    session_doc = {
        "session_id": f"sess_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current user info"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============== CATEGORY ROUTES ==============

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    """Get all active categories"""
    categories = await db.categories.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return categories

@api_router.get("/admin/categories", response_model=List[Category])
async def get_all_categories(user: User = Depends(require_admin)):
    """Get all categories (admin)"""
    categories = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return categories

@api_router.post("/admin/categories", response_model=Category)
async def create_category(data: CategoryCreate, user: User = Depends(require_admin)):
    """Create a new category"""
    category = Category(**data.model_dump())
    doc = category.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.categories.insert_one(doc)
    return category

@api_router.put("/admin/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, data: CategoryUpdate, user: User = Depends(require_admin)):
    """Update a category"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.categories.update_one(
        {"category_id": category_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category = await db.categories.find_one({"category_id": category_id}, {"_id": 0})
    return category

@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, user: User = Depends(require_admin)):
    """Delete a category"""
    result = await db.categories.delete_one({"category_id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.options.delete_many({"category_id": category_id})
    return {"message": "Category deleted"}

# ============== OPTION ROUTES ==============

@api_router.get("/options", response_model=List[Option])
async def get_options(category_id: Optional[str] = None):
    """Get all active options"""
    query = {"is_active": True}
    if category_id:
        query["category_id"] = category_id
    options = await db.options.find(query, {"_id": 0}).sort("order", 1).to_list(500)
    return options

@api_router.get("/admin/options", response_model=List[Option])
async def get_all_options(category_id: Optional[str] = None, user: User = Depends(require_admin)):
    """Get all options (admin) - supports category filtering"""
    query = {}
    if category_id:
        query["category_id"] = category_id
    options = await db.options.find(query, {"_id": 0}).sort("order", 1).to_list(500)
    return options

@api_router.post("/admin/options", response_model=Option)
async def create_option(data: OptionCreate, user: User = Depends(require_admin)):
    """Create a new option"""
    category = await db.categories.find_one({"category_id": data.category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    option = Option(**data.model_dump())
    doc = option.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.options.insert_one(doc)
    return option

@api_router.put("/admin/options/{option_id}", response_model=Option)
async def update_option(option_id: str, data: OptionUpdate, user: User = Depends(require_admin)):
    """Update an option"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.options.update_one(
        {"option_id": option_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Option not found")
    
    option = await db.options.find_one({"option_id": option_id}, {"_id": 0})
    return option

@api_router.delete("/admin/options/{option_id}")
async def delete_option(option_id: str, user: User = Depends(require_admin)):
    """Delete an option"""
    result = await db.options.delete_one({"option_id": option_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Option not found")
    return {"message": "Option deleted"}

# ============== TOKEN ROUTES ==============

@api_router.get("/admin/tokens")
async def get_tokens(user: User = Depends(require_admin)):
    """Get all access tokens"""
    tokens = await db.access_tokens.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tokens

@api_router.post("/admin/tokens")
async def create_token(data: TokenCreate, user: User = Depends(require_admin)):
    """Create a new access token"""
    token = AccessToken(
        couple_name=data.couple_name,
        couple_email=data.couple_email,
        max_uses=data.max_uses,
        expires_at=data.expires_at,
        created_by=user.user_id
    )
    doc = token.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["expires_at"] = doc["expires_at"].isoformat()
    await db.access_tokens.insert_one(doc)
    
    # Send email if couple email provided
    if data.couple_email:
        await send_token_email(
            data.couple_email,
            data.couple_name,
            token.token,
            data.expires_at
        )
    
    return token

@api_router.delete("/admin/tokens/{token_id}")
async def delete_token(token_id: str, user: User = Depends(require_admin)):
    """Delete a token"""
    result = await db.access_tokens.delete_one({"token_id": token_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Token not found")
    return {"message": "Token deleted"}

@api_router.post("/validate-token")
async def validate_token(token: str):
    """Validate an access token for birth plan access"""
    token_doc = await db.access_tokens.find_one({"token": token}, {"_id": 0})
    
    if not token_doc:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    max_uses = token_doc.get("max_uses", 1)
    current_uses = token_doc.get("current_uses", 0)
    remaining_uses = max(0, max_uses - current_uses)
    
    # Check expiry first
    expires_at = token_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token has expired")
    
    token_info = {
        "max_uses": max_uses,
        "current_uses": current_uses,
        "remaining_uses": remaining_uses
    }
    
    # Check if birth plan already exists for this token
    if token_doc.get("birth_plan_id"):
        plan = await db.birth_plans.find_one({"plan_id": token_doc["birth_plan_id"]}, {"_id": 0})
        if plan:
            # Return existing plan (even if submitted) so user can view or edit
            return {
                "plan_id": plan["plan_id"], 
                "couple_name": plan["couple_name"], 
                "existing": True,
                "token_info": token_info
            }
    
    # Check if max uses reached (only block if no existing plan)
    if current_uses >= max_uses:
        raise HTTPException(status_code=400, detail="Token has reached maximum uses")
    
    # Create new birth plan (this is first access)
    birth_plan = BirthPlan(
        token_id=token_doc["token_id"],
        couple_name=token_doc["couple_name"],
        couple_email=token_doc.get("couple_email")
    )
    doc = birth_plan.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.birth_plans.insert_one(doc)
    
    # Link birth plan to token (don't increment usage yet - wait for PDF generation)
    await db.access_tokens.update_one(
        {"token": token},
        {"$set": {"birth_plan_id": birth_plan.plan_id}}
    )
    
    return {
        "plan_id": birth_plan.plan_id, 
        "couple_name": birth_plan.couple_name, 
        "existing": False,
        "token_info": token_info
    }

# ============== BIRTH PLAN ROUTES ==============

@api_router.get("/birth-plan/{plan_id}")
async def get_birth_plan(plan_id: str):
    """Get a birth plan by ID"""
    plan = await db.birth_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Birth plan not found")
    return plan

@api_router.get("/birth-plan/{plan_id}/token-info")
async def get_birth_plan_token_info(plan_id: str):
    """Get token info for a birth plan"""
    plan = await db.birth_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Birth plan not found")
    
    token_doc = await db.access_tokens.find_one({"token_id": plan["token_id"]}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=404, detail="Token not found")
    
    max_uses = token_doc.get("max_uses", 1)
    current_uses = token_doc.get("current_uses", 0)
    remaining_uses = max(0, max_uses - current_uses)
    
    return {
        "max_uses": max_uses,
        "current_uses": current_uses,
        "remaining_uses": remaining_uses
    }

@api_router.put("/birth-plan/{plan_id}")
async def update_birth_plan(plan_id: str, data: BirthPlanUpdate):
    """Update birth plan selected options and progress"""
    update_data = {
        "selected_options": data.selected_options,
        "visited_categories": data.visited_categories,
        "current_category_index": data.current_category_index,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Only update comments if provided
    if data.comments is not None:
        update_data["comments"] = data.comments
    
    result = await db.birth_plans.update_one(
        {"plan_id": plan_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Birth plan not found")
    
    plan = await db.birth_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    return plan

@api_router.put("/admin/birth-plan/{plan_id}")
async def admin_update_birth_plan(plan_id: str, data: BirthPlanUpdate, user: User = Depends(require_admin)):
    """Admin update birth plan selected options"""
    update_data = {
        "selected_options": data.selected_options,
        "visited_categories": data.visited_categories,
        "current_category_index": data.current_category_index,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Only update comments if provided
    if data.comments is not None:
        update_data["comments"] = data.comments
    
    result = await db.birth_plans.update_one(
        {"plan_id": plan_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Birth plan not found")
    
    plan = await db.birth_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    return plan

@api_router.post("/birth-plan/{plan_id}/complete")
async def complete_birth_plan(plan_id: str):
    """Mark birth plan as completed and pending review"""
    plan = await db.birth_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Birth plan not found")
    
    # Increment token usage when completing (generating PDF)
    token_doc = await db.access_tokens.find_one({"token_id": plan["token_id"]}, {"_id": 0})
    if token_doc:
        await db.access_tokens.update_one(
            {"token_id": plan["token_id"]},
            {"$inc": {"current_uses": 1}}
        )
    
    result = await db.birth_plans.update_one(
        {"plan_id": plan_id},
        {"$set": {
            "is_completed": True,
            "status": "pending_review",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Send email to couple
    if plan.get("couple_email"):
        await send_plan_completed_email(
            plan["couple_email"],
            plan["couple_name"],
            plan_id
        )
    
    # Notify admin
    await send_admin_notification(plan_id, plan["couple_name"])
    
    updated_plan = await db.birth_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    return updated_plan

@api_router.post("/birth-plan/{plan_id}/reset")
async def reset_birth_plan(plan_id: str):
    """Reset birth plan to in_progress status for editing"""
    plan = await db.birth_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Birth plan not found")
    
    # Check if token has remaining uses
    token_doc = await db.access_tokens.find_one({"token_id": plan["token_id"]}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Token not found")
    
    max_uses = token_doc.get("max_uses", 1)
    current_uses = token_doc.get("current_uses", 0)
    
    if current_uses >= max_uses:
        raise HTTPException(status_code=400, detail="No remaining edit attempts")
    
    # Reset the birth plan status
    result = await db.birth_plans.update_one(
        {"plan_id": plan_id},
        {"$set": {
            "is_completed": False,
            "status": "in_progress",
            "visited_categories": [],
            "current_category_index": 0,
            "completed_at": None,
            "approved_at": None,
            "approved_by": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated_plan = await db.birth_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    return updated_plan

@api_router.post("/admin/birth-plan/{plan_id}/approve")
async def approve_birth_plan(plan_id: str, user: User = Depends(require_admin)):
    """Approve a birth plan"""
    plan = await db.birth_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Birth plan not found")
    
    result = await db.birth_plans.update_one(
        {"plan_id": plan_id},
        {"$set": {
            "status": "approved",
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": user.user_id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Send approval email to couple
    if plan.get("couple_email"):
        await send_plan_approved_email(
            plan["couple_email"],
            plan["couple_name"],
            plan_id
        )
    
    updated_plan = await db.birth_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    return updated_plan

@api_router.get("/admin/birth-plans")
async def get_all_birth_plans(user: User = Depends(require_admin)):
    """Get all birth plans (admin)"""
    plans = await db.birth_plans.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return plans

@api_router.get("/admin/birth-plans/pending")
async def get_pending_birth_plans(user: User = Depends(require_admin)):
    """Get pending review birth plans"""
    plans = await db.birth_plans.find(
        {"status": "pending_review"},
        {"_id": 0}
    ).sort("completed_at", -1).to_list(100)
    return plans

# ============== EMAIL TEMPLATE ROUTES ==============

@api_router.get("/admin/email-templates")
async def get_email_templates(user: User = Depends(require_admin)):
    """Get all email templates"""
    templates = await db.email_templates.find({}, {"_id": 0}).to_list(20)
    return templates

@api_router.put("/admin/email-templates/{template_id}")
async def update_email_template(template_id: str, data: EmailTemplateUpdate, user: User = Depends(require_admin)):
    """Update an email template"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.email_templates.update_one(
        {"template_id": template_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = await db.email_templates.find_one({"template_id": template_id}, {"_id": 0})
    return template

# ============== CONTACT ROUTES ==============

@api_router.post("/contact", response_model=ContactSubmission, status_code=201)
async def submit_contact(data: ContactCreate):
    """Submit a contact form"""
    submission = ContactSubmission(**data.model_dump())
    doc = submission.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contact_submissions.insert_one(doc)
    return submission

@api_router.get("/admin/contacts")
async def get_contacts(user: User = Depends(require_admin)):
    """Get all contact submissions (admin)"""
    contacts = await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return contacts

# ============== SEED DATA ==============

@api_router.post("/admin/seed")
async def seed_data(user: User = Depends(require_admin)):
    """Seed initial categories, options, and email templates"""
    # Check if data already exists
    existing = await db.categories.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded"}
    
    # Categories
    categories_data = [
        {"category_id": "cat_labor", "name_en": "Labor Preferences", "name_pt": "Preferências do Trabalho de Parto", 
         "description_en": "Your preferences for labor and delivery", 
         "description_pt": "Suas preferências para o trabalho de parto", "order": 1},
        {"category_id": "cat_pain", "name_en": "Pain Management", "name_pt": "Manejo da Dor",
         "description_en": "Options for pain relief during labor",
         "description_pt": "Opções para alívio da dor durante o trabalho de parto", "order": 2},
        {"category_id": "cat_delivery", "name_en": "Delivery Preferences", "name_pt": "Preferências do Parto",
         "description_en": "Your preferences for the delivery",
         "description_pt": "Suas preferências para o parto", "order": 3},
        {"category_id": "cat_baby", "name_en": "Baby Care", "name_pt": "Cuidados com o Bebê",
         "description_en": "Preferences for immediate newborn care",
         "description_pt": "Preferências para os cuidados imediatos com o recém-nascido", "order": 4},
        {"category_id": "cat_feeding", "name_en": "Feeding Preferences", "name_pt": "Preferências de Alimentação",
         "description_en": "Breastfeeding and feeding choices",
         "description_pt": "Escolhas sobre amamentação e alimentação", "order": 5},
        {"category_id": "cat_medical", "name_en": "Medical Interventions", "name_pt": "Intervenções Médicas",
         "description_en": "Preferences regarding medical procedures",
         "description_pt": "Preferências sobre procedimentos médicos", "order": 6},
    ]
    
    for cat_data in categories_data:
        category = Category(**cat_data)
        doc = category.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.categories.insert_one(doc)
    
    # Options (abbreviated for space)
    options_data = [
        {"option_id": "opt_1", "category_id": "cat_labor", "name_en": "Freedom to move and walk", "name_pt": "Liberdade para me movimentar e caminhar", "description_en": "I would like the freedom to move around and change positions during labor", "description_pt": "Gostaria de ter liberdade para me movimentar e mudar de posição durante o trabalho de parto", "order": 1},
        {"option_id": "opt_2", "category_id": "cat_labor", "name_en": "Use of birthing ball", "name_pt": "Uso de bola de parto", "description_en": "I would like to use a birthing ball during labor", "description_pt": "Gostaria de usar uma bola de parto durante o trabalho de parto", "order": 2},
        {"option_id": "opt_3", "category_id": "cat_labor", "name_en": "Dim lighting", "name_pt": "Luz baixa", "description_en": "I prefer a calm environment with dim lighting", "description_pt": "Prefiro um ambiente calmo com luz baixa", "order": 3},
        {"option_id": "opt_4", "category_id": "cat_labor", "name_en": "Play my own music", "name_pt": "Tocar minha própria música", "description_en": "I would like to play my own music during labor", "description_pt": "Gostaria de tocar minha própria música durante o trabalho de parto", "order": 4},
        {"option_id": "opt_5", "category_id": "cat_pain", "name_en": "Epidural anesthesia", "name_pt": "Anestesia peridural", "description_en": "I am open to receiving epidural anesthesia for pain relief", "description_pt": "Estou aberta a receber anestesia peridural para alívio da dor", "order": 1},
        {"option_id": "opt_6", "category_id": "cat_pain", "name_en": "Natural pain relief methods", "name_pt": "Métodos naturais de alívio da dor", "description_en": "I prefer to try natural methods first (breathing, massage, water)", "description_pt": "Prefiro tentar métodos naturais primeiro (respiração, massagem, água)", "order": 2},
        {"option_id": "opt_7", "category_id": "cat_pain", "name_en": "Warm water immersion", "name_pt": "Imersão em água quente", "description_en": "I would like to use a bath or shower for pain relief", "description_pt": "Gostaria de usar banheira ou chuveiro para alívio da dor", "order": 3},
        {"option_id": "opt_8", "category_id": "cat_pain", "name_en": "Gas and air (Entonox)", "name_pt": "Gás e ar (Entonox)", "description_en": "I am open to using gas and air for pain relief", "description_pt": "Estou aberta a usar gás e ar para alívio da dor", "order": 4},
        {"option_id": "opt_9", "category_id": "cat_delivery", "name_en": "Avoid episiotomy if possible", "name_pt": "Evitar episiotomia se possível", "description_en": "I prefer to avoid an episiotomy unless medically necessary", "description_pt": "Prefiro evitar episiotomia a menos que seja medicamente necessário", "order": 1},
        {"option_id": "opt_10", "category_id": "cat_delivery", "name_en": "Partner to cut umbilical cord", "name_pt": "Parceiro(a) cortar o cordão umbilical", "description_en": "I would like my partner to cut the umbilical cord", "description_pt": "Gostaria que meu(minha) parceiro(a) cortasse o cordão umbilical", "order": 2},
        {"option_id": "opt_11", "category_id": "cat_delivery", "name_en": "Delayed cord clamping", "name_pt": "Clampeamento tardio do cordão", "description_en": "I would like to wait before clamping the umbilical cord", "description_pt": "Gostaria de esperar antes de clampear o cordão umbilical", "order": 3},
        {"option_id": "opt_12", "category_id": "cat_baby", "name_en": "Immediate skin-to-skin contact", "name_pt": "Contato pele a pele imediato", "description_en": "I want immediate skin-to-skin contact with my baby", "description_pt": "Quero contato pele a pele imediato com meu bebê", "order": 1},
        {"option_id": "opt_13", "category_id": "cat_baby", "name_en": "Delay weighing and measuring", "name_pt": "Adiar pesagem e medição", "description_en": "I prefer to delay routine procedures for bonding time", "description_pt": "Prefiro adiar procedimentos de rotina para ter tempo de vínculo", "order": 2},
        {"option_id": "opt_14", "category_id": "cat_baby", "name_en": "Baby to stay with me at all times", "name_pt": "Bebê ficar comigo o tempo todo", "description_en": "I want my baby to stay with me and not be taken to nursery", "description_pt": "Quero que meu bebê fique comigo e não seja levado ao berçário", "order": 3},
        {"option_id": "opt_15", "category_id": "cat_feeding", "name_en": "Exclusive breastfeeding", "name_pt": "Amamentação exclusiva", "description_en": "I plan to exclusively breastfeed my baby", "description_pt": "Planejo amamentar meu bebê exclusivamente", "order": 1},
        {"option_id": "opt_16", "category_id": "cat_feeding", "name_en": "No bottles or pacifiers", "name_pt": "Sem mamadeiras ou chupetas", "description_en": "Please do not give my baby bottles or pacifiers", "description_pt": "Por favor, não deem mamadeiras ou chupetas ao meu bebê", "order": 2},
        {"option_id": "opt_17", "category_id": "cat_feeding", "name_en": "Lactation consultant support", "name_pt": "Apoio de consultora de amamentação", "description_en": "I would like support from a lactation consultant", "description_pt": "Gostaria de apoio de uma consultora de amamentação", "order": 3},
        {"option_id": "opt_18", "category_id": "cat_medical", "name_en": "Avoid induction unless necessary", "name_pt": "Evitar indução a menos que necessário", "description_en": "I prefer to avoid induction unless medically necessary", "description_pt": "Prefiro evitar indução a menos que seja medicamente necessário", "order": 1},
        {"option_id": "opt_19", "category_id": "cat_medical", "name_en": "Discuss all interventions first", "name_pt": "Discutir todas as intervenções primeiro", "description_en": "Please discuss any interventions with me before proceeding", "description_pt": "Por favor, discutam qualquer intervenção comigo antes de proceder", "order": 2},
    ]
    
    for opt_data in options_data:
        option = Option(**opt_data)
        doc = option.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.options.insert_one(doc)
    
    # Email templates
    email_templates = [
        {
            "template_id": "token_generated",
            "name": "Token Generated",
            "subject_en": "Your Birth Plan Access - Doula Dhyana Garey",
            "subject_pt": "Seu Acesso ao Plano de Parto - Doula Dhyana Garey",
            "body_en": """
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #A86A61;">Hello {{couple_name}}!</h1>
    <p>Your birth plan access has been created. Use the token below to access your personalized birth plan generator:</p>
    <div style="background: #F5F2F0; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
        <p style="font-size: 24px; font-weight: bold; color: #2D2A2A; margin: 0;">{{token}}</p>
    </div>
    <p><strong>Access Link:</strong> <a href="{{birth_plan_url}}" style="color: #A86A61;">{{birth_plan_url}}</a></p>
    <p><strong>Expires:</strong> {{expires_at}}</p>
    <p>If you have any questions, please don't hesitate to contact me.</p>
    <p style="color: #8A817C;">With love,<br>Dhyana Garey</p>
</div>
            """,
            "body_pt": """
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #A86A61;">Olá {{couple_name}}!</h1>
    <p>Seu acesso ao plano de parto foi criado. Use o token abaixo para acessar seu gerador de plano de parto personalizado:</p>
    <div style="background: #F5F2F0; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
        <p style="font-size: 24px; font-weight: bold; color: #2D2A2A; margin: 0;">{{token}}</p>
    </div>
    <p><strong>Link de Acesso:</strong> <a href="{{birth_plan_url}}" style="color: #A86A61;">{{birth_plan_url}}</a></p>
    <p><strong>Expira em:</strong> {{expires_at}}</p>
    <p>Se tiver alguma dúvida, não hesite em me contatar.</p>
    <p style="color: #8A817C;">Com carinho,<br>Dhyana Garey</p>
</div>
            """,
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "template_id": "plan_completed",
            "name": "Birth Plan Completed",
            "subject_en": "Birth Plan Submitted - Pending Review",
            "subject_pt": "Plano de Parto Enviado - Aguardando Revisão",
            "body_en": """
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #A86A61;">Thank you, {{couple_name}}!</h1>
    <p>Your birth plan has been submitted successfully and is now pending review.</p>
    <p>I will review your choices and get back to you soon with any questions or to confirm everything is ready.</p>
    <p>Thank you for trusting me with this important moment in your life.</p>
    <p style="color: #8A817C;">With love,<br>Dhyana Garey</p>
</div>
            """,
            "body_pt": """
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #A86A61;">Obrigada, {{couple_name}}!</h1>
    <p>Seu plano de parto foi enviado com sucesso e está aguardando revisão.</p>
    <p>Vou revisar suas escolhas e entrarei em contato em breve com perguntas ou para confirmar que está tudo pronto.</p>
    <p>Obrigada por confiar em mim neste momento tão importante da sua vida.</p>
    <p style="color: #8A817C;">Com carinho,<br>Dhyana Garey</p>
</div>
            """,
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "template_id": "plan_approved",
            "name": "Birth Plan Approved",
            "subject_en": "Your Birth Plan is Approved!",
            "subject_pt": "Seu Plano de Parto foi Aprovado!",
            "body_en": """
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #A86A61;">Great news, {{couple_name}}!</h1>
    <p>Your birth plan has been reviewed and approved!</p>
    <p>You can view and download your birth plan here:</p>
    <div style="text-align: center; margin: 20px 0;">
        <a href="{{view_url}}" style="background: #A86A61; color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; display: inline-block;">View Your Birth Plan</a>
    </div>
    <p>If you have any questions or need to make changes, please contact me.</p>
    <p style="color: #8A817C;">With love,<br>Dhyana Garey</p>
</div>
            """,
            "body_pt": """
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #A86A61;">Ótimas notícias, {{couple_name}}!</h1>
    <p>Seu plano de parto foi revisado e aprovado!</p>
    <p>Você pode visualizar e baixar seu plano de parto aqui:</p>
    <div style="text-align: center; margin: 20px 0;">
        <a href="{{view_url}}" style="background: #A86A61; color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; display: inline-block;">Ver Seu Plano de Parto</a>
    </div>
    <p>Se tiver alguma dúvida ou precisar fazer alterações, entre em contato comigo.</p>
    <p style="color: #8A817C;">Com carinho,<br>Dhyana Garey</p>
</div>
            """,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for template in email_templates:
        await db.email_templates.insert_one(template)
    
    return {"message": "Data seeded successfully", "categories": len(categories_data), "options": len(options_data), "templates": len(email_templates)}

# ============== ROOT ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "Doula Dhyana Garey API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
