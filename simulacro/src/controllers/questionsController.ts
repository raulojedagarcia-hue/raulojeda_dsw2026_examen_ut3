import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError.js';
import * as questionsService from '../services/questionsService.js';

export function answerQuestion(req: Request, res: Response, next: NextFunction): void {
  try {
    const { body } = req.body;
    if (!body) {
      throw new AppError(400, 'Missing required field: question', 'BAD_REQUEST');
    }
    const question = questionsService.answerQuestion(
      body
    );
    res.status(201).json({ data: question });
  } catch (err) {
    next(err);
  }
}