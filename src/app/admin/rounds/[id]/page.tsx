"use client";

import { useEffect, useState, use } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Copy, Send, Lock } from "lucide-react";
import { toast } from "sonner";

interface Token {
  id: string;
  token: string;
  isSubmitted: boolean;
  submittedAt: string | null;
  exclusionConfirmed: boolean;
  employee: { id: string; name: string; email: string; team: string; position: string };
}

interface Round {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  message: string | null;
  tokens: Token[];
  _count: { responses: number; anonResponses: number };
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "준비중", variant: "secondary" },
  ACTIVE: { label: "진행중", variant: "default" },
  CLOSED: { label: "마감", variant: "destructive" },
  ARCHIVED: { label: "보관", variant: "outline" },
};

export default function RoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRound = () => {
    fetch(`/api/rounds/${id}`)
      .then((r) => r.json())
      .then(setRound)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function issueTokens() {
    const res = await fetch(`/api/rounds/${id}/tokens`, { method: "POST" });
    const data = await res.json();
    toast.success(data.message);
    fetchRound();
  }

  async function closeRound() {
    if (!confirm("평가를 마감하시겠습니까? 마감 후에는 응답이 익명화됩니다.")) return;
    const res = await fetch(`/api/rounds/${id}/close`, { method: "POST" });
    const data = await res.json();
    toast.success(data.message);
    fetchRound();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/eval/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("링크가 복사되었습니다");
  }

  if (loading) return <div className="p-8">로딩 중...</div>;
  if (!round) return <div className="p-8">라운드를 찾을 수 없습니다</div>;

  const status = STATUS_MAP[round.status];
  const submitted = round.tokens.filter((t) => t.isSubmitted).length;
  const total = round.tokens.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* 라운드 정보 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{round.title}</CardTitle>
                <CardDescription>
                  {new Date(round.startDate).toLocaleDateString("ko-KR")} ~{" "}
                  {new Date(round.endDate).toLocaleDateString("ko-KR")}
                </CardDescription>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm">
              <span>참여자: {total}명</span>
              <span>제출: {submitted}명</span>
              <span>응답: {round._count.responses}건</span>
            </div>

            {round.message && (
              <p className="mt-4 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {round.message}
              </p>
            )}

            <div className="flex gap-2 mt-4">
              {round.status === "DRAFT" && (
                <Button onClick={issueTokens}>
                  <Send className="mr-2 h-4 w-4" />
                  토큰 발급 & 시작
                </Button>
              )}
              {round.status === "ACTIVE" && (
                <>
                  <Button variant="outline" onClick={issueTokens}>
                    <Send className="mr-2 h-4 w-4" />
                    신규 직원 토큰 추가 발급
                  </Button>
                  <Button variant="destructive" onClick={closeRound}>
                    <Lock className="mr-2 h-4 w-4" />
                    평가 마감
                  </Button>
                </>
              )}
              {round.status === "CLOSED" && (
                <Link href={`/admin/rounds/${id}/results`} className={buttonVariants()}>
                  결과 보기
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 참여자 목록 */}
        {round.tokens.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">참여자 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>팀</TableHead>
                    <TableHead>직급</TableHead>
                    <TableHead>제외 확인</TableHead>
                    <TableHead>제출</TableHead>
                    <TableHead>링크</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {round.tokens.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {t.employee.name}
                      </TableCell>
                      <TableCell>{t.employee.team}</TableCell>
                      <TableCell>{t.employee.position}</TableCell>
                      <TableCell>
                        <Badge variant={t.exclusionConfirmed ? "default" : "outline"}>
                          {t.exclusionConfirmed ? "완료" : "대기"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.isSubmitted ? "default" : "outline"}>
                          {t.isSubmitted ? "제출" : "미제출"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(t.token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
