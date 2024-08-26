import { setTimeout } from "timers/promises"

export default async function Home() {
  await setTimeout(5000)

  return <main />
}
