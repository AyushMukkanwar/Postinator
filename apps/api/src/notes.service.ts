// apps/api/src/notes/notes.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseDBService } from './supabase/supabase-db.service';
import { CreateNoteDto } from './notes/dto/create-note.dto';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(private readonly supabaseDBService: SupabaseDBService) {}

  async create(userId: string, createNoteDto: CreateNoteDto) {
    const supabase = this.supabaseDBService.getClient();
    const { content } = createNoteDto;

    this.logger.log(`Attempting to create note for user ${userId}`);

    const { data, error } = await supabase
      .from('notes')
      .insert([{ user_id: userId, content: content }])
      .select() // To get the created record back
      .single(); // Expecting a single record

    if (error) {
      this.logger.error(
        `Error creating note for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to create note: ' + error.message,
      );
    }

    this.logger.log(
      `Note created successfully for user ${userId}: ${JSON.stringify(data)}`,
    );
    return data;
  }

  async findAllForUser(userId: string) {
    const supabase = this.supabaseDBService.getClient();
    this.logger.log(`Fetching notes for user ${userId}`);

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(
        `Error fetching notes for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch notes: ' + error.message,
      );
    }
    this.logger.log(`Found ${data?.length || 0} notes for user ${userId}`);
    return data;
  }
}
