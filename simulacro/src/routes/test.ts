import { Router } from "express";

export const tester = Router();

tester.get('/zardodreamteam', (_req, res)=>{
    res.status(200).json({team : 'zardodreamteam'})
});