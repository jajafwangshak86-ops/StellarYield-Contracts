import { Router } from "express";
import {
  getUser,
  getUserPortfolio,
  searchUsers,
} from "../controllers/users.js";

export const usersRouter = Router();

usersRouter.get("/", searchUsers);
usersRouter.get("/:address", getUser);
usersRouter.get("/:address/portfolio", getUserPortfolio);
