// apps/api/src/notes/notes.module.ts
import { Module } from '@nestjs/common';
import { NotesService } from 'src/notes.service';
import { NotesController } from 'src/notes.controller';
// SupabaseProviderModule is global, so SupabaseDBService is available.
// AuthModule might be needed if you re-export JwtAuthGuard specifically for this module,
// but if JwtAuthGuard is globally available or exported correctly from AuthModule, it's fine.

@Module({
  // imports: [AuthModule], // Only if JwtAuthGuard is not globally available via AuthModule's exports
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
