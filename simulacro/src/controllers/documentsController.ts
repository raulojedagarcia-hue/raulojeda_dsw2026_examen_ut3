import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError.js';
import * as documentsService from '../services/documentsService.js';
import { ResourceNotFoundError } from '../errors/ResourceNotFound.js';

// GET /api/v1/admin/documents?page=1&limit=20
export function list(req: Request, res: Response, next: NextFunction): void {
    try {
        // req.query always arrives as text: the controller converts it.
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);
        res.json(documentsService.list(page, limit));
    } catch (err) {
        next(err);
    }
}

// GET /api/v1/admin/documents/:documentId
export function getById(req: Request, res: Response, next: NextFunction): void {
  try {
    const document = documentsService.getById(String(req.params.documentId));
    if (!document) {
      throw new ResourceNotFoundError(404, `Document with id '${req.params.documentId}' not found`, 'RESOURCE_NOT_FOUND',  String(req.params.documentId),);
    }
    res.json({ data: document });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/admin/documents
export function create(req: Request, res: Response, next: NextFunction): void {
  try {
    const { title, description } = req.body;
    if (!title || typeof title !== 'string') {
      throw new AppError(400, 'Missing required field: title', 'BAD_REQUEST');
    }
    const document = documentsService.create(
      title.trim(),
      typeof description === 'string' ? description.trim() : '',
    );
    res.status(201).json({ data: document });
  } catch (err) {
    next(err);
  }
}

// PATCH
export function update(req: Request, res: Response, next: NextFunction): void {
  try {
    const { title, description } = req.body;
    if (!title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({
          error: 'INVALID_TITLE',
          message: 'Title must be a non-empty string',
        })
        return;
      }
    }

    const documentId = String(req.params.documentId);
    const document = documentsService.update(documentId, { title: title !== undefined ? title.trim() : undefined, 
      description,});
      
    if (!document) {
      throw new AppError(404, `Document with id '${req.params.documentId}' not found`, 'NOT_FOUND');
    }
    res.json({ data: document });
  } catch (err) {
    next(err);
  }
}