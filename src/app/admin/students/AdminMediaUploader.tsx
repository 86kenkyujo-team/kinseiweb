'use client'

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

type AdminMediaUploaderProps = {
  accept: string
  helpText: string
  initialUrl?: string | null
  kind: 'image' | 'video'
  label: string
  maxSizeMb: number
  name: string
}

const bucketName = process.env.NEXT_PUBLIC_STUDENT_MEDIA_BUCKET || 'student-media'

function sanitizeFileName(fileName: string) {
  return (
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'student-media'
  )
}

function createStoragePath(kind: AdminMediaUploaderProps['kind'], file: File) {
  const date = new Date().toISOString().slice(0, 10)
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `students/${kind}/${date}/${id}-${sanitizeFileName(file.name)}`
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

export function AdminMediaUploader({
  accept,
  helpText,
  initialUrl,
  kind,
  label,
  maxSizeMb,
  name,
}: AdminMediaUploaderProps) {
  const fileInputId = useId()
  const urlInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const localPreviewUrlRef = useRef<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [url, setUrl] = useState(initialUrl || '')
  const maxSizeBytes = maxSizeMb * 1024 * 1024
  const previewUrl = localPreviewUrl || url
  const isSelectedFileTooLarge = Boolean(selectedFile && selectedFile.size > maxSizeBytes)

  useEffect(() => {
    return () => {
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current)
      }
    }
  }, [])

  function updateLocalPreview(file: File | null) {
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current)
    }

    const nextPreviewUrl = file ? URL.createObjectURL(file) : null
    localPreviewUrlRef.current = nextPreviewUrl
    setLocalPreviewUrl(nextPreviewUrl)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setErrorMessage('')
    setSuccessMessage('')
    setSelectedFile(file)
    updateLocalPreview(file)

    if (file && file.size > maxSizeBytes) {
      setErrorMessage(`${maxSizeMb}MB以内のファイルを選んでください。`)
    }
  }

  async function uploadFile() {
    if (!selectedFile) {
      setErrorMessage('先にファイルを選んでください。')
      return
    }

    if (selectedFile.size > maxSizeBytes) {
      setErrorMessage(`${maxSizeMb}MB以内のファイルを選んでください。`)
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsUploading(true)

    try {
      const supabase = createClient()
      const storagePath = createStoragePath(kind, selectedFile)
      const { error } = await supabase.storage.from(bucketName).upload(storagePath, selectedFile, {
        cacheControl: '3600',
        contentType: selectedFile.type || undefined,
      })

      if (error) {
        throw error
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath)
      setUrl(data.publicUrl)
      setSelectedFile(null)
      updateLocalPreview(null)
      setSuccessMessage('アップロードしました。URL欄に自動で反映されています。')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'アップロードできませんでした。')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="admin-media-field full">
      <div className="admin-field-heading">
        <div>
          <span className="admin-field-label">{label}</span>
          <span className="admin-field-hint">{helpText}</span>
        </div>
        <span className="admin-media-badge">{kind === 'image' ? '画像' : '動画'}</span>
      </div>

      <div className="admin-media-uploader">
        <div className="admin-media-preview">
          {previewUrl ? (
            kind === 'image' ? (
              <img alt={`${label}のプレビュー`} src={previewUrl} />
            ) : (
              <video controls muted playsInline src={previewUrl} />
            )
          ) : (
            <span>まだ設定されていません</span>
          )}
        </div>

        <div className="admin-media-controls">
          <div className="admin-file-row">
            <label className="admin-file-picker" htmlFor={fileInputId}>
              ファイルを選択
              <input
                accept={accept}
                id={fileInputId}
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />
            </label>
            <span className="admin-selected-file">
              {selectedFile ? `${selectedFile.name}（${formatFileSize(selectedFile.size)}）` : 'ファイル未選択'}
            </span>
          </div>

          <button disabled={isUploading || !selectedFile || isSelectedFileTooLarge} onClick={uploadFile} type="button">
            {isUploading ? 'アップロード中...' : 'アップロードしてURLに反映'}
          </button>

          <label className="admin-url-input" htmlFor={urlInputId}>
            URL（自動入力・手入力どちらも可）
            <input
              id={urlInputId}
              name={name}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              value={url}
            />
          </label>

          <span className="admin-field-hint">アップロード後、この下のURL欄に自動で入ります。</span>
          {successMessage ? (
            <span aria-live="polite" className="admin-upload-message success">
              {successMessage}
            </span>
          ) : null}
          {errorMessage ? (
            <span aria-live="polite" className="admin-upload-message error">
              {errorMessage}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
