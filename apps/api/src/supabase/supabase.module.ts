import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseDBService } from './supabase-db.service';

@Global() // Make SupabaseDBService available globally
@Module({
  imports: [ConfigModule], // ConfigService needs to be available
  providers: [SupabaseDBService],
  exports: [SupabaseDBService],
})
export class SupabaseProviderModule {} // Renamed for clarity as it provides Supabase services
