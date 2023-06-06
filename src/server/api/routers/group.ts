import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const groupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        participants: z.string().array().nonempty(),
        groupName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userName = ctx.session.user.name;
      if (userName === null || userName === undefined) {
        throw new Error("Unexpected Behaviour of ctx.session.user.name");
      }
      input.participants.push(userName);
      const userIds = await ctx.prisma.user.findMany({
        where: {
          name: {
            in: input.participants,
          },
        },
        select: {
          id: true,
        },
      });
      return ctx.prisma.group.create({
        data: {
          name: input.groupName,
          participants: {
            connect: userIds,
          },
        },
      });
    }),

  getAll: protectedProcedure.query(({ ctx, input }) => {
    return ctx.prisma.user.findFirst({
      where: {
        name: ctx.session.user.name,
      },
      select: {
        groups: {
          select: {
            name: true,
          },
        },
      },
    });
  }),

  getAllExpenses: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.expense.findMany({
        where: {
          groupId: input.groupId,
        },
        select: {
          name: true,
          id: true,
          totalExpense: true,
        },
      });
    }),
  //dev only
  deleteAll: protectedProcedure.mutation(async ({ ctx, input }) => {
    return ctx.prisma.group.deleteMany({});
  }),
});
