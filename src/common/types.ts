export interface ChangeSetResp {
  sequenceNumber: number
  stateDate: number
  changesets: Changeset[]
}

export interface Changeset {
  id: string
  created_at: string
  closed_at?: string
  open: string
  num_changes: string
  user: string
  uid: string
  min_lat: number
  max_lat: number
  min_lon: number
  max_lon: number
  comments_count: string
}
