import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseDBService implements OnModuleInit {
  private client: SupabaseClient;
  private readonly logger = new Logger(SupabaseDBService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_KEY',
    );

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      this.logger.error('Supabase URL or Service Role Key is not configured!');
      throw new Error('Supabase URL or Service Role Key is not configured!');
    }

    this.client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false, // We are using service role, no user session needed here
        autoRefreshToken: false,
      },
    });
    this.logger.log('Supabase client initialized for database operations.');
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      this.logger.error(
        'Supabase client requested before initialization or init failed.',
      );
      throw new Error('Supabase client is not initialized.');
    }
    return this.client;
  }
}
