import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/** Matches \[...\] (display) and \(...\) (inline) LaTeX regions. */
const MATH_RE = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g

interface Part {
	type: 'text' | 'math'
	content: string
	display: boolean
}

function splitMath(text: string): Part[] {
	const parts: Part[] = []
	MATH_RE.lastIndex = 0
	let lastIndex = 0
	let match: RegExpExecArray | null
	while ((match = MATH_RE.exec(text)) !== null) {
		if (match.index > lastIndex) {
			parts.push({ type: 'text', content: text.slice(lastIndex, match.index), display: false })
		}
		const raw = match[0]
		const display = raw.startsWith('\\[')
		const inner = raw.slice(2, raw.length - 2).trim()
		parts.push({ type: 'math', content: inner, display })
		lastIndex = match.index + raw.length
	}
	if (lastIndex < text.length) {
		parts.push({ type: 'text', content: text.slice(lastIndex), display: false })
	}
	return parts.length ? parts : [{ type: 'text', content: text, display: false }]
}

interface MathMarkdownProps {
	children?: string
	className?: string
}

export default function MathMarkdown({ children, className }: MathMarkdownProps) {
	if (!children) return null
	const parts = splitMath(children)

	return (
		<>
			{parts.map((part, i) => {
				if (part.type === 'math') {
					try {
						const html = katex.renderToString(part.content, {
							displayMode: part.display,
							throwOnError: false,
							trust: false,
						})
						if (part.display) {
							return (
								<div
									key={i}
									className='my-2 overflow-x-auto text-center'
									dangerouslySetInnerHTML={{ __html: html }}
								/>
							)
						}
						return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
					} catch {
						return <code key={i}>{part.content}</code>
					}
				}
				if (!part.content.trim()) return null
				return (
					<Markdown key={i} remarkPlugins={[remarkGfm]} className={className}>
						{part.content}
					</Markdown>
				)
			})}
		</>
	)
}
