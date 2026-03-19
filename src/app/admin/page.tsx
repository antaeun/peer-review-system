"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LogOut, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Round {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";
  createdAt: string;
  _count: { tokens: number; responses: number };
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "준비중", variant: "secondary" },
  ACTIVE: { label: "진행중", variant: "default" },
  CLOSED: { label: "마감", variant: "destructive" },
  ARCHIVED: { label: "보관", variant: "outline" },
};

export default function AdminPage() {
  const router = useRouter();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function fetchRounds() {
    fetch("/api/rounds")
      .then((r) => r.json())
      .then(setRounds)
      .finally(() => setLoading(false));
  }

  async function handleDeleteRound(e: React.MouseEvent, round: Round) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`"${round.title}" 라운드를 삭제하시겠습니까? 모든 관련 데이터가 삭제됩니다.`)) return;
    try {
      const res = await fetch(`/api/rounds/${round.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("라운드가 삭제되었습니다");
      fetchRounds();
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  }

  useEffect(() => {
    fetchRounds();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">관리자 대시보드</h1>
          <div className="flex gap-2">
            <Link
              href="/admin/employees"
              className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
            >
              <Users className="h-4 w-4" />
              직원 관리
            </Link>
            <Link href="/admin/rounds/new" className={cn(buttonVariants(), "gap-1.5")}>
              <Plus className="h-4 w-4" />
              새 평가 라운드
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <p className="text-muted-foreground">로딩 중...</p>
        ) : rounds.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                아직 생성된 평가 라운드가 없습니다
              </p>
              <Link href="/admin/rounds/new" className={buttonVariants()}>
                첫 평가 라운드 만들기
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rounds.map((round) => {
              const status = STATUS_MAP[round.status];
              return (
                <Link key={round.id} href={`/admin/rounds/${round.id}`}>
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{round.title}</CardTitle>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <CardDescription>
                        {new Date(round.startDate).toLocaleDateString("ko-KR")} ~{" "}
                        {new Date(round.endDate).toLocaleDateString("ko-KR")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>참여자: {round._count.tokens}명</span>
                          <span>제출: {round._count.responses}건</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteRound(e, round)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
