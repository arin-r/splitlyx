import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Header } from "~/components/Header";
import Sidebar from "~/components/Sidebar";
import { prisma } from "~/server/db";

export const getServerSideProps: GetServerSideProps<{
  groups: { id: string; name: string }[];
}> = async (ctx) => {
  const session = await getSession(ctx);
  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      groups: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Impossible case");
  }

  return {
    props: {
      groups: user.groups,
    },
  };
};

export default function Page({
  groups,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  //This may be suboptimal as compared to using Link component, but I had styling issues with that, hence I'm using this approach for now
  return (
    <div>
      <Header />
      <div className="flex justify-center">
        <div className="w-3/4">
          <div className="mt-1 flex">
            <div className="mr-4 mt-[3rem] w-1/4">
              <div className="mb-3 flex justify-between">
                <div className="text-xl">Groups</div>
                <div className="rounded-md px-2 hover:cursor-pointer hover:bg-neutral-focus">
                  <Link href="/groups/new">+</Link>
                </div>
              </div>
              <ul className="ml-1 text-lg">
                {groups.length === 0 ? (
                  <li>No groups</li>
                ) : (
                  groups.map((group) => (
                    <Link
                      key={group.id}
                      className="box-content block rounded-md px-2 py-1 hover:cursor-pointer hover:bg-neutral-focus"
                      href={`/groups/${group.id}`}
                    >
                      - {group.name}
                    </Link>
                  ))
                )}
              </ul>
              <div className="divider"></div>
            </div>
            <div className="w-3/4">
              <div className="flex h-full items-center justify-center">
                <div>
                  <h1 className="text-4xl font-bold">About Splitlyx</h1>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam
                    id congue neque, sed consequat justo. Sed a gravida velit,
                    vitae venenatis ex. Morbi sit amet metus eleifend, placerat
                    ipsum ut, mattis augue. Fusce pretium magna risus, et
                    elementum justo auctor et. Vestibulum maximus magna eu
                    vestibulum rhoncus. Maecenas interdum tristique mauris, a
                    egestas justo aliquam eget. Quisque egestas malesuada justo,
                    ac sodales erat convallis quis. Fusce fringilla consequat
                    augue at pretium. Ut et blandit purus, quis iaculis erat. In
                    at rutrum tellus, ac mattis ligula. Integer quis luctus
                    felis, et auctor mi. Vestibulum varius ipsum nec fringilla
                    accumsan. Vestibulum cursus scelerisque libero, a eleifend
                    sapien venenatis ac. In metus magna, molestie et leo eget,
                    tincidunt semper erat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
