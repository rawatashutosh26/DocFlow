import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import prisma from "@/lib/db";
import { ColumnPreferencesProvider } from "@/components/ColumnPreferencesProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Fetch the active user session securely on the server
  const session = await getServerSession(authOptions);

  // 2. If no valid session exists, immediately redirect to login
  if (!session) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  const [pendingReviewsCount, pendingAccessRequestsCount] = await Promise.all([
    prisma.document.count({
      where: {
        status: 'PENDING',
        deletedAt: null,
        ownerId: { not: userId },
        sharedAccess: { some: { userId } },
      },
    }),
    prisma.accessRequest.count({
      where: { ownerId: userId, status: 'PENDING' },
    }),
  ]);

  return (
    <ColumnPreferencesProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar on the left */}
        <Sidebar
          pendingReviewsCount={pendingReviewsCount}
          pendingAccessRequestsCount={pendingAccessRequestsCount}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={session.user} />

          {/* Scrollable Main Section */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ColumnPreferencesProvider>
  );
}