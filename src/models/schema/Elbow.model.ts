import { DatasetRow } from './KMeans.model';

export interface ElbowRequest{
    dataset: DatasetRow[],
    kMax: number
}

export interface ElbowPoint{
    k:number,
    inercia: number
}
export interface ElbowResponse{
    inercias: ElbowPoint[]
}