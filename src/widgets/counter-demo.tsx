import { useState } from 'react'

// 위젯 마운트를 시연하는 최소 위젯
export default function CounterDemo() {
  const [count, setCount] = useState(0)
  return (
    <button type="button" className="widget-counter" onClick={() => setCount((value) => value + 1)}>
      {count}
    </button>
  )
}
