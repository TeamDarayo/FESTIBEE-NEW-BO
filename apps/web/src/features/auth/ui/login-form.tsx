"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@festibee/ui";
import { useAuthStore } from "../model/auth-store";
import { verifyAdminPassword } from "../api/auth-api";
import {
  API_SERVERS,
  type ApiServerEnv,
  ROUTES,
} from "@/shared/config/constants";

export function LoginForm() {
  const router = useRouter();
  const { apiServer, setAdminPassword, setAuthenticated, setApiServer } =
    useAuthStore();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      setAdminPassword(password);
      await verifyAdminPassword();
      setAuthenticated(true);
      router.push(ROUTES.DASHBOARD);
    } catch {
      setError("비밀번호가 올바르지 않습니다.");
      setAdminPassword("");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Festibee 관리자</CardTitle>
        <CardDescription>관리자 비밀번호를 입력하세요</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server">서버 환경</Label>
            <Select
              value={apiServer}
              onValueChange={(v) => setApiServer(v as ApiServerEnv)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(API_SERVERS).map(([key, server]) => (
                  <SelectItem key={key} value={key}>
                    {server.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="관리자 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "확인 중..." : "로그인"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
