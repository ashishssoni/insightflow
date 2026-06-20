import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Collection, Db, MongoClient } from 'mongodb';
import { env } from '../config/env';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private client!: MongoClient;
  private db!: Db;

  async onModuleInit() {
    this.client = new MongoClient(env.MONGODB_URL);
    await this.client.connect();
    this.db = this.client.db();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  collection<T extends object>(name: string): Collection<T> {
    return this.db.collection<T>(name);
  }
}
