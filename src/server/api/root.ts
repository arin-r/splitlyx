import { exampleRouter } from "~/server/api/routers/example";
import { createTRPCRouter } from "~/server/api/trpc";
import { groupRouter } from "./routers/group";
import { expenseRouter } from "./routers/expense";
import { repaymentRouter } from "./routers/repayment";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  group: groupRouter,
  expense: expenseRouter,
  repayment: repaymentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
