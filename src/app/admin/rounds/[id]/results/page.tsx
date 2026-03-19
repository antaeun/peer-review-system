"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { EVAL_QUESTIONS } from "@/lib/questions";

interface ResultItem {
  id: string;
  targetId: string;
  avgScores: Record<string, number>;
  totalAvg: number;
  evalCount: number;
  target: { name: string; team: string; position: string };
}

interface AnonResponse {
  id: string;
  targetId: string;
  strength: string | null;
  improvement: string | null;
}

interface RoundData {
  round: { id: string; title: string; status: string };
  results: ResultItem[];
  anonResponses: AnonResponse[];
}

function getItemAvg(r: ResultItem) {
  const valid = Object.values(r.avgScores).filter((v) => v > 0);
  return valid.length > 0 ? valid.reduce((sum, v) => sum + v, 0) / valid.length : 0;
}

function downloadTeamCSV(
  team: string,
  results: ResultItem[],
  anonResponses: AnonResponse[],
  roundTitle: string
) {
  const BOM = "\uFEFF";
  const headers = [
    "순위",
    "이름",
    "직급",
    "총점(100점)",
    "항목평균",
    "평가수",
    ...EVAL_QUESTIONS.map((q) => q.text),
    "강점(익명)",
    "개선점(익명)",
  ];

  const rows = results.map((r, i) => {
    const comments = anonResponses.filter((a) => a.targetId === r.targetId);
    const strengths = comments
      .map((c) => c.strength)
      .filter(Boolean)
      .join(" / ");
    const improvements = comments
      .map((c) => c.improvement)
      .filter(Boolean)
      .join(" / ");

    return [
      i + 1,
      r.target.name,
      r.target.position,
      r.totalAvg.toFixed(1),
      getItemAvg(r).toFixed(1),
      r.evalCount,
      ...EVAL_QUESTIONS.map((q) => {
        const v = r.avgScores[q.id];
        return v === undefined || v === null ? "-" : v === 0 ? "N/A" : v.toFixed(2);
      }),
      strengths,
      improvements,
    ];
  });

  const csvContent =
    BOM +
    [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      )
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${roundTitle}_${team}_결과.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<RoundData | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/rounds/${id}/results`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  if (!data) return <div className="p-8">로딩 중...</div>;

  // 팀별 그룹화
  const teamGroups = new Map<string, ResultItem[]>();
  for (const r of data.results) {
    const team = r.target.team;
    if (!teamGroups.has(team)) teamGroups.set(team, []);
    teamGroups.get(team)!.push(r);
  }

  const selectedResult = data.results.find((r) => r.targetId === selectedTarget);
  const selectedComments = data.anonResponses.filter(
    (r) => r.targetId === selectedTarget
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/admin/rounds/${id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Link>
          <h1 className="text-lg font-bold">{data.round.title} - 결과</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* 전체 결과 다운로드 */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadTeamCSV("전체", data.results, data.anonResponses, data.round.title)
            }
          >
            <Download className="mr-2 h-4 w-4" />
            전체 결과 다운로드
          </Button>
        </div>

        {/* 팀별 결과 */}
        {Array.from(teamGroups.entries()).map(([team, teamResults]) => (
          <Card key={team}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {team}
                  <Badge variant="secondary">{teamResults.length}명</Badge>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadTeamCSV(team, teamResults, data.anonResponses, data.round.title)
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV 다운로드
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>순위</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>직급</TableHead>
                    <TableHead>총점 (100점)</TableHead>
                    <TableHead>항목 평균</TableHead>
                    <TableHead>평가 수</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamResults.map((r, i) => {
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{r.target.name}</TableCell>
                        <TableCell>{r.target.position}</TableCell>
                        <TableCell>
                          <Badge variant={r.totalAvg >= 80 ? "default" : r.totalAvg >= 60 ? "secondary" : "destructive"}>
                            {r.totalAvg.toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getItemAvg(r).toFixed(1)}</TableCell>
                        <TableCell>{r.evalCount}명</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTarget(r.targetId)}
                          >
                            상세
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {/* 개별 상세 */}
        {selectedResult && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedResult.target.name} 상세 결과
                </CardTitle>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {selectedResult.totalAvg.toFixed(1)}
                    <span className="text-sm font-normal text-muted-foreground"> / 100점</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    항목 평균 {getItemAvg(selectedResult).toFixed(1)}점 · 평가자 {selectedResult.evalCount}명
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>항목</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>평균 점수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EVAL_QUESTIONS.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="text-sm">{q.text}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{q.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {selectedResult.avgScores[q.id] === 0 ? "N/A" : selectedResult.avgScores[q.id]?.toFixed(2) ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {selectedComments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">익명 코멘트</h3>
                  {selectedComments.map((c) => (
                    <div key={c.id} className="border rounded-md p-4 space-y-2">
                      {c.strength && (
                        <div>
                          <span className="text-sm font-medium text-green-600">강점: </span>
                          <span className="text-sm">{c.strength}</span>
                        </div>
                      )}
                      {c.improvement && (
                        <div>
                          <span className="text-sm font-medium text-orange-600">개선점: </span>
                          <span className="text-sm">{c.improvement}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
