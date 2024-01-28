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
  min_lat: string
  max_lat: string
  min_lon: string
  max_lon: string
  comments_count: string
}
