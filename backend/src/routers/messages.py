"""Messages router — send compliance comments to advisors."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from src.audit import record_audit_event
from src.auth import TokenInfo, get_current_user
from src.database import get_db
from src.models.advisor import Advisor
from src.models.document import Document
from src.models.message import Message
from src.models.user import User

router = APIRouter(prefix="/api/messages", tags=["messages"])


# ── Schemas ──────────────────────────────────────────────────────────────────


class CreateMessageRequest(BaseModel):
    recipient_user_id: int | None = None
    document_id: int | None = None
    client_id: int | None = None
    advisor_id: int | None = None
    subject: str
    body: str


class MessageOut(BaseModel):
    id: int
    sender_user_id: int
    sender_name: str | None
    recipient_user_id: int
    recipient_name: str | None
    document_id: int | None
    client_id: int | None
    client_name: str | None
    document_filename: str | None
    subject: str
    body: str
    compliance_score: int | None
    compliance_status: str | None
    is_read: bool
    read_at: str | None
    created_at: str
    reply_count: int = 0


class ReplyRequest(BaseModel):
    body: str


class UnreadCountOut(BaseModel):
    unread_count: int


# ── Helpers ──────────────────────────────────────────────────────────────────


def _message_to_dict(msg: Message, reply_count: int = 0) -> dict:
    return {
        "id": msg.id,
        "sender_user_id": msg.sender_user_id,
        "sender_name": msg.sender.name if msg.sender else None,
        "recipient_user_id": msg.recipient_user_id,
        "recipient_name": msg.recipient.name if msg.recipient else None,
        "document_id": msg.document_id,
        "client_id": msg.client_id,
        "client_name": msg.client.person_name if msg.client else None,
        "document_filename": msg.document.original_filename if msg.document else None,
        "subject": msg.subject,
        "body": msg.body,
        "compliance_score": msg.compliance_score,
        "compliance_status": msg.compliance_status,
        "is_read": msg.is_read,
        "read_at": msg.read_at.isoformat() if msg.read_at else None,
        "created_at": msg.created_at.isoformat(),
        "reply_count": reply_count,
    }


# ── Routes ───────────────────────────────────────────────────────────────────


@router.get("/unread-count", response_model=UnreadCountOut)
def get_unread_count(
    user: TokenInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = (
        db.execute(
            select(Message)
            .where(
                Message.recipient_user_id == user.effective_user_id,
                Message.is_read == False,  # noqa: E712
            )
        )
        .scalars()
        .all()
    )
    return {"unread_count": len(count)}


@router.get("/", response_model=list[MessageOut])
def list_messages(
    unread_only: bool = False,
    user: TokenInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Subquery for reply counts
    reply_alias = Message.__table__.alias("replies")
    reply_count_sq = (
        select(func.count(reply_alias.c.id))
        .where(reply_alias.c.reply_to_message_id == Message.id)
        .correlate(Message)
        .scalar_subquery()
        .label("reply_count")
    )

    query = (
        select(Message, reply_count_sq)
        .options(
            joinedload(Message.sender),
            joinedload(Message.recipient),
            joinedload(Message.client),
            joinedload(Message.document),
        )
        .where(Message.reply_to_message_id.is_(None))
        .order_by(Message.created_at.desc())
    )

    if user.effective_role == "advisor":
        query = query.where(Message.recipient_user_id == user.effective_user_id)
    else:
        # Compliance/admin sees sent + received
        query = query.where(
            (Message.sender_user_id == user.effective_user_id)
            | (Message.recipient_user_id == user.effective_user_id)
        )

    if unread_only:
        query = query.where(Message.is_read == False)  # noqa: E712

    rows = db.execute(query).unique().all()
    return [_message_to_dict(msg, rc) for msg, rc in rows]


@router.post("/", response_model=MessageOut, status_code=201)
def create_message(
    payload: CreateMessageRequest,
    user: TokenInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only compliance/admin can send messages
    if user.effective_role == "advisor":
        raise HTTPException(403, "Rådgivare kan inte skicka meddelanden")

    recipient_user_id = payload.recipient_user_id
    document: Document | None = None

    # Resolve recipient from document if not explicitly given
    if payload.document_id:
        document = db.get(Document, payload.document_id)
        if not document:
            raise HTTPException(404, "Dokumentet hittades inte")
        if not recipient_user_id and document.user_id:
            recipient_user_id = document.user_id

    # Resolve recipient from advisor_id → user with matching name
    if not recipient_user_id and payload.advisor_id:
        advisor = db.get(Advisor, payload.advisor_id)
        if not advisor:
            raise HTTPException(404, "Rådgivaren hittades inte")
        matched_user = db.execute(
            select(User).where(User.name == advisor.advisor_name)
        ).scalar_one_or_none()
        if matched_user:
            recipient_user_id = matched_user.id

    if not recipient_user_id:
        raise HTTPException(400, "Mottagare krävs")

    # Verify recipient exists
    recipient = db.get(User, recipient_user_id)
    if not recipient:
        raise HTTPException(404, "Mottagaren hittades inte")

    # Snapshot compliance from document
    compliance_score = None
    compliance_status = None
    if document:
        compliance_score = document.compliance_score
        compliance_status = document.compliance_status

    msg = Message(
        sender_user_id=user.effective_user_id,
        recipient_user_id=recipient_user_id,
        document_id=payload.document_id,
        client_id=payload.client_id,
        subject=payload.subject,
        body=payload.body,
        compliance_score=compliance_score,
        compliance_status=compliance_status,
    )
    db.add(msg)
    db.flush()

    record_audit_event(
        db,
        event_type="message.created",
        actor=user.effective_username,
        summary=f"Skickade meddelande till {recipient.name or recipient.username}: {payload.subject}",
        target_type="message",
        target_id=str(msg.id),
        detail={
            "recipient_user_id": recipient_user_id,
            "document_id": payload.document_id,
            "subject": payload.subject,
        },
    )
    db.commit()
    db.refresh(msg)

    # Reload with relationships
    msg = db.execute(
        select(Message)
        .options(
            joinedload(Message.sender),
            joinedload(Message.recipient),
            joinedload(Message.client),
            joinedload(Message.document),
        )
        .where(Message.id == msg.id)
    ).unique().scalar_one()

    return _message_to_dict(msg)


@router.put("/{message_id}/read")
def mark_as_read(
    message_id: int,
    user: TokenInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = db.get(Message, message_id)
    if not msg:
        raise HTTPException(404, "Meddelandet hittades inte")
    if msg.recipient_user_id != user.effective_user_id:
        raise HTTPException(403, "Åtkomst nekad")

    if not msg.is_read:
        msg.is_read = True
        msg.read_at = datetime.now(timezone.utc)
        db.commit()

    return {"ok": True}


@router.get("/{message_id}/thread", response_model=list[MessageOut])
def get_thread(
    message_id: int,
    user: TokenInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = db.execute(
        select(Message)
        .options(
            joinedload(Message.sender),
            joinedload(Message.recipient),
            joinedload(Message.client),
            joinedload(Message.document),
        )
        .where(Message.id == message_id)
    ).unique().scalar_one_or_none()
    if not parent:
        raise HTTPException(404, "Meddelandet hittades inte")

    # Only sender or recipient of the root message can view thread
    uid = user.effective_user_id
    if parent.sender_user_id != uid and parent.recipient_user_id != uid:
        raise HTTPException(403, "Åtkomst nekad")

    replies = (
        db.execute(
            select(Message)
            .options(
                joinedload(Message.sender),
                joinedload(Message.recipient),
                joinedload(Message.client),
                joinedload(Message.document),
            )
            .where(Message.reply_to_message_id == message_id)
            .order_by(Message.created_at.asc())
        )
        .unique()
        .scalars()
        .all()
    )

    return [_message_to_dict(parent)] + [_message_to_dict(r) for r in replies]


@router.post("/{message_id}/reply", response_model=MessageOut, status_code=201)
def reply_to_message(
    message_id: int,
    payload: ReplyRequest,
    user: TokenInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = db.get(Message, message_id)
    if not parent:
        raise HTTPException(404, "Meddelandet hittades inte")

    # If this is itself a reply, follow to root
    root = parent
    if root.reply_to_message_id is not None:
        root = db.get(Message, root.reply_to_message_id)
        if not root:
            raise HTTPException(404, "Ursprungsmeddelandet hittades inte")

    uid = user.effective_user_id
    if root.sender_user_id != uid and root.recipient_user_id != uid:
        raise HTTPException(403, "Åtkomst nekad")

    # Swap sender/recipient: the replier becomes sender, the other party becomes recipient
    if uid == root.sender_user_id:
        recipient_user_id = root.recipient_user_id
    else:
        recipient_user_id = root.sender_user_id

    reply = Message(
        sender_user_id=uid,
        recipient_user_id=recipient_user_id,
        document_id=root.document_id,
        client_id=root.client_id,
        subject=root.subject,
        body=payload.body,
        reply_to_message_id=root.id,
    )
    db.add(reply)
    db.flush()

    record_audit_event(
        db,
        event_type="message.reply_created",
        actor=user.effective_username,
        summary=f"Svarade på meddelande: {root.subject}",
        target_type="message",
        target_id=str(reply.id),
        detail={
            "parent_message_id": root.id,
            "recipient_user_id": recipient_user_id,
        },
    )
    db.commit()
    db.refresh(reply)

    # Reload with relationships
    reply = db.execute(
        select(Message)
        .options(
            joinedload(Message.sender),
            joinedload(Message.recipient),
            joinedload(Message.client),
            joinedload(Message.document),
        )
        .where(Message.id == reply.id)
    ).unique().scalar_one()

    return _message_to_dict(reply)
