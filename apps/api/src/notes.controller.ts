// apps/api/src/notes/notes.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './notes/dto/create-note.dto';
import { JwtAuthGuard } from './auth/guards/jwt.auth.guard';

@Controller('notes')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class NotesController {
  private readonly logger = new Logger(NotesController.name);

  constructor(private readonly notesService: NotesService) {}

  @Post()
  async create(@Req() req, @Body() createNoteDto: CreateNoteDto) {
    // req.user is populated by JwtAuthGuard from the token
    const userId = req.user.sub; // 'sub' usually holds the user ID from Supabase JWT
    if (!userId) {
      this.logger.warn('User ID not found in request after JWT auth.');
      throw new Error('User ID missing from token payload.');
    }
    this.logger.log(
      `User ${userId} creating note with content: ${createNoteDto.content.substring(0, 20)}...`,
    );
    return this.notesService.create(userId, createNoteDto);
  }

  @Get()
  async findAll(@Req() req) {
    const userId = req.user.sub;
    if (!userId) {
      this.logger.warn('User ID not found in request after JWT auth.');
      throw new Error('User ID missing from token payload.');
    }
    this.logger.log(`User ${userId} fetching all their notes.`);
    return this.notesService.findAllForUser(userId);
  }
}
