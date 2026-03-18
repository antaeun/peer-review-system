"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">동료 평가 시스템</CardTitle>
          <CardDescription>
            익명 기반 동료 평가를 통해 팀의 성장을 지원합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            href="/admin"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            관리자 대시보드
          </Link>
          <p className="text-center text-sm text-muted-foreground">
            평가 참여자는 이메일로 받은 개별 링크를 통해 접속해주세요
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
