export type Options = {
  dryRun: boolean
  force: boolean
}

export type Template = {
  dirs: string[]
  files: Record<string, string>
  marker: string
}

export type StatusItem = {
  kind: 'dir' | 'file'
  relPath: string
  exists: boolean
}

export type AuditResult = {
  moduleName: string
  modulePath: string
  expected: StatusItem[]
  extras: string[]
  warnings: string[]
}

export type WriteAction = 'created' | 'overwritten' | 'skipped' | 'skipped-protected'

export type WriteResult = {
  action: WriteAction
}