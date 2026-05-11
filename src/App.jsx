import { Button, Cell, NavBar } from 'react-vant'

function App() {
  return (
    <div>
      <NavBar title="Bob Frontend" />
      <Cell.Group>
        <Cell title="react-vant is ready" value="✓" />
      </Cell.Group>
      <div style={{ padding: 16 }}>
        <Button type="primary" block>
          Get Started
        </Button>
      </div>
    </div>
  )
}

export default App
