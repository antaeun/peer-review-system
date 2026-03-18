"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plus, Pencil, Trash2, PenLine } from "lucide-react";
import { toast } from "sonner";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface Employee {
  id: string;
  name: string;
  email: string;
  team: string;
  position: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  isActive: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자",
  MANAGER: "팀장",
  EMPLOYEE: "직원",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // 직원 추가/수정 다이얼로그
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    team: "",
    position: "",
    role: "EMPLOYEE",
  });

  // 새 팀 직접 입력 모드
  const [isNewTeam, setIsNewTeam] = useState(false);

  // 팀 이름 수정 다이얼로그
  const [teamRenameOpen, setTeamRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState("");
  const [newTeamName, setNewTeamName] = useState("");

  const fetchEmployees = () => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then(setEmployees)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const activeEmployees = employees.filter((e) => e.isActive);
  const inactiveEmployees = employees.filter((e) => !e.isActive);
  const teams = [...new Set(activeEmployees.map((e) => e.team))].sort();

  // --- 직원 추가/수정 ---
  function resetForm() {
    setFormData({ name: "", email: "", team: "", position: "", role: "EMPLOYEE" });
    setEditTarget(null);
    setIsNewTeam(false);
  }

  function openAddDialog(presetTeam?: string) {
    resetForm();
    if (presetTeam) {
      setFormData((p) => ({ ...p, team: presetTeam }));
    }
    setDialogOpen(true);
  }

  function openEditDialog(emp: Employee) {
    setEditTarget(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      team: emp.team,
      position: emp.position,
      role: emp.role,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.team || !formData.position) {
      toast.error("모든 필수 항목을 입력해주세요");
      return;
    }

    try {
      if (editTarget) {
        const res = await fetch(`/api/employees/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error();
        toast.success("직원 정보가 수정되었습니다");
      } else {
        const res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "등록 실패");
        }
        toast.success("직원이 등록되었습니다");
      }
      setDialogOpen(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "처리에 실패했습니다");
    }
  }

  async function handleDelete(emp: Employee) {
    if (!confirm(`${emp.name}님을 비활성화하시겠습니까?`)) return;

    try {
      await fetch(`/api/employees/${emp.id}`, { method: "DELETE" });
      toast.success("비활성화 완료");
      fetchEmployees();
    } catch {
      toast.error("처리에 실패했습니다");
    }
  }

  // --- 팀 이름 수정 ---
  function openTeamRename(team: string) {
    setRenameTarget(team);
    setNewTeamName(team);
    setTeamRenameOpen(true);
  }

  async function handleTeamRename(e: React.FormEvent) {
    e.preventDefault();

    if (!newTeamName.trim()) {
      toast.error("팀 이름을 입력해주세요");
      return;
    }
    if (newTeamName === renameTarget) {
      setTeamRenameOpen(false);
      return;
    }

    try {
      // 해당 팀의 모든 직원의 team 필드를 일괄 변경
      const teamMembers = activeEmployees.filter((e) => e.team === renameTarget);
      await Promise.all(
        teamMembers.map((emp) =>
          fetch(`/api/employees/${emp.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team: newTeamName.trim() }),
          })
        )
      );
      toast.success(`팀 이름이 "${newTeamName.trim()}"(으)로 변경되었습니다`);
      setTeamRenameOpen(false);
      fetchEmployees();
    } catch {
      toast.error("팀 이름 변경에 실패했습니다");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
            >
              <ArrowLeft className="h-4 w-4" />
              돌아가기
            </Link>
            <h1 className="text-xl font-bold">직원 관리</h1>
          </div>

          <Button onClick={() => openAddDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            직원 추가
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>전체: {activeEmployees.length}명</span>
          <span>팀: {teams.length}개</span>
          {inactiveEmployees.length > 0 && (
            <span>비활성: {inactiveEmployees.length}명</span>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">로딩 중...</p>
        ) : activeEmployees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                등록된 직원이 없습니다. 직원을 추가해주세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          teams.map((team) => (
            <Card key={team}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {team}
                    <Badge variant="secondary">
                      {activeEmployees.filter((e) => e.team === team).length}명
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openTeamRename(team)}
                      title="팀 이름 수정"
                    >
                      <PenLine className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddDialog(team)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    인원 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>직급</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeEmployees
                      .filter((e) => e.team === team)
                      .map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {emp.email}
                          </TableCell>
                          <TableCell>{emp.position}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                emp.role === "ADMIN"
                                  ? "destructive"
                                  : emp.role === "MANAGER"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {ROLE_LABELS[emp.role]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => openEditDialog(emp)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleDelete(emp)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* 직원 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "직원 정보 수정" : "새 직원 등록"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-2">
              <Label>이메일 *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="gildong.hong@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>팀 *</Label>
              {!isNewTeam && teams.length > 0 ? (
                <div className="space-y-2">
                  <select
                    className={selectClass}
                    value={formData.team}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setIsNewTeam(true);
                        setFormData((p) => ({ ...p, team: "" }));
                      } else {
                        setFormData((p) => ({ ...p, team: e.target.value }));
                      }
                    }}
                  >
                    <option value="">팀을 선택하세요</option>
                    {teams.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="__new__">+ 새 팀 추가</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={formData.team}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, team: e.target.value }))
                    }
                    placeholder="새 팀명 입력"
                    autoFocus={isNewTeam}
                  />
                  {isNewTeam && teams.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsNewTeam(false);
                        setFormData((p) => ({ ...p, team: "" }));
                      }}
                    >
                      취소
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>직급 *</Label>
              <Input
                value={formData.position}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, position: e.target.value }))
                }
                placeholder="시니어 마케터"
              />
            </div>
            <div className="space-y-2">
              <Label>역할</Label>
              <select
                className={selectClass}
                value={formData.role}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, role: e.target.value }))
                }
              >
                <option value="EMPLOYEE">직원</option>
                <option value="MANAGER">팀장</option>
                <option value="ADMIN">관리자</option>
              </select>
            </div>
            <Button type="submit" className="w-full">
              {editTarget ? "수정" : "등록"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 팀 이름 수정 다이얼로그 */}
      <Dialog open={teamRenameOpen} onOpenChange={setTeamRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀 이름 수정</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTeamRename} className="space-y-4">
            <div className="space-y-2">
              <Label>현재 팀 이름</Label>
              <Input value={renameTarget} disabled />
            </div>
            <div className="space-y-2">
              <Label>새 팀 이름</Label>
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="새 팀 이름 입력"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">
              변경
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
