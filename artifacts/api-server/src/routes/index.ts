import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import servicesRouter from "./services";
import quotationsRouter from "./quotations";
import cashbackRouter from "./cashback";
import referralsRouter from "./referrals";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(servicesRouter);
router.use(quotationsRouter);
router.use(cashbackRouter);
router.use(referralsRouter);
router.use(dashboardRouter);
router.use(adminRouter);

export default router;
