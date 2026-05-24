import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import servicesRouter from "./services";
import quotationsRouter from "./quotations";
import cashbackRouter from "./cashback";
import referralsRouter from "./referrals";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import agentsRouter from "./agents";
import superadminRouter from "./superadmin";
import analyticsRouter from "./analytics";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(servicesRouter);
router.use(quotationsRouter);
router.use(cashbackRouter);
router.use(referralsRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(agentsRouter);
router.use(superadminRouter);
router.use(analyticsRouter);
router.use(profileRouter);

export default router;
