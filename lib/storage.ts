export interface StorageProvider {
  store(file: Buffer, filename: string): Promise<string>;
  retrieve(identifier: string): Promise<Buffer>;
}

export class LocalDatabaseStorage implements StorageProvider {
  async store(file: Buffer, filename: string): Promise<string> {
    return file.toString("base64");
  }

  async retrieve(identifier: string): Promise<Buffer> {
    return Buffer.from(identifier, "base64");
  }
}

export class AWSStorage implements StorageProvider {
  async store(file: Buffer, filename: string): Promise<string> {
    throw new Error("AWS Storage not implemented");
  }

  async retrieve(identifier: string): Promise<Buffer> {
    throw new Error("AWS Storage not implemented");
  }
}

export const storage: StorageProvider = new LocalDatabaseStorage();
