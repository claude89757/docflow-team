import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { UploadCard } from '../landing/UploadCard'

describe('UploadCard', () => {
  it('renders upload prompt text', () => {
    const { container } = render(<UploadCard onTask={vi.fn()} />)
    expect(container.textContent).toContain('拖拽文件到此处')
    expect(container.textContent).toContain('或点击选择文件')
  })

  it('shows file size limit', () => {
    const { container } = render(<UploadCard onTask={vi.fn()} />)
    expect(container.textContent).toContain('最大 10MB')
  })

  it('shows all supported format badges', () => {
    const { container } = render(<UploadCard onTask={vi.fn()} />)
    expect(container.textContent).toContain('.docx')
    expect(container.textContent).toContain('.pptx')
    expect(container.textContent).toContain('.xlsx')
    expect(container.textContent).toContain('.pdf')
  })

  it('shows error for unsupported file type on drop', async () => {
    const { container } = render(<UploadCard onTask={vi.fn()} />)
    const uploadArea = container.querySelector('[role="button"]')!

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    fireEvent.drop(uploadArea, {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => {
      expect(container.textContent).toContain('不支持的格式')
    })
  })

  it('shows error for oversized file on drop', async () => {
    const { container } = render(<UploadCard onTask={vi.fn()} />)
    const uploadArea = container.querySelector('[role="button"]')!

    const bigFile = new File(['x'], 'big.docx')
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 })

    fireEvent.drop(uploadArea, {
      dataTransfer: { files: [bigFile] },
    })

    await waitFor(() => {
      expect(container.textContent).toContain('文件过大')
    })
  })
})
