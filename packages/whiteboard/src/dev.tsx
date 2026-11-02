import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Whiteboard } from './index'
import { IWhiteboard, IWhiteboardNode, IWhiteboardEdge } from './types/whiteboard'

const initialNodes: IWhiteboardNode[] = [
    {
        id: 1,
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        content: [{ type: 'paragraph', children: [{ text: 'Hello Whiteboard' }] }],
        z: 1
    },
    {
        id: 2,
        type: 'text',
        x: 500,
        y: 200,
        width: 200,
        height: 100,
        content: [{ type: 'paragraph', children: [{ text: 'Drag me!' }] }],
        z: 2
    },
    {
        id: 3,
        type: 'text',
        x: 300,
        y: 400,
        width: 200,
        height: 100,
        content: [{ type: 'paragraph', children: [{ text: 'Connect me!' }] }],
        z: 3
    }
]

const initialEdges: IWhiteboardEdge[] = [
    {
        id: 1,
        sourceId: 1,
        targetId: 2,
        sourcePosition: 'right',
        targetPosition: 'left'
    }
]

const App = () => {
    const [whiteboard, setWhiteboard] = useState<IWhiteboard>({
        nodes: initialNodes,
        edges: initialEdges
    })

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Whiteboard
                value={whiteboard}
                onChange={setWhiteboard}
                snapMode="mixed-8"
                edgeSnapRadius={48}
            />
        </div>
    )
}

const container = document.getElementById('root')
if (container) {
    const root = createRoot(container)
    root.render(<App />)
}
