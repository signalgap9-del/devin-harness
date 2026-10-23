# devin-harness

**에이전트 레포용 오픈소스 하네스** — 훅, 가드, 타입드 리뷰 게이트, 디스패치 계약, 큐레이션된 스택. 멀티테넌트 SaaS를 자율 에이전트로 수개월 운영하면서 증류한 실전 세팅. 아무 repo에나 복사하면 에이전트가 빈 컨텍스트 대신 가드레일+규칙+관측 가능한 배포를 갖고 시작한다.

[English](README.md) · 한국어

## 들어있는 것

| 구성 | 경로 | 역할 |
|---|---|---|
| 명령 가드 | `ops/verify/agent-guard.mjs` | PreToolUse 훅 — 위험 명령을 실행 전 결정론적으로 차단 (<50ms, 모델 없음) |
| 파일 가드 | `ops/verify/file-guard.mjs` | edit/write 차단 — 시크릿 파일, 마이그레이션, 런타임 상태 |
| 행동 원장 | `ops/verify/agent-ledger.mjs` | PostToolUse — 모든 툴 호출을 `action-log.jsonl`에 기록 (시크릿 마스킹) → 세션 자체를 심사 가능 |
| 세션 시작 | `ops/verify/session-start.mjs` | 더티 트리, 스테일 락, 미해결 리뷰, 인시던트 — 세션이 상황을 알고 시작 |
| 프롬프트 가드 | `ops/verify/prompt-guard.mjs` | 외부지식 질문 감지 → 소스 검증 강제 주입; 도구 질문 → 스택 카탈로그 조회 강제 |
| 클레임 가드 | `ops/verify/claim-guard.mjs` | 편집 후 테스트 없이 done → "unverified" 경고 |
| 리뷰 게이트 | `ops/verify/gate.mjs` + `dep-audit.mjs` + `jev-gate.mjs` | diff 스캔 → npm 공급망 감사 → Jev 타입드 판정 (14개 제약, plan-drift 감지, `state.json` 리뷰 메모리 — 해소된 발견은 재차단 없음) |
| 훅 배선 | `.devin/config.json` + `hooks.v1.json` | Pre/PostToolUse 활성 + 확장 라이프사이클 예시 |
| 스킬 | `.devin/skills/` | 자동 발화 스킬 — verify-with-sources(1차 소스 강제), use-the-stack(안티-핸드롤링 라우터) 등 |
| 지식베이스 | `docs/` | 패턴 라이브러리: 관측성, 온콜 배선, 에이전트 오케스트레이션, OSS 스택(69개 큐레이션), 리서치 canon, 벤치마크 표준 |

## 설치

```bash
git clone https://github.com/signalgap9-del/devin-harness
cd devin-harness
node setup.mjs /path/to/your/repo          # 훅+가드+스킬+템플릿 복사
node setup.mjs /path/to/repo --with-docs   # 지식 문서까지
```

기존 파일은 `--force` 없이 덮어쓰지 않음. 그 다음 `AGENTS.md`를 프로젝트에 맞게 어댑트 (`docs/agents-md-layering.md` 참고).

```bash
npm test          # 하네스 자체 테스트 (node --test)
npm run review    # Jev diff 게이트 (TYPESAFE_API_KEY 있으면 모델층 활성)
npm run dep-audit # 신규 dependency 공급망 감사
```

## 철학

프롬프트 규칙은 세션이 길어지면 잊힌다 — 훅은 설득할 수 없다. 모든 가드는
<50ms에 결정론적으로 도는 스크립트; 모델은 판단이 필요한 곳(diff 리뷰)에만
쓰고, 사실 체크는 결정론이 가로막는다. 배포 게이트는 `npm run deploy` **안에**
박혀 있어서 우회가 불가능이지 권고가 아니다.

도움이 됐다면: `gh repo star signalgap9-del/devin-harness`

MIT.
