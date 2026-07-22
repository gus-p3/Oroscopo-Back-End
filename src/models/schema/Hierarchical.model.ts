import { DatasetRow } from './KMeans.model';

export type MetodoEnlace = 'ward' | 'average' | 'complete';


export interface HierarchicalRequest{
    dataset: DatasetRow[],
    ids: string[],
    metodoEnlace: MetodoEnlace
}

export interface HierarchicalResponse{
    linkageMatrix: number[][],
    labelsOrden: string[]
}