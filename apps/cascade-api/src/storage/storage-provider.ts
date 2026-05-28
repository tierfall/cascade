export interface PutObjectInput {
  key: string;
  body: Buffer;
  contentType?: string;
}

export interface GetObjectResult {
  body: Buffer;
  contentType?: string;
}

export interface StorageProvider {
  put(input: PutObjectInput): Promise<void>;
  get(key: string): Promise<GetObjectResult | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
