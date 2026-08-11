import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImagePicker, type PickedImage } from './ImagePicker'

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const { getUploadUrl, resolveStorageUrls, compressImage } = vi.hoisted(() => ({
  getUploadUrl: vi.fn(),
  resolveStorageUrls: vi.fn(),
  compressImage: vi.fn(async (file: File) => file),
}))

vi.mock('sonner', () => ({ toast }))

vi.mock('@/lib/actions/events', () => ({
  getUploadUrl,
  resolveStorageUrls,
}))

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>()
  return { ...actual, compressImage }
})

function pngFile(name: string, sizeMb = 0.5): File {
  const bytes = Math.round(sizeMb * 1024 * 1024)
  return new File([new Uint8Array(bytes)], name, { type: 'image/png' })
}

function renderPicker({
  images = [],
  max,
  onChange,
}: {
  images?: PickedImage[]
  max?: number
  onChange: (next: PickedImage[]) => void
}) {
  return render(
    <ImagePicker
      images={images}
      onChange={onChange}
      aspectRatio="original"
      onAspectRatioChange={vi.fn()}
      max={max}
    />,
  )
}

function fileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement
}

beforeEach(() => {
  vi.clearAllMocks()
  getUploadUrl.mockResolvedValue('https://example.com/upload')
  resolveStorageUrls.mockResolvedValue(['https://example.com/image.jpg'])
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ storageId: 'st1' }) }),
  )
  URL.createObjectURL = vi.fn(() => 'blob:mock')
  URL.revokeObjectURL = vi.fn()
})

describe('ImagePicker', () => {
  it('uploads a valid image and reports it through onChange', async () => {
    const onChange = vi.fn()
    renderPicker({ onChange })

    fireEvent.change(fileInput(), { target: { files: [pngFile('poster.png')] } })

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    const next = onChange.mock.calls[0][0] as PickedImage[]
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({
      url: 'https://example.com/image.jpg',
      storageId: 'st1',
      filter: 'original',
    })
    expect(getUploadUrl).toHaveBeenCalledOnce()
  })

  it('rejects an oversized file with an error toast', async () => {
    const onChange = vi.fn()
    renderPicker({ onChange })

    fireEvent.change(fileInput(), { target: { files: [pngFile('huge.png', 7)] } })

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('max is 6 MB'))
    expect(getUploadUrl).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('rejects a non-image file type', () => {
    const onChange = vi.fn()
    renderPicker({ onChange })
    fireEvent.change(fileInput(), {
      target: { files: [new File([new Uint8Array(10)], 'doc.pdf', { type: 'application/pdf' })] },
    })
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('not a supported format'))
    expect(getUploadUrl).not.toHaveBeenCalled()
  })

  it('does not upload when the max is already reached', () => {
    const onChange = vi.fn()
    const images: PickedImage[] = [
      { url: 'https://example.com/a.jpg', storageId: 'a', filter: 'original' },
    ]
    renderPicker({ images, max: 1, onChange })

    fireEvent.change(fileInput(), { target: { files: [pngFile('extra.png')] } })

    expect(toast.error).toHaveBeenCalledWith('Maximum 1 images')
    expect(getUploadUrl).not.toHaveBeenCalled()
  })

  it('moves an image right via the tile controls', () => {
    const onChange = vi.fn()
    const images: PickedImage[] = [
      { url: 'https://example.com/a.jpg', storageId: 'a', filter: 'original' },
      { url: 'https://example.com/b.jpg', storageId: 'b', filter: 'original' },
    ]
    renderPicker({ images, onChange })

    const moveRights = screen.getAllByLabelText('Move right')
    fireEvent.click(moveRights[0])

    expect(onChange).toHaveBeenCalledWith([images[1], images[0]])
  })

  it('applies a filter change to an image', () => {
    const onChange = vi.fn()
    const images: PickedImage[] = [
      { url: 'https://example.com/a.jpg', storageId: 'a', filter: 'original' },
    ]
    renderPicker({ images, onChange })

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mono' } })

    expect(onChange).toHaveBeenCalledWith([{ ...images[0], filter: 'mono' }])
  })

  it('removes an image', () => {
    const onChange = vi.fn()
    const images: PickedImage[] = [
      { url: 'https://example.com/a.jpg', storageId: 'a', filter: 'original' },
    ]
    renderPicker({ images, onChange })

    fireEvent.click(screen.getByLabelText('Remove image'))

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('requires a second click to clear all images', () => {
    const onChange = vi.fn()
    const images: PickedImage[] = [
      { url: 'https://example.com/a.jpg', storageId: 'a', filter: 'original' },
    ]
    renderPicker({ images, onChange })

    fireEvent.click(screen.getByText('Clear all'))
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Confirm'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('reorders images by drag and drop', () => {
    const onChange = vi.fn()
    const images: PickedImage[] = [
      { url: 'https://example.com/a.jpg', storageId: 'a', filter: 'original' },
      { url: 'https://example.com/b.jpg', storageId: 'b', filter: 'original' },
      { url: 'https://example.com/c.jpg', storageId: 'c', filter: 'original' },
    ]
    const { container } = renderPicker({ images, onChange })

    const tile = (alt: string) =>
      screen.getByAltText(alt).closest('[draggable="true"]') as HTMLElement
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: 'move' }

    fireEvent.dragStart(tile('Image 1'), { dataTransfer })
    fireEvent.dragOver(tile('Image 3'), { dataTransfer })
    fireEvent.drop(container.querySelector('.grid') as HTMLElement, { dataTransfer })

    expect(onChange).toHaveBeenCalledWith([images[1], images[2], images[0]])
  })

  it('accepts files dropped on the dropzone', async () => {
    const onChange = vi.fn()
    const { container } = renderPicker({ onChange })

    fireEvent.drop(container.querySelector('[class*="border-dashed"]') as HTMLElement, {
      dataTransfer: { files: [pngFile('dropped.png')] },
    })

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(getUploadUrl).toHaveBeenCalledOnce()
  })

  it('shows an inline error tile when the upload fails', async () => {
    const onChange = vi.fn()
    getUploadUrl.mockRejectedValueOnce(new Error('no url'))
    renderPicker({
      images: [{ url: 'https://example.com/a.jpg', storageId: 'a', filter: 'original' }],
      onChange,
    })

    fireEvent.change(fileInput(), { target: { files: [pngFile('poster.png')] } })

    expect(await screen.findByText('no url')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })
})
