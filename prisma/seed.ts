import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 기존 데이터 삭제
  await prisma.result.deleteMany();
  await prisma.responseAnon.deleteMany();
  await prisma.responseRaw.deleteMany();
  await prisma.exclusion.deleteMany();
  await prisma.evalToken.deleteMany();
  await prisma.evalRound.deleteMany();
  await prisma.employee.deleteMany();

  console.log("기존 데이터 삭제 완료");

  // HR 관리자 1명
  const admin = await prisma.employee.create({
    data: {
      name: "김하영",
      email: "hayoung.kim@company.com",
      team: "경영지원",
      position: "HR 매니저",
      role: "ADMIN",
    },
  });
  console.log(`HR 관리자 생성: ${admin.name}`);

  // 4개 팀 × 5명 = 20명 (팀장 포함)
  const teams = [
    {
      name: "퍼포먼스마케팅",
      members: [
        { name: "박준호", position: "팀장", role: "MANAGER" as const },
        { name: "이서윤", position: "시니어 마케터", role: "EMPLOYEE" as const },
        { name: "정민재", position: "마케터", role: "EMPLOYEE" as const },
        { name: "한소희", position: "마케터", role: "EMPLOYEE" as const },
        { name: "오진우", position: "주니어 마케터", role: "EMPLOYEE" as const },
      ],
    },
    {
      name: "UGC마케팅",
      members: [
        { name: "최예나", position: "팀장", role: "MANAGER" as const },
        { name: "김도현", position: "시니어 크리에이터", role: "EMPLOYEE" as const },
        { name: "박서연", position: "크리에이터", role: "EMPLOYEE" as const },
        { name: "이하준", position: "크리에이터", role: "EMPLOYEE" as const },
        { name: "장유진", position: "주니어 크리에이터", role: "EMPLOYEE" as const },
      ],
    },
    {
      name: "콘텐츠마케팅",
      members: [
        { name: "이민준", position: "팀장", role: "MANAGER" as const },
        { name: "송지아", position: "시니어 에디터", role: "EMPLOYEE" as const },
        { name: "윤태호", position: "에디터", role: "EMPLOYEE" as const },
        { name: "배수빈", position: "디자이너", role: "EMPLOYEE" as const },
        { name: "구하린", position: "주니어 에디터", role: "EMPLOYEE" as const },
      ],
    },
    {
      name: "CRM마케팅",
      members: [
        { name: "김지수", position: "팀장", role: "MANAGER" as const },
        { name: "안재현", position: "시니어 분석가", role: "EMPLOYEE" as const },
        { name: "류다은", position: "분석가", role: "EMPLOYEE" as const },
        { name: "임성훈", position: "데이터 엔지니어", role: "EMPLOYEE" as const },
        { name: "홍채원", position: "주니어 분석가", role: "EMPLOYEE" as const },
      ],
    },
  ];

  for (const team of teams) {
    for (const member of team.members) {
      const emailMap: Record<string, string> = {
        박준호: "junho.park",
        이서윤: "seoyun.lee",
        정민재: "minjae.jung",
        한소희: "sohee.han",
        오진우: "jinwoo.oh",
        최예나: "yena.choi",
        김도현: "dohyun.kim",
        박서연: "seoyeon.park",
        이하준: "hajun.lee",
        장유진: "yujin.jang",
        이민준: "minjun.lee",
        송지아: "jia.song",
        윤태호: "taeho.yoon",
        배수빈: "subin.bae",
        구하린: "harin.gu",
        김지수: "jisoo.kim",
        안재현: "jaehyun.an",
        류다은: "daeun.ryu",
        임성훈: "sunghoon.lim",
        홍채원: "chaewon.hong",
      };

      await prisma.employee.create({
        data: {
          name: member.name,
          email: `${emailMap[member.name]}@company.com`,
          team: team.name,
          position: member.position,
          role: member.role,
        },
      });
    }
    console.log(`${team.name} 팀 5명 생성 완료`);
  }

  const totalCount = await prisma.employee.count();
  console.log(`\n시드 완료: 총 ${totalCount}명 (HR 관리자 1명 + 직원 20명)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
