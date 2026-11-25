import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError.js';
import * as noticesService from '../services/noticeService.js';
import { ResourceNotFoundError } from '../errors/ResourceNotFound.js';

// GET /api/v1/admin/notices?page=1&limit=20
export function list(req: Request, res: Response, next: NextFunction): void {
    try {
        // req.query always arrives as text: the controller converts it.
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);
        res.json(noticesService.list(page, limit));
    } catch (err) {
        next(err);
    }
}

// GET /api/v1/admin/notices/:noticeId
export function getById(req: Request, res: Response, next: NextFunction): void {
  try {
    const notice = noticesService.getById(String(req.params.noticeId));
    if (!notice) {
      throw new ResourceNotFoundError(404, `Notice with id '${req.params.noticeId}' not found`, 'RESOURCE_NOT_FOUND',  String(req.params.noticeId),);
    }
    res.json({ data: notice });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/admin/notices
export function create(req: Request, res: Response, next: NextFunction): void {
  try {
    const { title, description } = req.body;
    if (!title || typeof title !== 'string') {
      throw new AppError(400, 'Missing required field: title', 'BAD_REQUEST');
    }
    const notice = noticesService.create(
      title.trim(),
      typeof description === 'string' ? description.trim() : '',
    );
    res.status(201).json({ data: notice });
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

    const noticeId = String(req.params.noticeId);
    const notice = noticesService.update(noticeId, { title: title !== undefined ? title.trim() : undefined, 
      description,});
      
    if (!notice) {
      throw new AppError(404, `Notice with id '${req.params.noticeId}' not found`, 'NOT_FOUND');
    }
    res.json({ data: notice });
  } catch (err) {
    next(err);
  }
}