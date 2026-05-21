import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, servicesTable, testimonialsTable } from "@workspace/db";
import { GetServiceParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/services", async (_req, res): Promise<void> => {
  const services = await db.select().from(servicesTable).where(eq(servicesTable.isActive, true));
  res.json(services.map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: s.category,
    description: s.description,
    benefits: s.benefits as string[],
    requiredDocuments: s.requiredDocuments as string[],
    icon: s.icon,
    isActive: s.isActive,
  })));
});

router.get("/services/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  res.json({
    id: service.id,
    name: service.name,
    slug: service.slug,
    category: service.category,
    description: service.description,
    benefits: service.benefits as string[],
    requiredDocuments: service.requiredDocuments as string[],
    icon: service.icon,
    isActive: service.isActive,
  });
});

router.get("/testimonials", async (_req, res): Promise<void> => {
  const testimonials = await db.select().from(testimonialsTable)
    .where(eq(testimonialsTable.isActive, true));
  res.json(testimonials.map(t => ({
    id: t.id,
    customerName: t.customerName,
    role: t.role,
    content: t.content,
    rating: t.rating,
    isActive: t.isActive,
  })));
});

export default router;
