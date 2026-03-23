"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { TEMPLATES, type TemplateId } from "@/lib/questions";

export default function NewRoundPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const startDate = form.get("startDate") as string;
    const endDate = form.get("endDate") as string;

    const today = new Date().toISOString().split("T")[0];
    if (startDate < today) {
      toast.error("시작일은 오늘 이후 날짜로 지정해주세요");
      setLoading(false);
      return;
    }
    if (endDate < startDate) {
      toast.error("종료일은 시작일 이후로 지정해주세요");
      setLoading(false);
      return;
    }

    const data = {
      title: form.get("title"),
      template: form.get("template"),
      startDate,
      endDate,
      message: form.get("message"),
    };

    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create round");

      const round = await res.json();
      toast.success("평가 라운드가 생성되었습니다");
      router.push(`/admin/rounds/${round.id}`);
    } catch {
      toast.error("생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

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

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>새 평가 라운드 만들기</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">평가 유형</Label>
                <select
                  id="template"
                  name="template"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue="peer"
                >
                  {Object.values(TEMPLATES).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">라운드 이름</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="예: 2026년 1분기 동료 평가"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">시작일</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">종료일</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">안내 메시지 (선택)</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="평가 참여자에게 전달할 안내 메시지"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "생성 중..." : "라운드 생성"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
