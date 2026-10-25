// scripts/pre-push.ts 가 Node 로 바로 불러서 경로 별칭(~/) 대신 상대 경로를 쓴다
const ZERO = /^0+$/

// git 이 pre-push hook 의 stdin 으로 넘기는 줄에서 main 으로 가는 push 만 고른다.
// 한 줄은 "<로컬 ref> <로컬 sha> <원격 ref> <원격 sha>" 다. 지우는 push 는 로컬 sha 가, 새로 만드는 push 는 원격 sha 가 0 이 40개다
export function mainPushes(stdin: string): Array<{ base?: string; head: string }> {
  const pushes: Array<{ base?: string; head: string }> = []
  for (const line of stdin.split('\n')) {
    const [, head, remoteRef, base] = line.trim().split(/\s+/)
    if (remoteRef !== 'refs/heads/main' || head === undefined || ZERO.test(head)) continue
    pushes.push(base === undefined || ZERO.test(base) ? { head } : { base, head })
  }
  return pushes
}
