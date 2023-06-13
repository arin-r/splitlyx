import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { prisma } from "~/server/db";

export const repaymentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repayments = await ctx.prisma.repayment.findMany({
        where: {
          groupId: input.groupId,
        },
        select: {
          payer: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
          repaymentAmount: true,
        },
      });
      return repayments;
    }),
});
