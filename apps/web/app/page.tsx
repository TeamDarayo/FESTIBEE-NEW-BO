import { Button, Card, CardContent, CardHeader, CardTitle } from "@festibee/ui";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Festibee Back Office</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            모노레포 구조가 성공적으로 설정되었습니다.
          </p>
          <div className="flex gap-2">
            <Button>시작하기</Button>
            <Button variant="outline">문서 보기</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
