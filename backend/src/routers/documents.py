"""Documents upload, processing, and retrieval endpoints."""

from __future__ import annotations

import asyncio
import hashlib
import json
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from src.config import settings
from src.database import get_db
from src.extraction.base import ExtractionError
from src.extraction.llm_extractor import AnthropicExtractor
from src.models.document import Document, DocumentExtraction

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload")
async def upload_documents(
    files: list[UploadFile],
    db: Session = Depends(get_db),
):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for file in files:
        content = await file.read()
        file_hash = hashlib.sha256(content).hexdigest()

        # Check for duplicate
        existing = db.execute(
            select(Document).where(Document.file_hash == file_hash)
        ).scalar_one_or_none()
        duplicate_warning = None
        if existing:
            duplicate_warning = f"Duplicate of document #{existing.id} ({existing.original_filename})"

        stored_filename = f"{uuid.uuid4().hex}.pdf"
        (settings.upload_dir / stored_filename).write_bytes(content)

        doc = Document(
            original_filename=file.filename or "unknown.pdf",
            stored_filename=stored_filename,
            file_hash=file_hash,
            file_size=len(content),
            mime_type=file.content_type or "application/pdf",
            status="uploaded",
        )
        db.add(doc)
        db.flush()

        results.append({
            "id": doc.id,
            "filename": doc.original_filename,
            "size": doc.file_size,
            "duplicate_warning": duplicate_warning,
        })

    db.commit()
    return {"documents": results}


@router.get("/process")
async def process_documents(
    ids: str,
    db: Session = Depends(get_db),
):
    doc_ids = [int(x.strip()) for x in ids.split(",") if x.strip()]

    docs = db.execute(
        select(Document).where(Document.id.in_(doc_ids))
    ).scalars().all()

    if not docs:
        raise HTTPException(404, "No documents found")

    async def event_stream():
        extractor = AnthropicExtractor()

        for doc in docs:
            extraction = DocumentExtraction(
                document_id=doc.id,
                extractor_name=extractor.name,
                status="processing",
            )
            db.add(extraction)
            doc.status = "processing"
            db.commit()

            yield _sse({"id": doc.id, "status": "processing", "message": "Analyserar dokument..."})

            try:
                pdf_path = settings.upload_dir / doc.stored_filename
                result = await extractor.extract(pdf_path)
                result_data = result.model_dump(mode="json")

                extraction.status = "completed"
                extraction.extraction_data = result_data
                extraction.document_type = result_data.get("document_type")
                extraction.document_date = str(result.document_date) if result.document_date else None
                extraction.page_count = result.page_count
                extraction.client_name = result.client.person_name if result.client else None
                extraction.advisor_name = result.advisor.advisor_name if result.advisor else None
                doc.status = "completed"
                db.commit()

                yield _sse({
                    "id": doc.id,
                    "status": "completed",
                    "message": "Klar",
                    "document_type": extraction.document_type,
                    "client_name": extraction.client_name,
                })

            except (ExtractionError, Exception) as exc:
                extraction.status = "failed"
                extraction.error_message = str(exc)
                doc.status = "failed"
                db.commit()

                yield _sse({
                    "id": doc.id,
                    "status": "failed",
                    "message": f"Fel: {exc}",
                })

            # Small delay between documents so SSE events flush
            await asyncio.sleep(0.1)

        yield _sse({"status": "all_done"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("")
def list_documents(db: Session = Depends(get_db)):
    docs = db.execute(
        select(Document)
        .options(joinedload(Document.extractions))
        .order_by(Document.created_at.desc())
    ).unique().scalars().all()

    return [_doc_summary(doc) for doc in docs]


@router.get("/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.execute(
        select(Document)
        .options(joinedload(Document.extractions))
        .where(Document.id == document_id)
    ).unique().scalar_one_or_none()

    if not doc:
        raise HTTPException(404, "Document not found")

    latest = _latest_extraction(doc)
    return {
        "id": doc.id,
        "original_filename": doc.original_filename,
        "file_size": doc.file_size,
        "mime_type": doc.mime_type,
        "status": doc.status,
        "created_at": doc.created_at.isoformat(),
        "extractions": [
            {
                "id": ext.id,
                "extractor_name": ext.extractor_name,
                "status": ext.status,
                "error_message": ext.error_message,
                "document_type": ext.document_type,
                "document_date": ext.document_date,
                "page_count": ext.page_count,
                "client_name": ext.client_name,
                "advisor_name": ext.advisor_name,
                "extraction_data": ext.extraction_data,
                "created_at": ext.created_at.isoformat(),
            }
            for ext in doc.extractions
        ],
    }


@router.get("/{document_id}/file")
def get_document_file(document_id: int, db: Session = Depends(get_db)):
    doc = db.execute(
        select(Document).where(Document.id == document_id)
    ).scalar_one_or_none()

    if not doc:
        raise HTTPException(404, "Document not found")

    file_path = settings.upload_dir / doc.stored_filename
    if not file_path.exists():
        raise HTTPException(404, "File not found on disk")

    return FileResponse(
        file_path,
        media_type=doc.mime_type,
        filename=doc.original_filename,
    )


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _latest_extraction(doc: Document) -> DocumentExtraction | None:
    if not doc.extractions:
        return None
    return sorted(doc.extractions, key=lambda e: e.created_at, reverse=True)[0]


def _doc_summary(doc: Document) -> dict:
    latest = _latest_extraction(doc)
    return {
        "id": doc.id,
        "original_filename": doc.original_filename,
        "file_size": doc.file_size,
        "status": doc.status,
        "created_at": doc.created_at.isoformat(),
        "document_type": latest.document_type if latest else None,
        "document_date": latest.document_date if latest else None,
        "client_name": latest.client_name if latest else None,
        "advisor_name": latest.advisor_name if latest else None,
        "page_count": latest.page_count if latest else None,
    }
