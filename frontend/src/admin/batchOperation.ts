export type BatchOperationItem = {
  targetId: string
  success: boolean
  status: string
  message: string | null
}

export type BatchOperationResultResponse = {
  successCount: number
  failureCount: number
  items: BatchOperationItem[]
}
