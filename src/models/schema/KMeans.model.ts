export type DatasetRow = Record<string, any>;

export interface KMeansRequest {
    dataset: DatasetRow[],
    ids: string[],
    k: number,
    incluirPCA: boolean
}

export interface KMeansResponse{
    labels: number[],
    centroides: number[][],
    inercia: number,
    pca2d: number[][] | null
}