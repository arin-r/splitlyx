import { z } from "zod";
import {
  createTRPCRouter, protectedProcedure,
} from "~/server/api/trpc";

export const repaymentRouter = createTRPCRouter({
  getSuggested: protectedProcedure.input(z.object({
    groupId: z.string(),
    userId: z.string(),
  })).query(
    async ({ ctx, input }) => {
      const repayments = await ctx.prisma.repayment.findMany({
        where: {
          OR: [
            {
              groupId: input.groupId,
              payerId: input.userId,
            },
            {
              groupId: input.groupId,
              receiverId: input.userId,
            }
          ]
        },
        select: {
          payer: {
            select: {
              name: true,
              id: true,
            }
          },
          receiver: {
            select: {
              name: true, 
              id: true,
            }
          },
          repaymentAmount: true,
        }
      });

      return repayments;
    }
  )
});
